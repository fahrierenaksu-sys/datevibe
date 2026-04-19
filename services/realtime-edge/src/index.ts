import { createRealtimeEdgeApp } from "./app"

export * from "./app"
export * from "./config"
export * from "./http/sessionRoutes"
export * from "./realtime/ConnectionRegistry"
export * from "./realtime/EventBridge"
export * from "./realtime/EventCodec"
export * from "./realtime/WebSocketGateway"
export * from "./session/InMemorySessionStore"
export * from "./session/SessionService"

if (require.main === module) {
  const runtime = createRealtimeEdgeApp()
  runtime
    .start()
    .then(() => {
      console.info(
        `realtime-edge listening on ${runtime.config.host}:${runtime.config.port} (${runtime.config.websocketPath})`
      )
    })
    .catch((error) => {
      console.error("failed to start realtime-edge", error)
      process.exitCode = 1
    })
}
