import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { ConnectionDecisionStatus, ServerEvent } from "@datevibe/contracts"
import { useCallback, useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  passConnection,
  saveConnection,
  updateSavedConnectionStatus
} from "../features/connections/savedConnectionsStore"
import {
  sendGlobal,
  useGlobalRealtime,
  useGlobalRealtimeEvents
} from "../features/realtime/globalRealtimeProvider"
import type { SessionActor } from "../features/session/sessionApi"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { uiTheme } from "../ui/theme"
import { addCoins } from "../features/cosmetics/cosmeticStore"

type RoomDebriefScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "RoomDebrief"
> & {
  sessionActor: SessionActor
}

type DecisionState = "idle" | "saving" | "passing" | "saved" | "passed"

const SERVER_DECISION_WINDOW_MS = 1600

interface PendingServerDecision {
  status: ConnectionDecisionStatus
  sent: boolean
}

function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  if (minutes <= 0) return `${seconds}s together`
  if (seconds === 0) return `${minutes} min together`
  return `${minutes} min ${seconds}s together`
}

function createMomentLine(connected: boolean, durationSeconds: number): string {
  if (!connected) {
    return "The room never fully settled, so this stays as a soft maybe."
  }

  if (durationSeconds < 20) {
    return "A quick hello, but a real one."
  }

  if (durationSeconds < 90) {
    return "Long enough to notice a first spark."
  }

  return "You gave each other a real pocket of time."
}

