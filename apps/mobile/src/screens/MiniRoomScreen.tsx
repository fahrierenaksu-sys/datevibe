import type { ServerEvent } from "@datevibe/contracts"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import type { CandidateAvatarSnapshot } from "../components/DiscoverCard"
import { ReportModal } from "../components/ReportModal"
import { ROOM_AVATAR_CATALOG } from "../features/avatarV2/room/avatarRoom.mock"
import { projectAvatarV2ToRoomAvatarAppearance } from "../features/avatarV2/room/avatarRoomProjection"
import { getRoomAvatarRenderLayers } from "../features/avatarV2/room/avatarRoomSelectors"
import { useAvatarV2 } from "../features/avatarV2/state/AvatarV2Provider"
import { useGlobalRealtime, useGlobalRealtimeEvents } from "../features/realtime/globalRealtimeProvider"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import { resolveRoomV2Scene } from "../features/roomV2/roomV2Selectors"
import { useRoomV2 } from "../features/roomV2/state/RoomV2Provider"
import type { SessionActor } from "../features/session/sessionApi"
import { MiniRoomScene } from "../features/miniRoom/scene/MiniRoomScene"
import { useInRoomChat } from "../features/miniRoom/useInRoomChat"
import { useMiniRoomMedia } from "../features/miniRoom/useMiniRoomMedia"
import { useMiniRoomReactions } from "../features/miniRoom/useMiniRoomReactions"
import { miniRoomAssets } from "../features/miniRoom/scene/miniRoomAssets"
import type {
  MiniRoomParticipantAvatarSnapshot,
  MiniRoomParticipantAvatarSnapshots
} from "../features/miniRoom/scene/miniRoomSceneTypes"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { uiTheme } from "../ui/theme"

type MiniRoomScreenProps = NativeStackScreenProps<RootStackParamList, "MiniRoom"> & {
  sessionActor: SessionActor
}

export function MiniRoomScreen(props: MiniRoomScreenProps) {
  const { navigation, route, sessionActor } = props
  const { readyMiniRoom, participants } = route.params
  const { miniRoom, mediaSession } = readyMiniRoom
  const { userRoomDecor } = useRoomV2()
  const { avatar: localAvatarV2, catalog: avatarV2Catalog } = useAvatarV2()
  const { mediaState, retryConnect, toggleMic } = useMiniRoomMedia({ miniRoom, mediaSession })
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
  const [safetyVisible, setSafetyVisible] = useState(false)

  const hostRoomSnapshot = useMemo(
    () =>
      resolveRoomV2Scene({
        roomShellCatalog: ROOM_V2_SHELL_CATALOG,
        furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
        decor: userRoomDecor,
        defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
      }),
    [userRoomDecor]
  )

  const participantAvatarSnapshots = useMemo<MiniRoomParticipantAvatarSnapshots>(() => {
    const localSnapshot = createCurrentUserAvatarSnapshot({
      userId: participants.you.userId,
      displayName: participants.you.displayName,
      avatar: localAvatarV2,
      avatarCatalog: avatarV2Catalog
    })
    const partnerSnapshot = createPartnerFallbackAvatarSnapshot({
      userId: participants.partner.userId,
      displayName: participants.partner.displayName,
      candidateAvatarSnapshot: participants.partner.avatarSnapshot
    })

    return {
      local: localSnapshot,
      partner: partnerSnapshot
    }
  }, [
    avatarV2Catalog,
    localAvatarV2,
    participants.partner.displayName,
    participants.partner.avatarSnapshot,
    participants.partner.userId,
    participants.you.displayName,
    participants.you.userId
  ])

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
    if (exitedRef.current || endRequestedRef.current) {
      return
    }
    endRequestedRef.current = true
    setEndRequested(true)
    if (lifecycleConnectionStatus === "connected") {
      sendLifecycleEvent({
        type: "mini_room.leave",
        payload: {
          miniRoomId: miniRoom.miniRoomId
        }
      })
    }
    exitToDebrief()
  }, [exitToDebrief, lifecycleConnectionStatus, miniRoom.miniRoomId, sendLifecycleEvent])

  const handleSafetyActionComplete = useCallback((): void => {
    setSafetyVisible(false)
    if (!exitedRef.current) {
      exitToDebrief()
    }
  }, [exitToDebrief])

  const leaveDisabled = endRequested

  return (
    <View style={styles.root}>
      <ReportModal
        visible={safetyVisible}
        targetUserId={participants.partner.userId}
        targetDisplayName={participants.partner.displayName}
        onClose={() => setSafetyVisible(false)}
        onActionComplete={handleSafetyActionComplete}
      />
      <MiniRoomScene
        localUser={participants.you}
        partnerUser={participants.partner}
        participantAvatarSnapshots={participantAvatarSnapshots}
        connectionStatus={status}
        localMedia={mediaState.localMedia}
        roomDecorScene={hostRoomSnapshot}
        recentReactions={recentReactions}
        canSendReaction={canSend}
        leaveDisabled={leaveDisabled}
        onLeave={requestEndMiniRoom}
        onOpenSafety={() => setSafetyVisible(true)}
        onRetryConnect={() => {
          void retryConnect()
        }}
        onToggleMic={() => {
          void toggleMic()
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

function createCurrentUserAvatarSnapshot(input: {
  userId: string
  displayName: string
  avatar: Parameters<typeof projectAvatarV2ToRoomAvatarAppearance>[0]["avatar"]
  avatarCatalog: Parameters<typeof projectAvatarV2ToRoomAvatarAppearance>[0]["avatarCatalog"]
}): MiniRoomParticipantAvatarSnapshot {
  const { appearance } = projectAvatarV2ToRoomAvatarAppearance({
    avatar: input.avatar,
    avatarCatalog: input.avatarCatalog,
    roomAvatarCatalog: ROOM_AVATAR_CATALOG
  })

  return {
    userId: input.userId,
    displayName: input.displayName,
    role: "local",
    source: "avatar_v2_current_user",
    appearance: {
      base: "female_base_01",
      snapshotSource: "avatar_v2_current_user",
      roomAvatarLayers: getRoomAvatarRenderLayers({
        appearance,
        catalog: ROOM_AVATAR_CATALOG
      }),
      fullBodyAsset: miniRoomAssets.avatars.localGirl
    }
  }
}

function createPartnerFallbackAvatarSnapshot(input: {
  userId: string
  displayName: string
  candidateAvatarSnapshot?: CandidateAvatarSnapshot
}): MiniRoomParticipantAvatarSnapshot {
  if (input.candidateAvatarSnapshot?.source === "remote_candidate_avatar") {
    return {
      userId: input.userId,
      displayName: input.candidateAvatarSnapshot.displayName,
      role: "partner",
      source: "remote_participant_avatar",
      appearance: {
        base: "male_base_01",
        snapshotSource: "remote_participant_avatar",
        fullBodyAsset: miniRoomAssets.avatars.partnerBoy
      }
    }
  }

  return {
    userId: input.userId,
    displayName: input.displayName,
    role: "partner",
    source: "demo_partner_fallback",
    appearance: {
      base: "male_base_01",
      snapshotSource: "demo_partner_fallback",
      fullBodyAsset: miniRoomAssets.avatars.partnerBoy,
      fallbackReason: "Partner avatar snapshot is not available in the current MiniRoom route."
    }
  }
}
