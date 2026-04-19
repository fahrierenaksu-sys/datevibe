import { useCallback, useEffect, useRef, useState } from "react"
import type { ClientEvent, ServerEvent } from "@datevibe/realtime-client"
import {
  RealtimeClient,
  type RealtimeConnectionStatus
} from "./realtimeClient"

export interface UseRealtimeConnectionOptions {
  wsBaseUrl: string
  sessionToken?: string
  onServerEvent: (event: ServerEvent) => void
  onInvalidSession?: () => void
}

export interface UseRealtimeConnectionResult {
  connectionStatus: RealtimeConnectionStatus
  sendEvent: (event: ClientEvent) => void
}

export function useRealtimeConnection(
  options: UseRealtimeConnectionOptions
): UseRealtimeConnectionResult {
  const { wsBaseUrl, sessionToken, onServerEvent, onInvalidSession } = options
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>("idle")
  const clientRef = useRef<RealtimeClient | null>(null)

  useEffect(() => {
    if (!sessionToken) {
      setConnectionStatus("idle")
      return
    }

    const client = new RealtimeClient(wsBaseUrl)
    clientRef.current = client

    const unsubscribeStatus = client.onConnectionStatus((nextStatus, meta) => {
      setConnectionStatus(nextStatus)
      if (meta?.closeCode === 1008) {
        onInvalidSession?.()
      }
    })

    const unsubscribeEvents = client.onServerEvent(onServerEvent)

    client.connect(sessionToken)

    return () => {
      unsubscribeStatus()
      unsubscribeEvents()
      client.disconnect()
      if (clientRef.current === client) {
        clientRef.current = null
      }
    }
  }, [onInvalidSession, onServerEvent, sessionToken, wsBaseUrl])

  const sendEvent = useCallback((event: ClientEvent) => {
    clientRef.current?.send(event)
  }, [])

  return {
    connectionStatus,
    sendEvent
  }
}