export function RoomDebriefScreen(props: RoomDebriefScreenProps) {
  const { navigation, route, sessionActor } = props
  const { miniRoomId, partner, durationSeconds, connected } = route.params
  const [decision, setDecision] = useState<DecisionState>("idle")
  const pendingServerDecisionRef = useRef<PendingServerDecision | null>(null)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const coinsAwardedRef = useRef(false)

  // Award coins for completing a room session
  useEffect(() => {
    if (coinsAwardedRef.current) return
    coinsAwardedRef.current = true
    addCoins(25)
  }, [])

  const clearFallbackTimer = useCallback((): void => {
    if (!fallbackTimerRef.current) return
    clearTimeout(fallbackTimerRef.current)
    fallbackTimerRef.current = null
  }, [])

  const goLobby = useCallback((): void => {
    clearFallbackTimer()
    navigation.navigate("Lobby")
  }, [clearFallbackTimer, navigation])

  const scheduleLobbyReturn = useCallback((): void => {
    clearFallbackTimer()
    fallbackTimerRef.current = setTimeout(() => {
      goLobby()
    }, SERVER_DECISION_WINDOW_MS)
  }, [clearFallbackTimer, goLobby])

  const { connectionStatus: realtimeStatus } = useGlobalRealtime()

  const sendPendingServerDecision = useCallback((): void => {
    const pending = pendingServerDecisionRef.current
    if (!pending || pending.sent || realtimeStatus !== "connected") {
      return
    }

    pending.sent = true
    sendGlobal({
      type: "connection.decide",
      payload: {
        miniRoomId,
        partnerUserId: partner.userId,
        status: pending.status
      }
    })
  }, [miniRoomId, partner.userId, realtimeStatus])

  const handleServerEvent = useCallback(
    (event: ServerEvent): void => {
      if (
        event.type === "connection.decision_recorded" &&
        event.payload.miniRoomId === miniRoomId &&
        event.payload.actorUserId === sessionActor.profile.userId &&
        event.payload.partnerUserId === partner.userId
      ) {
        void updateSavedConnectionStatus({
          userId: partner.userId,
          status: event.payload.status === "saved" ? "pending" : "unmatched"
        })
        return
      }

      if (
        event.type === "connection.matched" &&
        event.payload.miniRoomId === miniRoomId &&
        event.payload.participantUserIds.includes(sessionActor.profile.userId) &&
        event.payload.participantUserIds.includes(partner.userId)
      ) {
        clearFallbackTimer()
        void updateSavedConnectionStatus({
          userId: partner.userId,
          status: "mutual"
        })
      }
    },
    [clearFallbackTimer, miniRoomId, partner.userId, sessionActor.profile.userId]
  )

  useGlobalRealtimeEvents(handleServerEvent)

  const onSave = async (): Promise<void> => {
    if (decision !== "idle") return
    setDecision("saving")
    try {
      await saveConnection({
        userId: partner.userId,
        displayName: partner.displayName,
        connected,
        durationSeconds,
        status: "local-only"
      })
      pendingServerDecisionRef.current = { status: "saved", sent: false }
      sendPendingServerDecision()
      setDecision("saved")
      scheduleLobbyReturn()
    } catch {
      setDecision("idle")
    }
  }

  const onPass = async (): Promise<void> => {
    if (decision !== "idle") return
    setDecision("passing")
    try {
      await passConnection({ userId: partner.userId })
      pendingServerDecisionRef.current = { status: "passed", sent: false }
      sendPendingServerDecision()
      setDecision("passed")
      scheduleLobbyReturn()
    } catch {
      setDecision("idle")
    }
  }

  const meta = connected
    ? formatDuration(durationSeconds)
    : "You didn't quite connect"
  const momentLine = createMomentLine(connected, durationSeconds)
  const title = connected
    ? `How was meeting ${partner.displayName}?`
    : "That room did not quite land."

  const buttonsLocked = decision !== "idle"

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>Mini room ended</Text>
        </View>

        <View style={styles.hero}>
          <Avatar
            name={partner.displayName}
            seed={partner.userId}
            size={168}
            ring="strong"
          />
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{meta}</Text>
          </View>
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subhead}>
            Save the moment if it felt worth returning to. It stays private on
            this device unless the server confirms you both saved.
          </Text>
        </View>

        <View style={styles.momentCard}>
          <View
            style={[
              styles.momentDot,
              connected ? null : styles.momentDotSoft
            ]}
          />
          <View style={styles.momentCopy}>
            <Text style={styles.momentLabel}>Private memory</Text>
            <Text style={styles.momentText}>{momentLine}</Text>
          </View>
        </View>

        <View style={styles.choices}>
          <Pressable
            disabled={buttonsLocked}
            onPress={() => {
              void onPass()
            }}
            style={({ pressed }) => [
              styles.choiceButton,
              styles.passButton,
              pressed && !buttonsLocked ? styles.passButtonPressed : null,
              buttonsLocked ? styles.choiceButtonLocked : null
            ]}
          >
            <Text style={styles.passEmoji}>👋</Text>
            <Text style={styles.passLabel}>Pass</Text>
            <Text style={styles.choiceHint}>Not this one</Text>
          </Pressable>

          <Pressable
            disabled={buttonsLocked}
            onPress={() => {
              void onSave()
            }}
            style={({ pressed }) => [
              styles.choiceButton,
              styles.saveButton,
              pressed && !buttonsLocked ? styles.saveButtonPressed : null,
              buttonsLocked ? styles.choiceButtonLocked : null
            ]}
          >
            <Text style={styles.saveEmoji}>💖</Text>
            <Text style={styles.saveLabel}>Save moment</Text>
            <Text style={[styles.choiceHint, styles.saveHint]}>
              Keep it close
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={goLobby}
          hitSlop={10}
          style={styles.laterButton}
          disabled={buttonsLocked}
        >
          <Text style={styles.laterText}>Decide later</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.md,
    paddingBottom: uiTheme.spacing.lg
  },
  eyebrowRow: {
    alignItems: "center",
    paddingVertical: uiTheme.spacing.sm
  },
  eyebrow: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  hero: {
    alignItems: "center",
    gap: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.lg
  },
  metaPill: {
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    backgroundColor: uiTheme.colors.surfaceSoft,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  metaPillText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.4
  },
  copyBlock: {
    gap: uiTheme.spacing.xs,
    paddingHorizontal: uiTheme.spacing.xs,
    paddingTop: uiTheme.spacing.sm,
    alignItems: "center"
  },
  title: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.heading,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3
  },
  subhead: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: uiTheme.spacing.md
  },
  momentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    marginTop: uiTheme.spacing.lg,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  momentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: uiTheme.colors.success
  },
  momentDotSoft: {
    backgroundColor: uiTheme.colors.warning
  },
  momentCopy: {
    flex: 1,
    gap: 2
  },
  momentLabel: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  momentText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 20,
    fontWeight: "600"
  },
  choices: {
    flex: 1,
    flexDirection: "row",
    gap: uiTheme.spacing.md,
    marginTop: uiTheme.spacing.xl,
    marginBottom: uiTheme.spacing.md
  },
  choiceButton: {
    flex: 1,
    borderRadius: uiTheme.radius.xl,
    paddingVertical: uiTheme.spacing.xl,
    paddingHorizontal: uiTheme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.xs,
    borderWidth: 1
  },
  choiceButtonLocked: {
    opacity: 0.6
  },
  passButton: {
    backgroundColor: uiTheme.colors.surface,
    borderColor: uiTheme.colors.borderStrong
  },
  passButtonPressed: {
    backgroundColor: uiTheme.colors.surfaceMuted
  },
  passEmoji: {
    fontSize: 36
  },
  passLabel: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800"
  },
  saveButton: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: uiTheme.colors.primaryDeep,
    ...uiTheme.shadow.lift
  },
  saveButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  saveEmoji: {
    fontSize: 36
  },
  saveLabel: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    textAlign: "center"
  },
  choiceHint: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600",
    letterSpacing: 0.3
  },
  saveHint: {
    color: "rgba(255, 255, 255, 0.85)"
  },
  laterButton: {
    alignSelf: "center",
    paddingVertical: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md
  },
  laterText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700",
    textDecorationLine: "underline"
  }
})
