import type { ServerEvent } from "@datevibe/contracts"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ReactionBar } from "../components/ReactionBar"
import { useGlobalRealtime, useGlobalRealtimeEvents } from "../features/realtime/globalRealtimeProvider"
import type { SessionActor } from "../features/session/sessionApi"
import { useMiniRoomMedia } from "../features/miniRoom/useMiniRoomMedia"
import { useMiniRoomReactions } from "../features/miniRoom/useMiniRoomReactions"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { ConnectionPill } from "../ui/connectionPill"
import { uiTheme } from "../ui/theme"

type MiniRoomScreenProps = NativeStackScreenProps<RootStackParamList, "MiniRoom"> & {
  sessionActor: SessionActor
}

const REACTION_EMOJI: Record<string, string> = {
  wave: "👋",
  heart: "❤️",
  laugh: "😂",
  fire: "🔥"
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
  const [showTechnical, setShowTechnical] = useState(false)

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

  const statusCopy = useMemo(() => {
    if (status === "connected") {
      return {
        title: "You're in the room.",
        body: `Say hi to ${participants.partner.displayName}.`
      }
    }
    if (status === "error") {
      return {
        title: "Room didn't connect.",
        body: "Networks can be picky. Want to try again?"
      }
    }
    if (status === "disconnected") {
      return {
        title: "Room ended.",
        body: "Head back to discover when you're ready."
      }
    }
    return {
      title: "Finding each other…",
      body: "Tuning the connection. One moment."
    }
  }, [participants.partner.displayName, status])

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="miniRoom" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={requestEndMiniRoom}
            disabled={leaveDisabled}
            style={({ pressed }) => [
              styles.topIconButton,
              leaveDisabled ? styles.topIconButtonDisabled : null,
              pressed ? styles.topIconButtonPressed : null
            ]}
          >
            <Text style={styles.topIconText}>←</Text>
          </Pressable>
          <View style={styles.topCenter}>
            <Text style={styles.topEyebrow}>Mini room</Text>
            <ConnectionPill status={status} tone="dark" />
          </View>
          <View style={styles.topRightSpacer} />
        </View>

        <View style={styles.scene}>
          <View style={styles.avatarPair}>
            <View style={styles.avatarColumn}>
              <Avatar
                name={participants.you.displayName}
                seed={participants.you.userId}
                size={124}
                ring="strong"
              />
              <Text style={styles.nameLabel}>You</Text>
            </View>

            <View style={styles.connector}>
              <View style={styles.connectorLine} />
              <View
                style={[
                  styles.connectorBadge,
                  status === "connected" ? styles.connectorBadgeLive : null
                ]}
              >
                <Text style={styles.connectorHeart}>♥</Text>
              </View>
              <View style={styles.connectorLine} />
            </View>

            <View style={styles.avatarColumn}>
              <Avatar
                name={participants.partner.displayName}
                seed={participants.partner.userId}
                size={124}
                ring="strong"
              />
              <Text style={styles.nameLabel} numberOfLines={1}>
                {participants.partner.displayName}
              </Text>
            </View>
          </View>

          <View style={styles.statusBlock}>
            <Text style={styles.statusTitle}>{statusCopy.title}</Text>
            <Text style={styles.statusBody}>{statusCopy.body}</Text>
            {status === "error" ? (
              <Pressable
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed ? styles.retryButtonPressed : null
                ]}
                onPress={() => {
                  void retryConnect()
                }}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {recentReactions.length > 0 ? (
          <View style={styles.reactionFeed}>
            {recentReactions.map((entry) => (
              <View
                key={entry.id}
                style={[
                  styles.reactionFeedPill,
                  entry.fromPartner
                    ? styles.reactionFeedPillPartner
                    : styles.reactionFeedPillSelf
                ]}
              >
                <Text style={styles.reactionFeedEmoji}>
                  {REACTION_EMOJI[entry.reaction]}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.reactionRow}>
          <ReactionBar
            disabled={!canSend}
            onSendReaction={sendReaction}
          />
        </View>

        <View style={styles.mediaDock}>
          <View style={styles.mediaToggleRow}>
            <MediaToggle
              label="Mic"
              enabled={mediaState.localMedia.micEnabled}
              icon={mediaState.localMedia.micEnabled ? "🎤" : "🔇"}
              onPress={() => { void toggleMic() }}
              disabled={status !== "connected"}
            />
            <MediaToggle
              label="Cam"
              enabled={mediaState.localMedia.cameraEnabled}
              icon={mediaState.localMedia.cameraEnabled ? "📹" : "📷"}
              onPress={() => { void toggleCamera() }}
              disabled={status !== "connected"}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.leaveButton,
              leaveDisabled ? styles.leaveButtonDisabled : null,
              pressed ? styles.leaveButtonPressed : null
            ]}
            onPress={requestEndMiniRoom}
            disabled={leaveDisabled}
          >
            <Text style={styles.leaveText}>Leave room</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setShowTechnical((prev) => !prev)}
          style={styles.technicalToggle}
          hitSlop={8}
        >
          <Text style={styles.technicalToggleText}>
            {showTechnical ? "Hide technical info" : "Technical info"}
          </Text>
        </Pressable>

        {showTechnical ? (
          <View style={styles.technicalCard}>
            <TechRow label="Room" value={miniRoom.miniRoomId.slice(-10)} />
            <TechRow label="LiveKit" value={miniRoom.livekitRoomName} />
            <TechRow label="Issued" value={mediaSession.issuedAt} />
            {mediaState.errorMessage ? (
              <TechRow label="Error" value={mediaState.errorMessage} />
            ) : null}
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  )
}

interface MediaToggleProps {
  label: string
  enabled: boolean
  icon: string
  onPress: () => void
  disabled: boolean
}

function MediaToggle(props: MediaToggleProps) {
  const { label, enabled, icon, onPress, disabled } = props
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.mediaToggle,
        enabled ? styles.mediaToggleActive : styles.mediaToggleInactive,
        disabled ? styles.mediaToggleDisabled : null,
        pressed && !disabled ? styles.mediaTogglePressed : null
      ]}
    >
      <Text style={styles.mediaToggleIcon}>{icon}</Text>
      <Text style={styles.mediaToggleLabel}>{label}</Text>
    </Pressable>
  )
}

