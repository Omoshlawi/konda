import { FleetRoutesModel, TripsModel } from "@/models";
import { TripStartArgsDataSchema } from "@/schema";
import logger from "@/services/logger";
import {
  FleetRouteInterStageMovement,
  GPSSesorData,
  TripStartArgs,
} from "@/types";
import {
  getLatestEntriesFromStream,
  publishToRedisStream,
} from "@/utils/stream";
import { MQTT_TOPICS } from "../index";
import { findNextStage, isWithinRadius } from "@/utils/geo";

export const startTrip = async (fleetNo: string, args: TripStartArgs) => {
  const validation = await TripStartArgsDataSchema.safeParseAsync(args);
  if (!validation.success) {
    logger.error(
      `Invalid trip start args: ${JSON.stringify(
        args
      )}. Error: ${JSON.stringify(validation.error.format())}`
    );
    // TODO: sEND NOTIFICATION OF THE FAILURE
    return;
  }

  // TODO Ensure that the previous trip wa ended by retriving trip from last location info then checking if has end stage and timeended
  // Get active routes for this fleet
  const activeFleetRoute = await FleetRoutesModel.findFirst({
    where: {
      fleet: { name: fleetNo },
      isActive: true,
      voided: false,
    },
    include: { route: { include: { stages: { include: { stage: true } } } } },
  });

  if (!activeFleetRoute) {
    logger.warn(`No active route found for fleet: ${fleetNo}`);
    return;
  }

  const stagesInOrder = activeFleetRoute.route.stages.sort((a, b) => {
    return args.direction === "Forward" ? a.order - b.order : b.order - a.order;
  });
  if (stagesInOrder.length <= 1) {
    logger.error(
      `Route for fleet ${fleetNo} has insufficient stages to track movement.`
    );
    return;
  }

  //   Get last know location in the time window of last 10 minutes
  const lastLocationEntries = await getLatestEntriesFromStream<GPSSesorData>(
    MQTT_TOPICS.GPS.replace("/", "_"),
    ({ data }) => data?.fleetNo === fleetNo,
    undefined
    // { startDate: new Date(Date.now() - 10 * 60 * 1000) } //TODO Uncomment in production if practical
  );
  const lastKnownLocation = lastLocationEntries[0]?.data;
  if (!lastKnownLocation) {
    logger.warn(
      `No current location data found for fleet: ${fleetNo}. Driver must wait until location is detected.`
    );
    return;
  }

  const currentStage = stagesInOrder.find(({ stage }) =>
    isWithinRadius(
      [stage.latitude.toNumber(), stage.longitude.toNumber()],
      [lastKnownLocation.latitude, lastKnownLocation.longitude],
      stage.radius
    )
  );
  if (!currentStage) {
    logger.error(
      `Driver is not within any stage of the current route for fleet: ${fleetNo}. Trip cannot be started.`
    );
    // TODO: sund notifcation message for the failur
    return;
  }

  //   Start Trip
  const trip = await TripsModel.create({
    data: {
      direction: args.direction,
      fleetId: activeFleetRoute.fleetId,
      routeId: activeFleetRoute.routeId,
      startStageId: currentStage.stageId,
    },
  });

  const nextStage = findNextStage(
    stagesInOrder,
    currentStage.stageId,
    args.direction
  );

  logger.info(`Trip ${trip.id} for fleet: ${fleetNo} stated succesfully`);

  // Publish trip info to fleet_movement_stream
  await publishToRedisStream<FleetRouteInterStageMovement>(
    "fleet_movement_stream",
    {
      fleetNo,
      routeName: activeFleetRoute.route.name,
      routeId: activeFleetRoute.route.id,
      currentStage: currentStage.stage.name,
      currentStageId: currentStage.stageId,
      nextStage: nextStage!.stage.name,
      nextStageId: nextStage!.stageId,
      traversalDirection: args.direction,
      fleetId: trip.fleetId,
      tripId: trip.id,
    }
  );
  logger.debug(
    `Published new trip info for fleet ${fleetNo} to movement stream with current stage ${
      currentStage.stage.name
    } and next stage ${nextStage!.stage.name} and direction ${args.direction}`
  );
};
