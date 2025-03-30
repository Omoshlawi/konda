import { FleetRoutesModel } from "@/models";
import { GPSSensorDataSchema } from "@/schema";
import logger from "@/services/logger";
import {
  FleetRouteInterStageMovement,
  GPSSesorData,
  TraversalDirection,
} from "@/types";

import {
  getDistanceInMeteresBetweenTwoPoints,
  isWithinRadius,
} from "@/utils/geo";
import {
  getLatestEntriesFromStream,
  MessageHandler,
  publishToRedisStream,
} from "@/utils/stream";
import { RouteStage, Stage } from "dist/prisma";

/**
 * Handles GPS data stream events for fleet tracking and route stage progression
 */
export const gpsStreamHandler: MessageHandler<
  GPSSesorData,
  { topic: string; timeStamp: string }
> = async (streamKey, messageId, payload, metadata) => {
  try {
    const validation = await GPSSensorDataSchema.safeParseAsync(payload);
    if (!validation.success) {
      logger.warn(
        `Invalid GPS data received: ${JSON.stringify(
          payload
        )}.Error: ${JSON.stringify(validation.error.format())}`
      );
      return;
    }

    logger.debug(`Processing GPS data for fleet: ${payload.fleetNo}`, {
      lat: payload.latitude,
      lng: payload.longitude,
    });

    // Get active routes for this fleet
    const activeFleetRoute = await FleetRoutesModel.findFirst({
      where: {
        fleet: { name: payload.fleetNo },
        isActive: true,
        voided: false,
      },
      include: { route: { include: { stages: { include: { stage: true } } } } },
    });

    if (!activeFleetRoute) {
      logger.warn(`No active route found for fleet: ${payload.fleetNo}`);
      return;
    }

    const stagesInOrder = activeFleetRoute.route.stages.sort(
      (a, b) => a.order - b.order
    );
    if (stagesInOrder.length <= 1) {
      logger.error(
        `Route for fleet ${payload.fleetNo} has insufficient stages to track movement.`
      );
      return;
    }

    // Get the last known movement state for this fleet
    const lastEntries =
      await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        ({ data }) => data?.fleetNo === payload.fleetNo
      );

    const isAtFirstStage = isWithinRadius(
      [
        stagesInOrder.at(0)!.stage.latitude.toNumber(),
        stagesInOrder.at(0)!.stage.longitude.toNumber(),
      ],
      [payload.latitude, payload.longitude],
      stagesInOrder.at(0)!.stage.radius
    );
    const isAtLastStage = isWithinRadius(
      [
        stagesInOrder.at(-1)!.stage.latitude.toNumber(),
        stagesInOrder.at(-1)!.stage.longitude.toNumber(),
      ],
      [payload.latitude, payload.longitude],
      stagesInOrder.at(-1)!.stage.radius
    );
    logger.debug(
      `IsAtFirstStage: ${isAtFirstStage}, IsAtLastStage: ${isAtLastStage}, LastEntriesCount: ${
        lastEntries.length
      },  LastEntry: ${JSON.stringify(lastEntries)}`
    );

    if (!lastEntries.length) {
      logger.info(
        `No previous movement history found for fleet: ${payload.fleetNo}`
      );
      if (!isAtFirstStage && !isAtLastStage) {
        logger.error(
          `Fleet ${payload.fleetNo} detected outside of initial or final stage boundaries without prior movement history.`
        );
        return;
      }
      const direction: TraversalDirection = isAtLastStage
        ? "reverse"
        : "forward";
      const idx = direction === "forward" ? 0 : -1;
      const nextStage = findNextStage(
        stagesInOrder,
        stagesInOrder.at(idx)!.stageId,
        direction
      );
      await publishToRedisStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        {
          fleetNo: payload.fleetNo,
          routeName: activeFleetRoute.route.name,
          routeId: activeFleetRoute.route.id,
          currentStage: stagesInOrder.at(idx)!.stage.name,
          currentStageId: stagesInOrder.at(idx)!.stageId,
          nextStage: nextStage!.stage.name,
          nextStageId: nextStage!.stageId,
          traversalDirection: direction,
        }
      );
      logger.debug(
        `New fleet ${
          payload.fleetNo
        } published to movement stream with current stage ${
          stagesInOrder.at(idx)!.stage.name
        } and last next stage ${
          nextStage!.stage.name
        } and direction ${direction}`
      );
      return;
    } else {
      const { currentStageId, nextStageId, routeId, traversalDirection } =
        lastEntries[0]!.data;

      const currentStage = stagesInOrder.find(
        (s) => s.stageId === currentStageId
      );

      if (!currentStage) {
        logger.error(`Current stage not found: ${currentStageId}`);
        return;
      }

      const isAtCurrentStage = isWithinRadius(
        [payload.latitude, payload.longitude],
        [
          currentStage.stage.latitude.toNumber(),
          currentStage.stage.longitude.toNumber(),
        ],
        currentStage.stage.radius
      );
      if (isAtCurrentStage) {
        logger.info(
          `Fleet ${payload.fleetNo} is still at the current stage: ${currentStage.stage.name}`
        );
        return;
      }
      const nextStage = findNextStage(
        stagesInOrder,
        currentStageId,
        traversalDirection
      );
      const isAtNextStage = nextStage
        ? isWithinRadius(
            [payload.latitude, payload.longitude],
            [
              nextStage.stage.latitude.toNumber(),
              nextStage.stage.longitude.toNumber(),
            ],
            nextStage.stage.radius
          )
        : false;
      logger.debug(
        `Current Stage: ${currentStage?.stage?.name}, Next stage: ${nextStage?.stage.name}, Is at next stage: ${isAtNextStage}`
      );
      if (isAtNextStage) {
        logger.info(
          `Fleet ${payload.fleetNo} has reached the next stage: ${
            nextStage!.stage.name
          }`
        );

        let direction: TraversalDirection = traversalDirection;
        // Handle direction change at the end of the route
        if (
          direction === "forward" &&
          nextStage?.order === stagesInOrder.at(-1)?.order
        ) {
          direction = "reverse";
          logger.info(
            `Fleet ${payload.fleetNo} reached the last stage. Switching direction to reverse.`
          );
        } else if (
          direction === "reverse" &&
          nextStage?.order === stagesInOrder.at(0)?.order
        ) {
          direction = "forward";
          logger.info(
            `Fleet ${payload.fleetNo} reached the first stage. Switching direction to forward.`
          );
        }

        const afterNextStage = findNextStage(
          stagesInOrder,
          nextStage!.stageId,
          direction
        );

        await publishToRedisStream<FleetRouteInterStageMovement>(
          "fleet_movement_stream",
          {
            fleetNo: payload.fleetNo,
            routeName: activeFleetRoute.route.name,
            routeId: activeFleetRoute.route.id,
            currentStage: nextStage!.stage.name,
            currentStageId: nextStage!.stageId,
            nextStage: afterNextStage!.stage.name,
            nextStageId: afterNextStage!.stageId,
            traversalDirection: direction,
          }
        );
        logger.debug(
          `Fleet ${payload.fleetNo} has transitioned from current stage ${
            currentStage.stage.name
          } to next stage ${nextStage!.stage.name}. After next stage: ${
            afterNextStage?.stage.name || "None"
          }, Direction: ${direction}`
        );
        return;
      }
    }
  } catch (error: any) {
    logger.error(
      `Error processing GPS data for fleet ${payload.fleetNo}: ${error?.message}`
    );
  }
};
const findNextStage = (
  stages: (RouteStage & { stage: Stage })[],
  currentStageId: string,
  direction: TraversalDirection
) => {
  const currentStage = stages.find((stage) => stage.stageId === currentStageId);
  if (!currentStage) {
    logger.warn(`Current stage with ID ${currentStageId} not found.`);
    return null;
  }

  if (direction === "forward") {
    // If we're moving forward and at the last stage
    if (currentStage.order === stages.length - 1) {
      // Return the previous stage (since we're about to reverse)
      return stages.find((stage) => stage.order === currentStage.order - 1);
    }
    // Otherwise return the next stage
    return stages.find((stage) => stage.order === currentStage.order + 1);
  } else if (direction === "reverse") {
    // If we're moving backward and at the first stage
    if (currentStage.order === 0) {
      // Return the next stage (since we're about to go forward)
      return stages.find((stage) => stage.order === currentStage.order + 1);
    }
    // Otherwise return the previous stage
    return stages.find((stage) => stage.order === currentStage.order - 1);
  }

  logger.warn(`Invalid traversal direction: ${direction}`);
  return null;
};

