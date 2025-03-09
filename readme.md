Run application

```shell
pnpm install && pnpm run db:migrate && pnpm run build  && pnpm run start

```

# Todo

- use Redis as an intermediary between websocket mqtt data flow. Upon receipt of message on mqtt i.e `mqttClient.on("message")` event, it should pulish the message to redis.Upon client connection through web socket i.e `socket.on("connect")` or `socketNamespace.on("connect")` it should subscribe to redis then consume the data as it process and emit to client

- Alternatively for very hight traffic,scalability, and message deliver guaranty, the redis can be replaced with apache kafka or rabit MQ
- Alternatively, use redis stream in redis 5 that persist event messages in stream, also stream group to ensure on backend instance process the event.this is helpfull when running multiple instances of the app
- Also for multiple app instance , use locks to ensure only one instance publish event to redis stream
