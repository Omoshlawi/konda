import { FleetRoutesModel, RoutesModel } from "@/models";
import logger from "@/services/logger";
import {
  FleetRouteInterStageMovement,
  GPSSesorData,
} from "@/socket/events/types";
import { isWithinRadius } from "@/utils/geo";
import {
  getLatestEntriesFromStream,
  MessageHandler,
  publishToRedisStream,
} from "@/utils/stream";

export const gpsStreamHandler: MessageHandler<
  GPSSesorData,
  { topic: string; timeStamp: string }
> = async (streamKey, messageId, payload, metadata) => {
  // TODO Implement streaming of coordinates to users subscribed to realtime cordinate changes for current fleet
  // TODO Implement validation, ie shape of GPS Data, if fleet exists et
  // TODO Optionally persist the GPS data in a time series db
  // TODO Implement a mechanism to handle fleet that are not moving

  // 1 Get last known entry values for the fleet
  const lastEntry =
    await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      ({ data: { fleetNo: fln } }) => payload.fleetNo === fln
    );

  // If no previous entry findout current stage and next stage
  if (lastEntry.length === 0) {
    logger.warn(`No movement history for fleet: ${payload.fleetNo}`);
    const currentFeetRoutes = await FleetRoutesModel.findMany({
      where: {
        voided: false,
        fleet: { name: payload.fleetNo },
      },
      include: {
        route: { include: { stages: { include: { stage: true } } } },
      },
    });
    // If no match do nothing for now
    if (currentFeetRoutes.length === 0) {
      logger.warn(`No routes found for fleet: ${payload.fleetNo}`);
      // TODO handle unmatched route
      return;
    }

    // Check all routes whose stages are within the radius of the current location
    // TODO Confirm assumption that one fleet can have more that one route but with start stage similar
    const currentFleetRoute = currentFeetRoutes.find((r) => {
      const stage = r.route.stages.find((s) => {
        return (
          s.order === 1 && // Ensures its the first stage
          isWithinRadius(
            [payload.latitude, payload.longitude],
            [s.stage.latitude.toNumber(), s.stage.longitude.toNumber()],
            s.stage.radius
          )
        );
      });
      return stage;
    });
    // If no match do nothing for now
    if (!currentFleetRoute) {
      logger.warn(
        `No route found for fleet: ${payload.fleetNo} within the current location`
      );
      // TODO handle unmatched route
      return;
    }
    const currentStage = currentFleetRoute.route.stages.find(
      (s) => s.order === 1
    );
    const nextStage = currentFleetRoute.route.stages.find((s) => s.order === 2);
    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: currentFleetRoute.route.name,
        routeId: currentFleetRoute.route.id,
        currentStage: currentStage!.stage!.name,
        currentStageId: currentStage!.stageId,
        nextStage: nextStage!.stage!.name,
        nextStageId: nextStage!.stageId,
        pastCurrentStageButNotNextStage: false,
      }
    );
  }
  // Query db for current stage and next stage
  const currentStageId = lastEntry[0]?.data?.currentStageId;
  const nextStageId = lastEntry[0]?.data?.nextStageId;
  const routeId = lastEntry[0]?.data?.routeId;
  const pastCurrentStageButNotNextStage =
    lastEntry[0]?.data?.pastCurrentStageButNotNextStage;
  const route = await RoutesModel.findUniqueOrThrow({
    where: { id: routeId },
    include: {
      stages: { include: { stage: true }, orderBy: { order: "asc" } },
    },
  });
  const currentStage = route.stages.find((s) => s.stageId === currentStageId);
  const nextStage = route.stages.find((s) => s.stageId === nextStageId);
  const _nextStage = route.stages.find((s) => s.order === nextStage!.order + 1);
  console.log("Lats entry --->", _nextStage, nextStage, route, routeId);

  // 2 Check if current location is within the radius of the current stage
  const isWithinCurrentStage = isWithinRadius(
    [payload.latitude, payload.longitude],
    [
      currentStage!.stage!.latitude.toNumber(),
      currentStage!.stage!.longitude.toNumber(),
    ],
    currentStage!.stage!.radius
  );
  // 3 Check if current location is within the radius of the next stage
  const isWithinNextStage = isWithinRadius(
    [payload.latitude, payload.longitude],
    [
      nextStage!.stage!.latitude.toNumber(),
      nextStage!.stage!.longitude.toNumber(),
    ],
    nextStage!.stage!.radius
  );
  // 4 If within current stage do nothing // TODO (maybe just persist the movement in time series db)
  if (isWithinCurrentStage) {
    logger.info(
      `Fleet ${payload.fleetNo} is within current stage ${currentStage?.stage?.name}`
    );
    return;
  }
  // 5 if within next stage then update current to next and next to _next
  if (isWithinNextStage && _nextStage) {
    logger.info(
      `Fleet ${payload.fleetNo} is within next stage ${nextStage?.stage?.name}`
    );
    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: route.name,
        routeId: route.id,
        currentStage: nextStage!.stage!.name,
        currentStageId: nextStageId!,
        nextStage: _nextStage.stage.name,
        nextStageId: _nextStage.id,
        pastCurrentStageButNotNextStage: false,
      }
    );
    return;
  }
  // 6 if within next stage but no _next (i,e next stage is the last stage)
  if (isWithinNextStage && !_nextStage) {
    logger.info(
      `Fleet ${payload.fleetNo} is within next stage ${nextStage?.stage?.name}`
    );
    // Update current stage to next stage
    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: route.name,
        routeId: route.id,
        currentStage: nextStage!.stage!.name,
        currentStageId: nextStageId!,
        nextStage: "---",
        nextStageId: "---",
        pastCurrentStageButNotNextStage: false,
      }
    );
    return;
  }

  // 7 if not within current stage but not within next stage then set pastCurrentStageButNotNextStage to true
  if (!isWithinNextStage && !isWithinCurrentStage) {
    await publishToRedisStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      {
        fleetNo: payload.fleetNo,
        routeName: route.name,
        routeId: route.id,
        currentStage: currentStage!.stage!.name,
        currentStageId: currentStageId!,
        nextStage: nextStage!.stage!.name,
        nextStageId: nextStageId!,
        pastCurrentStageButNotNextStage: true,
      }
    );
    return;
  }
};
