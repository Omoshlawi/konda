import {
  createRedisStreamConsumer,
  RedisStreamConsumerOptions,
  MessageHandler,
  publishToRedisStream,
} from "@/utils/stream";

const fleetStream = async () => {
  const fleetStreamOptions: RedisStreamConsumerOptions = {
    streamKey: "fleet_movement_stream",
    groupName: "fleet_tracking_group",
  };

  const fleetStreamHandler: MessageHandler = async (
    streamKey,
    messageId,
    data,
    metadata
  ) => {
    console.log(
      `Processing message ${messageId} from ${streamKey}:`,
      JSON.stringify(data, null, 2)
    );
    console.log("Metadat: ", metadata);
  };

  await createRedisStreamConsumer(fleetStreamOptions, fleetStreamHandler);
};

export const subscribeToRedisStreams = async () => {
 
  await fleetStream();
};
