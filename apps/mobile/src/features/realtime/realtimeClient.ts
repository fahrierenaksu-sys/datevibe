import type { ClientEvent, ServerEvent } from "@datevibe/realtime-client"

export type RealtimeConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

export interface RealtimeConnectionMeta {
  closeCode?: number
}

type ServerEventListener = (event: ServerEvent) => void
type StatusListener = (status: RealtimeConnectionStatus, meta?: RealtimeConnectionMeta) => void

function createWebSocketUrl(baseUrl: string, sessionToken: string): string {
  const trimmed = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  return `${trimmed}/ws?sessionToken=${encodeURIComponent(sessionToken)}`
}

function isServerEvent(value: unknown): value is ServerEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).type === "string" &&
    "payload" in (value as Record<string, unknown>)
  )
}

export class RealtimeClient {
  private socket: WebSocket | null = null
  private readonly serverEventListeners = new Set<ServerEventListener>()
  private readonly statusListeners = new Set<StatusListener>()

  public constructor(private readonly wsBaseUrl: string) {}

  public connect(sessionToken: string): void {
    this.disconnect()
    this.emitStatus("connecting")

    const socket = new WebSocket(createWebSocketUrl(this.wsBaseUrl, sessionToken))
    this.socket = socket

    socket.onopen = () => {
      this.emitStatus("connected")
    }

    socket.onmessage = (messageEvent) => {
      if (typeof messageEvent.data !== "string") {
        return
      }

      try {
        const parsed = JSON.parse(messageEvent.data) as unknown
        if (!isServerEvent(parsed)) {
          return
        }
        for (const listener of this.serverEventListeners) {
          listener(parsed)
        }
      } catch {
        return
      }
    }

    socket.onclose = (closeEvent) => {
      if (this.socket === socket) {
        this.socket = null
      }
      this.emitStatus("disconnected", { closeCode: closeEvent.code })
    }

    socket.onerror = () => {
      this.emitStatus("error")
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.emitStatus("disconnected")
  }

  public send(event: ClientEvent): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }
    this.socket.send(JSON.stringify(event))
  }

  public onServerEvent(listener: ServerEventListener): () => void {
    this.serverEventListeners.add(listener)
    return () => {
      this.serverEventListeners.delete(listener)
    }
  }

  public onConnectionStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  private emitStatus(status: RealtimeConnectionStatus, meta?: RealtimeConnectionMeta): void {
    for (const listener of this.statusListeners) {
      listener(status, meta)
    }
  }
}
