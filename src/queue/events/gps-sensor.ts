import { FleetRoutesModel, RoutesModel } from "@/models";
import { GPSSensorDataSchema } from "@/schema";
import logger from "@/services/logger";
import { FleetRouteInterStageMovement, GPSSesorData } from "@/types";

import { isWithinRadius } from "@/utils/geo";
import {
  getLatestEntriesFromStream,
  MessageHandler,
  publishToRedisStream,
} from "@/utils/stream";
import { FleetRoute, Route, RouteStage, Stage } from "dist/prisma";

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

    // Get the last known movement state for this fleet
    const lastEntries =
      await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        ({ data }) => data?.fleetNo === payload.fleetNo
      );

    // First time seeing this fleet or no movement history
    if (!lastEntries.length) {
      await handleNewFleet(payload);
      return;
    }

    // Process existing fleet with movement history
    await processExistingFleet(payload, lastEntries[0]?.data);
  } catch (error: any) {
    logger.error(
      `Error processing GPS data for fleet ${payload.fleetNo}: ${error?.message}`
    );
    //TODO Consider publishing an error event to a monitoring stream
  }
};

/**
 * Handles a fleet with no previous movement history
 */
async function handleNewFleet(payload: GPSSesorData): Promise<void> {
  logger.info(`Initializing movement tracking for fleet: ${payload.fleetNo}`);

  try {
    // Find routes assigned to this fleet
    const fleetRoutes = await FleetRoutesModel.findMany({
      where: {
        voided: false,
        fleet: { name: payload.fleetNo },
      },
      include: {
        route: {
          include: {
            stages: {
              include: { stage: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!fleetRoutes.length) {
      logger.warn(`No routes found for fleet: ${payload.fleetNo}`);
      return;
    }

    // Find a route with a starting stage that matches current location
    const matchedRoute = findMatchingRoute(payload, fleetRoutes);

    if (!matchedRoute) {
      logger.warn(
        `Fleet ${payload.fleetNo} not within any starting stage radius`
      );
      return;
    }

    const firstStage = matchedRoute.route.stages[0];
    const secondStage = matchedRoute.route.stages[1];

    if (!firstStage || !firstStage.stage) {
      logger.error(`Invalid first stage for route: ${matchedRoute.route.id}`);
      return;
    }

    // Initialize the fleet movement state
    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: matchedRoute.route.name,
        routeId: matchedRoute.route.id,
        currentStage: firstStage.stage.name,
        currentStageId: firstStage.stageId,
        nextStage: secondStage?.stage?.name,
        nextStageId: secondStage?.stageId,
        pastCurrentStageButNotNextStage: false,
      }
    );

    logger.info(
      `Fleet ${payload.fleetNo} initialized at stage: ${firstStage.stage.name}`
    );
  } catch (error: any) {
    logger.error(
      `Failed to initialize fleet ${payload.fleetNo}: ${error?.message}`
    );
  }
}

/**
 * Find a route whose first stage matches the current fleet location
 */
function findMatchingRoute(
  payload: GPSSesorData,
  fleetRoutes: (FleetRoute & {
    route: Route & { stages: (RouteStage & { stage: Stage })[] };
  })[]
) {
  for (const fleetRoute of fleetRoutes) {
    const firstStage = fleetRoute.route.stages.find((s) => s.order === 0);

    if (!firstStage || !firstStage.stage) continue;

    const isAtFirstStage = isWithinRadius(
      [payload.latitude, payload.longitude],
      [
        firstStage.stage.latitude.toNumber(),
        firstStage.stage.longitude.toNumber(),
      ],
      firstStage.stage.radius
    );

    if (isAtFirstStage) {
      return fleetRoute;
    }
  }

  return null;
}

/**
 * Process GPS data for a fleet with existing movement history
 */
async function processExistingFleet(
  payload: GPSSesorData,
  lastMovement?: FleetRouteInterStageMovement
): Promise<void> {
  if (!lastMovement) {
    logger.warn(`Invalid last movement data for fleet: ${payload.fleetNo}`);
    return;
  }

  try {
    const { currentStageId, nextStageId, routeId } = lastMovement;

    if (!routeId || !currentStageId) {
      logger.error(
        `Missing route or stage information for fleet: ${payload.fleetNo}`
      );
      return;
    }

    // Get complete route information
    const route = await RoutesModel.findUnique({
      where: { id: routeId },
      include: {
        stages: {
          include: { stage: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!route) {
      logger.error(`Route not found: ${routeId}`);
      return;
    }

    const currentStage = route.stages.find((s) => s.stageId === currentStageId);

    if (!currentStage || !currentStage.stage) {
      logger.error(`Current stage not found: ${currentStageId}`);
      return;
    }

    // Find next stage (if any)
    const nextStage = nextStageId
      ? route.stages.find((s) => s.stageId === nextStageId)
      : null;

    // Find stage after next (if any)
    const afterNextStage = nextStage
      ? route.stages.find((s) => s.order === nextStage.order + 1)
      : null;

    // Check if fleet is within the current stage
    const isAtCurrentStage = isWithinRadius(
      [payload.latitude, payload.longitude],
      [
        currentStage.stage.latitude.toNumber(),
        currentStage.stage.longitude.toNumber(),
      ],
      currentStage.stage.radius
    );

    // Check if fleet is within the next stage (if there is one)
    const isAtNextStage =
      nextStage && nextStage.stage
        ? isWithinRadius(
            [payload.latitude, payload.longitude],
            [
              nextStage.stage.latitude.toNumber(),
              nextStage.stage.longitude.toNumber(),
            ],
            nextStage.stage.radius
          )
        : false;

    // Update movement state based on current location
    await updateFleetMovementState(
      payload,
      route,
      currentStage,
      nextStage ?? null,
      afterNextStage ?? null,
      isAtCurrentStage,
      isAtNextStage,
      lastMovement.pastCurrentStageButNotNextStage
    );
  } catch (error: any) {
    logger.error(
      `Error processing existing fleet ${payload.fleetNo}:${error?.message}`
    );
  }
}

/**
 * Update the fleet movement state based on current position and stage information
 */
async function updateFleetMovementState(
  payload: GPSSesorData,
  route: any,
  currentStage: RouteStage & { stage: Stage },
  nextStage: (RouteStage & { stage: Stage }) | null,
  afterNextStage: (RouteStage & { stage: Stage }) | null,
  isAtCurrentStage: boolean,
  isAtNextStage: boolean,
  wasPastCurrentStage: boolean
): Promise<void> {
  // Still at current stage - nothing to update
  if (isAtCurrentStage) {
    logger.debug(
      `Fleet ${payload.fleetNo} is still at stage ${currentStage.stage.name}`
    );

    // If we previously thought the fleet had left this stage, update the state
    if (wasPastCurrentStage) {
      await publishToRedisStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        {
          fleetNo: payload.fleetNo,
          routeName: route.name,
          routeId: route.id,
          currentStage: currentStage.stage.name,
          currentStageId: currentStage.stageId,
          nextStage: nextStage?.stage?.name ?? undefined,
          nextStageId: nextStage?.stageId ?? undefined,
          pastCurrentStageButNotNextStage: false,
        }
      );
      logger.info(
        `Fleet ${payload.fleetNo} has returned to stage ${currentStage.stage.name}`
      );
    }
    return;
  }

  // At next stage - advance to next stage
  if (isAtNextStage) {
    logger.info(
      `Fleet ${payload.fleetNo} has reached stage ${nextStage!.stage.name}`
    );

    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: route.name,
        routeId: route.id,
        currentStage: nextStage!.stage.name,
        currentStageId: nextStage!.stageId,
        nextStage: afterNextStage?.stage?.name ?? undefined,
        nextStageId: afterNextStage?.stageId ?? undefined,
        pastCurrentStageButNotNextStage: false,
      }
    );
    return;
  }

  // Between stages - mark as past current but not yet at next
  if (!isAtCurrentStage && !isAtNextStage && !wasPastCurrentStage) {
    logger.info(
      `Fleet ${payload.fleetNo} has left stage ${
        currentStage.stage.name
      } but not yet at ${nextStage?.stage?.name || "final destination"}`
    );

    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: route.name,
        routeId: route.id,
        currentStage: currentStage.stage.name,
        currentStageId: currentStage.stageId,
        nextStage: nextStage?.stage?.name ?? undefined,
        nextStageId: nextStage?.stageId ?? undefined,
        pastCurrentStageButNotNextStage: true,
      }
    );
  }
}
