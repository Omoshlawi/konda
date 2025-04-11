import { NotificationsModel } from "@/models";
import { triggerPushNotification } from "@/services/expo";
import logger from "@/services/logger";
import { sendSocketMessage } from "@/socket";
import { FleetRouteInterStageMovement } from "@/types";
import { MessageHandler } from "@/utils/stream";
import { Notification } from "dist/prisma";

export const fleetInterStageMovementStreamHandler: MessageHandler<
  FleetRouteInterStageMovement,
  { fleetNo: string }
> = async (streamKey, messageId, payload, metadata) => {
  sendSocketMessage(
    "stream_movement",
    "/fleet-movement",
    payload.fleetNo,
    JSON.stringify(payload)
  );

  // Send push notification reminders to clients who requested it

  const notifications = await NotificationsModel.findMany({
    where: {
      tripId: payload.tripId,
      isSent: false,
      routeStage: {
        stageId: payload.currentStageId,
        routeId: payload.routeId,
      },
    },
  });

  await triggerPushNotification<Notification>({
    data: notifications,
    transformer(data) {
      return {
        to: data.expoPushToken,
        sound: "default",
        body: data.message,
      };
    },
  });

  // TODO Check for delivery status and those succesfuly be marlked as sent
  await NotificationsModel.updateMany({
    where: { id: { in: notifications.map((n) => n.id) } },
    data: { isSent: true },
  });

  logger.debug(
    `Processed fleet inter-stage movement: fleetNo=${payload?.fleetNo}, routeId=${payload.routeId}, currentStage=${payload.currentStage}, nextStage=${payload.nextStage}, Direction: ${payload.traversalDirection}`
  );
};
