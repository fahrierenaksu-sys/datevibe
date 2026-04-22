import type { IncomingMessage, Server as HttpServer } from "http"
import type { Socket as NetSocket } from "net"
import WebSocket from "ws"
import type { ServerEvent, UserProfile } from "@datevibe/contracts"
import { SessionService } from "../session/SessionService"
import { ConnectionRegistry } from "./ConnectionRegistry"
import { EventCodec } from "./EventCodec"
import { EventBridge } from "./EventBridge"

interface ConnectionAuthContext {
  actor: UserProfile
  sessionToken: string
}

export interface WebSocketGatewayOptions {
  websocketPath: string
}

export interface WebSocketGatewayDependencies {
  server: HttpServer
  sessionService: SessionService
  connectionRegistry: ConnectionRegistry
  eventCodec: EventCodec
  eventBridge: EventBridge
  options: WebSocketGatewayOptions
}

export class WebSocketGateway {
  private readonly webSocketServer = new WebSocket.Server({ noServer: true })
  private connectionCounter = 0

  public constructor(private readonly dependencies: WebSocketGatewayDependencies) {}

  public attach(): void {
    this.dependencies.server.on("upgrade", this.onUpgrade)
    this.webSocketServer.on("connection", this.onConnection)
  }

  public detach(): void {
    this.dependencies.server.off("upgrade", this.onUpgrade)
    this.webSocketServer.off("connection", this.onConnection)
    for (const client of this.webSocketServer.clients) {
      client.close()
    }
    this.webSocketServer.close()
  }

  private readonly onUpgrade = (
    request: IncomingMessage,
    socket: NetSocket,
    head: Buffer
  ): void => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost")
    if (requestUrl.pathname !== this.dependencies.options.websocketPath) {
      socket.destroy()
      return
    }

    const sessionToken = requestUrl.searchParams.get("sessionToken")
    if (!sessionToken) {
      socket.destroy()
      return
    }

    const actor = this.dependencies.sessionService.resolveActorProfile(sessionToken)
    if (!actor) {
      socket.destroy()
      return
    }

    this.webSocketServer.handleUpgrade(request, socket, head, (webSocket: WebSocket) => {
      this.webSocketServer.emit(
        "connection",
        webSocket,
        request,
        { actor, sessionToken } satisfies ConnectionAuthContext
      )
    })
  }

  private readonly onConnection = (
    socket: WebSocket,
    _request: IncomingMessage,
    auth: ConnectionAuthContext
  ): void => {
    const connectionId = this.createConnectionId()
    this.dependencies.connectionRegistry.registerConnection({
      connectionId,
      userId: auth.actor.userId,
      socket
    })

    let cleanedUp = false
    const cleanupConnection = (): void => {
      if (cleanedUp) {
        return
      }
      cleanedUp = true

      const roomId = this.dependencies.connectionRegistry.getConnectionRoom(connectionId)
      if (roomId) {
        this.dependencies.eventBridge.handleClientEvent({
          connectionId,
          actor: auth.actor,
          event: {
            type: "room.leave",
            payload: { roomId }
          },
          emit: (targetConnectionId, serverEvent) => this.emitServerEvent(targetConnectionId, serverEvent)
        })
      }

      this.dependencies.connectionRegistry.unregisterConnection(connectionId)
    }

    socket.on("message", (rawData) => {
      this.handleMessage(connectionId, auth.actor, auth.sessionToken, rawData)
    })

    socket.on("close", () => {
      cleanupConnection()
    })

    socket.on("error", () => {
      cleanupConnection()
    })
  }

  private handleMessage(
    connectionId: string,
    actor: UserProfile,
    authenticatedSessionToken: string,
    rawData: WebSocket.Data
  ): void {
    const decoded = this.dependencies.eventCodec.decodeClientEvent(rawData)
    if (!decoded.ok) {
      return
    }

    if (
      decoded.event.type === "room.join" &&
      decoded.event.payload.sessionToken !== authenticatedSessionToken
    ) {
      return
    }

    this.dependencies.eventBridge.handleClientEvent({
      connectionId,
      actor,
      event: decoded.event,
      emit: (targetConnectionId, serverEvent) => this.emitServerEvent(targetConnectionId, serverEvent)
    })
  }

  private emitServerEvent(connectionId: string, serverEvent: ServerEvent): void {
    const socket = this.dependencies.connectionRegistry.getSocket(connectionId)
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    const encoded = this.dependencies.eventCodec.encodeServerEvent(serverEvent)
    if (!encoded) {
      return
    }

    socket.send(encoded)
  }

  private createConnectionId(): string {
    this.connectionCounter += 1
    return `conn_${this.connectionCounter}`
  }
}