interface TechRowProps {
  label: string
  value: string
}

function TechRow(props: TechRowProps) {
  return (
    <View style={styles.techRow}>
      <Text style={styles.techLabel}>{props.label}</Text>
      <Text style={styles.techValue} numberOfLines={1}>
        {props.value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.nightBackground
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: uiTheme.spacing.md
  },
  topIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.nightSurface,
    borderWidth: 1,
    borderColor: uiTheme.colors.nightBorder
  },
  topIconButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.18)"
  },
  topIconButtonDisabled: {
    opacity: 0.45
  },
  topIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800"
  },
  topCenter: {
    alignItems: "center",
    gap: 4
  },
  topRightSpacer: {
    width: 40
  },
  topEyebrow: {
    color: uiTheme.colors.nightTextSecondary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  scene: {
    flex: 1,
    justifyContent: "center",
    gap: uiTheme.spacing.xl
  },
  avatarPair: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  avatarColumn: {
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    width: 140
  },
  nameLabel: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  },
  connector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: uiTheme.spacing.xs
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.25)"
  },
  connectorBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: uiTheme.colors.nightSurface,
    borderWidth: 1,
    borderColor: uiTheme.colors.nightBorder,
    alignItems: "center",
    justifyContent: "center"
  },
  connectorBadgeLive: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: "#FFFFFF",
    ...uiTheme.shadow.lift
  },
  connectorHeart: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800"
  },
  statusBlock: {
    alignItems: "center",
    gap: uiTheme.spacing.xs,
    paddingHorizontal: uiTheme.spacing.lg
  },
  statusTitle: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.heading,
    textAlign: "center",
    fontWeight: "800"
  },
  statusBody: {
    color: uiTheme.colors.nightTextSecondary,
    fontSize: uiTheme.typography.bodySmall,
    textAlign: "center",
    lineHeight: 21
  },
  retryButton: {
    marginTop: uiTheme.spacing.sm,
    minHeight: 46,
    paddingHorizontal: uiTheme.spacing.xl,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  retryButtonPressed: {
    opacity: 0.85
  },
  retryText: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  },
  reactionFeed: {
    flexDirection: "row",
    justifyContent: "center",
    gap: uiTheme.spacing.xs,
    marginBottom: uiTheme.spacing.xs,
    minHeight: 44,
    alignItems: "center"
  },
  reactionFeedPill: {
    width: 40,
    height: 40,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  reactionFeedPillPartner: {
    backgroundColor: "rgba(255, 79, 152, 0.18)",
    borderColor: "rgba(255, 79, 152, 0.35)"
  },
  reactionFeedPillSelf: {
    backgroundColor: uiTheme.colors.nightSurface,
    borderColor: uiTheme.colors.nightBorder
  },
  reactionFeedEmoji: {
    fontSize: 20
  },
  reactionRow: {
    marginBottom: uiTheme.spacing.sm
  },
  mediaDock: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    padding: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.nightSurface,
    borderRadius: uiTheme.radius.xxl,
    borderWidth: 1,
    borderColor: uiTheme.colors.nightBorder
  },
  mediaToggleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  mediaToggle: {
    alignItems: "center",
    justifyContent: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    gap: 2
  },
  mediaToggleActive: {
    backgroundColor: "rgba(255, 255, 255, 0.18)"
  },
  mediaToggleInactive: {
    backgroundColor: uiTheme.colors.nightSurfaceSoft
  },
  mediaToggleDisabled: {
    opacity: 0.4
  },
  mediaTogglePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }]
  },
  mediaToggleIcon: {
    fontSize: 20
  },
  mediaToggleLabel: {
    color: uiTheme.colors.nightTextSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  leaveButton: {
    paddingHorizontal: uiTheme.spacing.lg,
    minHeight: 52,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  leaveButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  leaveButtonDisabled: {
    opacity: 0.55
  },
  leaveText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  technicalToggle: {
    alignSelf: "center",
    marginTop: uiTheme.spacing.md
  },
  technicalToggleText: {
    color: uiTheme.colors.nightTextMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.3
  },
  technicalCard: {
    marginTop: uiTheme.spacing.sm,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.md,
    backgroundColor: uiTheme.colors.nightSurfaceSoft,
    borderWidth: 1,
    borderColor: uiTheme.colors.nightBorder,
    gap: 6
  },
  techRow: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm
  },
  techLabel: {
    color: uiTheme.colors.nightTextMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    width: 60
  },
  techValue: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: uiTheme.typography.caption,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace"
  }
})
