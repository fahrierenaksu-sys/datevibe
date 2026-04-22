import type { MediaSessionToken, MiniRoom } from "@datevibe/contracts"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createLivekitClient } from "./livekitClient"
import {
  createInitialMiniRoomMediaState,
  type MiniRoomMediaState
} from "./miniRoomMediaState"

export interface UseMiniRoomMediaInput {
  miniRoom: MiniRoom
  mediaSession: MediaSessionToken
}

export interface UseMiniRoomMediaResult {
  mediaState: MiniRoomMediaState
  retryConnect: () => Promise<void>
  toggleMic: () => Promise<void>
  toggleCamera: () => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return "Unable to connect to LiveKit."
}

export function useMiniRoomMedia(input: UseMiniRoomMediaInput): UseMiniRoomMediaResult {
  const { miniRoom, mediaSession } = input
  const roomInfo = useMemo(
    () => ({
      miniRoomId: miniRoom.miniRoomId,
      livekitRoomName: miniRoom.livekitRoomName,
      livekitUrl: mediaSession.livekitUrl
    }),
    [mediaSession.livekitUrl, miniRoom.livekitRoomName, miniRoom.miniRoomId]
  )

  const [mediaState, setMediaState] = useState<MiniRoomMediaState>(() =>
    createInitialMiniRoomMediaState(roomInfo)
  )

  const livekitClientRef = useRef<ReturnType<typeof createLivekitClient> | null>(null)
  const requestIdRef = useRef(0)
  const mountedRef = useRef(true)

  const runConnectAttempt = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setMediaState((previousState) => ({
      ...previousState,
      connectionStatus: "connecting",
      errorMessage: null,
      connectAttemptedAt: new Date().toISOString(),
      roomInfo
    }))

    try {
      if (!livekitClientRef.current) {
        livekitClientRef.current = createLivekitClient()
      }

      await livekitClientRef.current.connect({
        livekitUrl: mediaSession.livekitUrl,
        token: mediaSession.token
      })

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      setMediaState((previousState) => ({
        ...previousState,
        connectionStatus: "connected",
        errorMessage: null
      }))
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return
      }

      setMediaState((previousState) => ({
        ...previousState,
        connectionStatus: "error",
        errorMessage: getErrorMessage(error)
      }))
    }
  }, [mediaSession.livekitUrl, mediaSession.token, roomInfo])

  const retryConnect = useCallback(async () => {
    await livekitClientRef.current?.disconnect()
    await runConnectAttempt()
  }, [runConnectAttempt])

  const toggleMic = useCallback(async (): Promise<void> => {
    const client = livekitClientRef.current
    if (!client) return
    const nextEnabled = !mediaState.localMedia.micEnabled
    setMediaState((prev) => ({
      ...prev,
      localMedia: { ...prev.localMedia, micEnabled: nextEnabled }
    }))
    try {
      await client.setMicrophoneEnabled(nextEnabled)
    } catch {
      setMediaState((prev) => ({
        ...prev,
        localMedia: { ...prev.localMedia, micEnabled: !nextEnabled }
      }))
    }
  }, [mediaState.localMedia.micEnabled])

  const toggleCamera = useCallback(async (): Promise<void> => {
    const client = livekitClientRef.current
    if (!client) return
    const nextEnabled = !mediaState.localMedia.cameraEnabled
    setMediaState((prev) => ({
      ...prev,
      localMedia: { ...prev.localMedia, cameraEnabled: nextEnabled }
    }))
    try {
      await client.setCameraEnabled(nextEnabled)
    } catch {
      setMediaState((prev) => ({
        ...prev,
        localMedia: { ...prev.localMedia, cameraEnabled: !nextEnabled }
      }))
    }
  }, [mediaState.localMedia.cameraEnabled])

  useEffect(() => {
    mountedRef.current = true
    setMediaState(createInitialMiniRoomMediaState(roomInfo))
    void runConnectAttempt()

    return () => {
      mountedRef.current = false
      requestIdRef.current = requestIdRef.current + 1
      void livekitClientRef.current?.disconnect()
      livekitClientRef.current = null
    }
  }, [roomInfo, runConnectAttempt])

  return {
    mediaState,
    retryConnect,
    toggleMic,
    toggleCamera
  }
}
