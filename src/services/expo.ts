import { Expo, ExpoPushMessage } from "expo-server-sdk";
import logger from "./logger";

const globalForExpo = global as unknown as { expo: Expo };

export const expo = globalForExpo.expo || new Expo({ useFcmV1: true });
if (process.env.NODE_ENV !== "production") globalForExpo.expo = expo;

export default expo;

export const triggerPushNotification = async <
  TPayload extends Record<string, any>
>({
  data,
  transformer,
}: {
  data: Array<TPayload>;
  transformer: (data: TPayload) => ExpoPushMessage;
}) => {
  let chunks = expo.chunkPushNotifications(
    data.map(transformer).filter((v) => {
      const isValid = Expo.isExpoPushToken(v.to);
      if (!isValid) logger.error(`Invalid expo push token : ${v.to}`);
      return isValid;
    })
  );
  const tickets = [];
  for (let chunk of chunks) {
    try {
      logger.debug(
        `Sending chunk of ${chunk.length} notifications: [${chunk
          .map((c) => c.to)
          .join(", ")}]`
      );
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      logger.debug(
        `Sent and Got chunk tickets with statuses: ${ticketChunk
          .map((t, i) => JSON.stringify({ [`${chunk[i]?.to}`]: t.status }))
          .join(", ")}`
      );
      tickets.push(...ticketChunk);
    } catch (error: any) {
      logger.error(
        `Error sending push notification for chunk of  ${
          chunk.length
        } notifications: [${chunk.map((c) => c.to).join(", ")}] : ${
          error?.message
        }`
      );
    }
  }
  return tickets;
};
