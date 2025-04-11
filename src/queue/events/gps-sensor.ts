import { FleetRoutesModel, TripsModel } from "@/models";
import { GPSSensorDataSchema } from "@/schema";
import logger from "@/services/logger";
import { sendSocketMessage } from "@/socket";
import {
  FleetRouteInterStageMovement,
  GPSSesorData,
  TraversalDirection,
} from "@/types";

import { findNextStage, isWithinRadius } from "@/utils/geo";
import {
  getLatestEntriesFromStream,
  MessageHandler,
  publishToRedisStream,
} from "@/utils/stream";

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

    logger.debug(
      `Processing GPS data for fleet: ${payload.fleetNo} ${JSON.stringify({
        lat: payload.latitude,
        lng: payload.longitude,
      })}`
    );

    // Broad cast to clients
    sendSocketMessage(
      "stream_live_location",
      "/fleet-live-location",
      payload?.fleetNo,
      JSON.stringify(payload)
    );
    logger.info(
      `Broadcasted live GPS location for fleet: ${payload.fleetNo} to clients.`
    );

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

    if (!lastEntries.length) {
      logger.info(
        `No previous movement history found for fleet: ${payload.fleetNo}.Possibly trip not started yet`
      );
      //TODO Show error and prompt to start trip
      return;
    } else {
      const { currentStageId, traversalDirection, tripId, fleetId } =
        lastEntries[0]!.data;

      const currentTrip = await TripsModel.findUnique({
        where: {
          id: tripId,
          endedAt: null,
          voided: false,
          fleetId: fleetId,
          endStageId: null,
        },
      });

      if (!currentTrip) {
        logger.error(
          `No active trip found for fleet: ${payload.fleetNo}. Trip ID: ${tripId}, Fleet ID: ${fleetId}`
        );
        // TODO Send notification for failure and possibly prompt start trip prompt
        return;
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
        const isNextStageLastStage: boolean =
          (traversalDirection === "Forward" &&
            nextStage?.order === stagesInOrder.at(-1)?.order) ||
          (traversalDirection === "Reverse" &&
            nextStage?.order === stagesInOrder.at(0)?.order);

        const afterNextStage = isNextStageLastStage
          ? undefined
          : findNextStage(
              stagesInOrder,
              nextStage!.stageId,
              traversalDirection
            );

        await publishToRedisStream<FleetRouteInterStageMovement>(
          "fleet_movement_stream",
          {
            fleetNo: payload.fleetNo,
            routeName: activeFleetRoute.route.name,
            routeId: activeFleetRoute.route.id,
            currentStage: nextStage!.stage.name,
            currentStageId: nextStage!.stageId,
            nextStage: afterNextStage?.stage.name,
            nextStageId: afterNextStage?.stageId,
            traversalDirection: traversalDirection,
            fleetId: fleetId,
            tripId: tripId,
          }
        );
        logger.info(
          `Fleet ${payload.fleetNo} has moved from stage "${
            currentStage.stage.name
          }" to stage "${nextStage!.stage.name}". ${
            afterNextStage
              ? `Upcoming stage: "${afterNextStage.stage.name}".`
              : "No further stages in the current direction."
          } Current traversal direction: ${traversalDirection}.`
        );

        if (isNextStageLastStage) {
          logger.info(
            `Fleet ${payload.fleetNo} has reached the last stage: ${
              nextStage!.stage.name
            }. Ending trip.`
          );
          // End trip automatically
          await TripsModel.update({
            where: { id: currentTrip.id },
            data: { endedAt: new Date(), endStageId: nextStage?.stageId },
          });
          logger.info(
            `Trip for fleet ${
              payload.fleetNo
            } has been successfully ended. Trip ID: ${
              currentTrip.id
            }, End Stage: ${nextStage!.stage.name}.`
          );
        }
        return;
      }
    }
  } catch (error: any) {
    logger.error(
      `Error processing GPS data for fleet ${payload.fleetNo}: ${error?.message}`
    );
  }
};