const findNextStageHybrid = (
  stages: (RouteStage & { stage: Stage })[],
  currentStageId: string,
  direction: TraversalDirection,
  currentLat: number,
  currentLng: number
) => {
  const currentStage = stages.find((stage) => stage.stageId === currentStageId);
  if (!currentStage) {
    logger.warn(`Current stage with ID ${currentStageId} not found.`);
    return null;
  }

  // Order-based lookup
  const orderNextStage =
    direction === "forward"
      ? stages.find((stage) => stage.order === currentStage.order + 1)
      : stages.find((stage) => stage.order === currentStage.order - 1);

  // If we found the next stage by order, return it
  if (orderNextStage) return orderNextStage;

  // Fallback: Find the nearest stage
  let nearestStage = null;
  let minDistance = Infinity;
  for (const stage of stages) {
    const distance = getDistanceInMeteresBetweenTwoPoints(
      [currentLat, currentLng],
      [stage.stage.latitude.toNumber(), stage.stage.longitude.toNumber()]
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestStage = stage;
    }
  }

  return nearestStage;
};

async () => {
  console.log("------------------|Test|------------------");

  const activeFleetRoute = await FleetRoutesModel.findFirst({
    where: {
      fleet: { name: "SM-002" },
      isActive: true,
      voided: false,
    },
    include: { route: { include: { stages: { include: { stage: true } } } } },
  });
  let stagesInOrder =
    activeFleetRoute?.route.stages.sort((a, b) => a.order - b.order) ?? [];

  let currentStageId = stagesInOrder.at(0)?.stageId ?? null;
  let direction: TraversalDirection = "forward";

  while (currentStageId) {
    const currentStage = stagesInOrder.find(
      (stage) => stage.stageId === currentStageId
    );
    console.log(
      `[-] Current Stage: ${currentStage?.stage.name} (Order: ${currentStage?.order})`
    );
    const nextStage = findNextStage(stagesInOrder, currentStageId, direction);

    console.log(
      `[-] Next Stage: ${nextStage?.stage.name} (Order: ${nextStage?.order})`
    );

    // Simulate reaching the next stage
    currentStageId = nextStage!.stageId;

    // Optionally switch direction if at the end of the route
    if (
      direction === "forward" &&
      nextStage?.order === stagesInOrder.at(-1)?.order
    ) {
      direction = "reverse";
      console.log(`[-] Switching direction to reverse.`);
    } else if (
      direction === "reverse" &&
      nextStage?.order === stagesInOrder.at(0)?.order
    ) {
      direction = "forward";
      console.log(`[-] Switching direction to forward.`);
    }
    await new Promise((resolve) => setInterval(resolve, 3000));
  }
};
