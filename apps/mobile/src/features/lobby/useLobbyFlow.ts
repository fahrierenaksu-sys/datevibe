import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ServerEvent } from "@datevibe/realtime-client"
import { MOBILE_WS_BASE_URL } from "../../config/env"
import type { SessionActor } from "../session/sessionApi"
import { useRealtimeConnection } from "../realtime/useRealtimeConnection"
import {
  applyServerEventToLobbyState,
  createInitialLobbyState,
  type LobbyState
} from "./lobbyState"
import { PUBLIC_LOBBY_ROOM_ID } from "./publicLobby"

export interface UseLobbyFlowOptions {
  sessionActor: SessionActor
  onInvalidSession: () => void
}

export interface UseLobbyFlowResult {
  connectionStatus: ReturnType<typeof useRealtimeConnection>["connectionStatus"]
  lobbyState: LobbyState
}

export function useLobbyFlow(options: UseLobbyFlowOptions): UseLobbyFlowResult {
  const { sessionActor, onInvalidSession } = options
  const [lobbyState, setLobbyState] = useState<LobbyState>(() =>
    createInitialLobbyState(PUBLIC_LOBBY_ROOM_ID)
  )

  const joinSentRef = useRef(false)

  const handleServerEvent = useCallback(
    (serverEvent: ServerEvent) => {
      setLobbyState((previousState) =>
        applyServerEventToLobbyState(previousState, serverEvent, sessionActor.profile.userId)
      )
    },
    [sessionActor.profile.userId]
  )

  const { connectionStatus, sendEvent } = useRealtimeConnection({
    wsBaseUrl: MOBILE_WS_BASE_URL,
    sessionToken: sessionActor.session.sessionToken,
    onServerEvent: handleServerEvent,
    onInvalidSession
  })

  useEffect(() => {
    joinSentRef.current = false
    setLobbyState(createInitialLobbyState(PUBLIC_LOBBY_ROOM_ID))
  }, [sessionActor.profile.userId, sessionActor.session.sessionToken])

  useEffect(() => {
    if (connectionStatus !== "connected" || joinSentRef.current) {
      return
    }

    joinSentRef.current = true
    sendEvent({
      type: "room.join",
      payload: {
        roomId: PUBLIC_LOBBY_ROOM_ID,
        sessionToken: sessionActor.session.sessionToken
      }
    })
  }, [connectionStatus, sendEvent, sessionActor.session.sessionToken])

  return useMemo(
    () => ({
      connectionStatus,
      lobbyState
    }),
    [connectionStatus, lobbyState]
  )
}
