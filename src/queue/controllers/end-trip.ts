import { TripsModel } from "@/models";
import logger from "@/services/logger";
import { FleetRouteInterStageMovement } from "@/types";
import { getLatestEntriesFromStream } from "@/utils/stream";

export const endTrip = async (fleetNo: string) => {
  // Get the last known movement state for this fleet
  const lastMovementEntries =
    await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      ({ data }) => data?.fleetNo === fleetNo
    );
  const lastKnownStagesInfo = lastMovementEntries[0]?.data;
  if (!lastKnownStagesInfo) {
    logger.warn(`No trip movement data for fleet: ${fleetNo}.`);
    // TODO: SEND NOTIFICATION COMMUNICATING SAME
    return;
  }

  // Get current trip for fleet unended
  const currentTrip = await TripsModel.findUnique({
    where: {
      id: lastKnownStagesInfo.tripId,
      fleet: { name: fleetNo },
      endedAt: null,
      voided: false,
      endStageId: null,
    },
  });

  if (!currentTrip) {
    logger.error(`No active trip found for fleet: ${fleetNo}.`);
    // TODO Send notification
    return;
  }

  logger.debug(
    `Ending trip for fleet: ${fleetNo}, tripId: ${currentTrip.id}, currentStageId: ${lastKnownStagesInfo.currentStageId}`
  );

  //   end trip Trip
  const trip = await TripsModel.update({
    where: {
      id: currentTrip.id,
    },
    data: {
      endedAt: new Date(),
      endStageId: lastKnownStagesInfo.currentStageId,
    },
  });
  logger.info(`Trip ${currentTrip.id} ended succesffuclly!`);
  //TODO: Clear entries with this trip
};
