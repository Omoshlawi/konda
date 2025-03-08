Run application

```shell
pnpm install && pnpm run db:migrate && pnpm run build  && pnpm run start

```

# Todo

- use Redis as an intermediary between websocket mqtt data flow. Upon receipt of message on mqtt i.e `mqttClient.on("message")` event, it should pulish the message to redis.Upon client connection through web socket i.e `socket.on("connect")` or `socketNamespace.on("connect")` it should subscribe to redis then consume the data as it process and emit to client

-
