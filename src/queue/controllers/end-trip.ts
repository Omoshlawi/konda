import { TripsModel } from "@/models";
import logger from "@/services/logger";
import {
    FleetRouteInterStageMovement
} from "@/types";
import {
    getLatestEntriesFromStream
} from "@/utils/stream";

export const endTrip = async (fleetNo: string) => {
  // Get current trip for fleet unended
  const currentTrip = await TripsModel.findFirst({
    where: {
      fleet: { name: fleetNo },
      endedAt: null,
      voided: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!currentTrip) {
    logger.error(`No active trip found for fleet: ${fleetNo}.`);
    // TODO Send notification
    return;
  }

  // Get the last known movement state for this fleet
  const lastMovementEntries =
    await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
      "fleet_movement_stream",
      ({ data }) => data?.fleetNo === fleetNo
    );
  const lastKnownStagesInfo = lastMovementEntries[0]?.data;
  if (!lastKnownStagesInfo) {
    logger.warn(
      `No current location data found for fleet: ${fleetNo}. Driver must wait until location is detected.`
    );
    return;
  }

  //   end trip Trip
  const trip = await TripsModel.update({
    where: {
      id: currentTrip.id,
      endStageId: lastKnownStagesInfo.currentStageId,
    },
    data: {
      endedAt: new Date(),
    },
  });
  logger.info(`Trip ${currentTrip.id} ended succesffuclly!`);
  //TODO: Clear entries with this trip
};
