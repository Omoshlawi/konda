import { FleetRoutesModel } from "@/models";
import { GPSSensorDataSchema } from "@/schema";
import logger from "@/services/logger";
import {
  FleetRouteInterStageMovement,
  GPSSesorData,
  TraversalDirection,
} from "@/types";

import { isWithinRadius } from "@/utils/geo";
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
      // TODO Send notification to fleet manager of detected movement bt no active route
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
    let direction: TraversalDirection = isAtFirstStage
      ? "forward"
      : isAtLastStage
      ? "reverse"
      : "unknown";
    // First time seeing this fleet or no movement history
    if (!lastEntries.length) {
      logger.info(
        `No previous movement history found for fleet: ${payload.fleetNo}`
      );
      if (!isAtFirstStage && !isAtLastStage) {
        logger.error(
          `Fleet ${payload.fleetNo} detected outside of initial or final stage boundaries without prior movement history.`
        );
        // TODO: find a way to handle such edge case
        return;
      }
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
          pastCurrentStageButNotNextStage: false,
          traversalDirection: direction,
        }
      );
      return;
    } else {
      const { currentStageId, nextStageId, routeId, traversalDirection } =
        lastEntries[0]!.data;
      if (!isAtFirstStage && !isAtLastStage) {
        direction = traversalDirection;
      }
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
      const nextStage = findNextStage(stagesInOrder, currentStageId, direction);
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
      if (isAtNextStage) {
        logger.info(
          `Fleet ${payload.fleetNo} has reached the next stage: ${
            nextStage!.stage.name
          }`
        );
        const afterNextStage = findNextStage(
          stagesInOrder,
          nextStage!.id,
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
            pastCurrentStageButNotNextStage: false,
            traversalDirection: direction,
          }
        );
        return;
      }
    }
  } catch (error: any) {
    logger.error(
      `Error processing GPS data for fleet ${payload.fleetNo}: ${error?.message}`
    );
    //TODO Consider publishing an error event to a monitoring stream
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
    const nextStage = stages.find(
      (stage) => stage.order === currentStage.order + 1
    );
    if (!nextStage) {
      logger.info(
        `Fleet has reached the final stage. Switching direction to reverse.`
      );
      return (
        stages.find((stage) => stage.order === currentStage.order - 1) || null
      );
    }
    return nextStage;
  } else if (direction === "reverse") {
    const nextStage = stages.find(
      (stage) => stage.order === currentStage.order - 1
    );
    if (!nextStage) {
      logger.info(
        `Fleet has reached the first stage. Switching direction to forward.`
      );
      return (
        stages.find((stage) => stage.order === currentStage.order + 1) || null
      );
    }
    return nextStage;
  }

  logger.warn(`Invalid traversal direction: ${direction}`);
  return null;
};
