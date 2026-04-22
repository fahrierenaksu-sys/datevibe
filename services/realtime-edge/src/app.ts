import { createServer, type Server as HttpServer } from "http"
import type { Express } from "express"
import express from "express"
import { MultiplayerCoreApp } from "@datevibe/multiplayer-core"
import { loadRealtimeEdgeConfig, type RealtimeEdgeConfig } from "./config"
import { createSessionRoutes } from "./http/sessionRoutes"
import { ConnectionRegistry } from "./realtime/ConnectionRegistry"
import { EventBridge } from "./realtime/EventBridge"
import { EventCodec } from "./realtime/EventCodec"
import { WebSocketGateway } from "./realtime/WebSocketGateway"
import { InMemorySessionStore } from "./session/InMemorySessionStore"
import { SessionService } from "./session/SessionService"

export interface RealtimeEdgeAppRuntime {
  app: Express
  server: HttpServer
  config: RealtimeEdgeConfig
  sessionService: SessionService
  start: () => Promise<void>
  stop: () => Promise<void>
}

export function createRealtimeEdgeApp(
  configOverrides: Partial<RealtimeEdgeConfig> = {}
): RealtimeEdgeAppRuntime {
  const config = {
    ...loadRealtimeEdgeConfig(),
    ...configOverrides
  }

  const sessionStore = new InMemorySessionStore()
  const sessionService = new SessionService(sessionStore, {
    sessionTtlMs: config.sessionTtlMs
  })
  const connectionRegistry = new ConnectionRegistry()
  const eventCodec = new EventCodec()
  const multiplayerCore = new MultiplayerCoreApp({
    livekit: {
      livekitUrl: config.livekit.url,
      apiKey: config.livekit.apiKey,
      apiSecret: config.livekit.apiSecret,
      tokenTtlSeconds: config.livekit.tokenTtlSeconds
    }
  })
  const eventBridge = new EventBridge(multiplayerCore, connectionRegistry)

  const app = express()
  app.use(express.json({ limit: "64kb" }))
  app.get("/healthz", (_req, res) => {
    res.status(200).json({ status: "ok" })
  })
  app.use(createSessionRoutes(sessionService))

  const server = createServer(app)
  const webSocketGateway = new WebSocketGateway({
    server,
    sessionService,
    connectionRegistry,
    eventCodec,
    eventBridge,
    options: {
      websocketPath: config.websocketPath
    }
  })
  webSocketGateway.attach()

  let started = false

  return {
    app,
    server,
    config,
    sessionService,
    start: async () => {
      if (started) {
        return
      }
      await new Promise<void>((resolve, reject) => {
        server.listen(config.port, config.host, () => resolve())
        server.once("error", (error) => reject(error))
      })
      started = true
    },
    stop: async () => {
      if (!started) {
        webSocketGateway.detach()
        return
      }
      webSocketGateway.detach()
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
      started = false
    }
  }
}
