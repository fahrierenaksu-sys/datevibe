import type { ServerEvent } from "@datevibe/contracts"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import { useGlobalRealtime, useGlobalRealtimeEvents } from "../features/realtime/globalRealtimeProvider"
import type { SessionActor } from "../features/session/sessionApi"
import { MiniRoomScene } from "../features/miniRoom/scene/MiniRoomScene"
import { useInRoomChat } from "../features/miniRoom/useInRoomChat"
import { useMiniRoomMedia } from "../features/miniRoom/useMiniRoomMedia"
import { useMiniRoomReactions } from "../features/miniRoom/useMiniRoomReactions"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { uiTheme } from "../ui/theme"

type MiniRoomScreenProps = NativeStackScreenProps<RootStackParamList, "MiniRoom"> & {
  sessionActor: SessionActor
}

export function MiniRoomScreen(props: MiniRoomScreenProps) {
  const { navigation, route, sessionActor } = props
  const { readyMiniRoom, participants } = route.params
  const { miniRoom, mediaSession } = readyMiniRoom
  const { mediaState, retryConnect, toggleMic, toggleCamera } = useMiniRoomMedia({ miniRoom, mediaSession })
  const { recentReactions, sendReaction, canSend } = useMiniRoomReactions({
    sessionActor,
    partnerUserId: participants.partner.userId
  })
  const roomChat = useInRoomChat({
    miniRoomId: miniRoom.miniRoomId,
    localUserId: sessionActor.profile.userId,
    partnerUserId: participants.partner.userId
  })

  const status = mediaState.connectionStatus
  const connectedAtRef = useRef<number | null>(null)
  const accumulatedConnectedMsRef = useRef<number>(0)
  const everConnectedRef = useRef<boolean>(false)
  const exitedRef = useRef<boolean>(false)
  const endRequestedRef = useRef<boolean>(false)
  const [endRequested, setEndRequested] = useState(false)

  useEffect(() => {
    if (status === "connected") {
      everConnectedRef.current = true
      if (connectedAtRef.current === null) {
        connectedAtRef.current = Date.now()
      }
    } else if (connectedAtRef.current !== null) {
      accumulatedConnectedMsRef.current +=
        Date.now() - connectedAtRef.current
      connectedAtRef.current = null
    }
  }, [status])

  const exitToDebrief = useCallback((): void => {
    if (exitedRef.current) return
    exitedRef.current = true
    let totalMs = accumulatedConnectedMsRef.current
    if (connectedAtRef.current !== null) {
      totalMs += Date.now() - connectedAtRef.current
      connectedAtRef.current = null
    }
    navigation.replace("RoomDebrief", {
      miniRoomId: miniRoom.miniRoomId,
      partner: participants.partner,
      durationSeconds: Math.round(totalMs / 1000),
      connected: everConnectedRef.current
    })
  }, [miniRoom.miniRoomId, navigation, participants.partner])

  const handleLifecycleEvent = useCallback(
    (event: ServerEvent): void => {
      if (
        event.type !== "mini_room.ended" ||
        event.payload.miniRoomId !== miniRoom.miniRoomId
      ) {
        return
      }
      exitToDebrief()
    },
    [exitToDebrief, miniRoom.miniRoomId]
  )

  useGlobalRealtimeEvents(handleLifecycleEvent)
  const { connectionStatus: lifecycleConnectionStatus, send: sendLifecycleEvent } = useGlobalRealtime()

  const requestEndMiniRoom = useCallback((): void => {
    if (
      lifecycleConnectionStatus !== "connected" ||
      exitedRef.current ||
      endRequestedRef.current
    ) {
      return
    }
    endRequestedRef.current = true
    setEndRequested(true)
    sendLifecycleEvent({
      type: "mini_room.leave",
      payload: {
        miniRoomId: miniRoom.miniRoomId
      }
    })
  }, [lifecycleConnectionStatus, miniRoom.miniRoomId, sendLifecycleEvent])

  const leaveDisabled = lifecycleConnectionStatus !== "connected" || endRequested

  return (
    <View style={styles.root}>
      <MiniRoomScene
        localUser={participants.you}
        partnerUser={participants.partner}
        connectionStatus={status}
        localMedia={mediaState.localMedia}
        recentReactions={recentReactions}
        canSendReaction={canSend}
        leaveDisabled={leaveDisabled}
        onLeave={requestEndMiniRoom}
        onRetryConnect={() => {
          void retryConnect()
        }}
        onToggleMic={() => {
          void toggleMic()
        }}
        onToggleCamera={() => {
          void toggleCamera()
        }}
        onSendReaction={sendReaction}
        inRoomMessages={roomChat.newMessages}
        consumeInRoomMessage={roomChat.consume}
        canChatSend={roomChat.canSend}
        onSendRoomMessage={roomChat.sendRoomMessage}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.nightBackground
  }
})
