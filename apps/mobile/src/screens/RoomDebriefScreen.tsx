import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { ConnectionDecisionStatus, ServerEvent } from "@datevibe/contracts"
import { useCallback, useEffect, useRef, useState } from "react"
import { Animated, Pressable, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "../ui/linearGradient"
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

  const heroAnim = useRef(new Animated.Value(0)).current
  const saveScaleAnim = useRef(new Animated.Value(1)).current
  const passScaleAnim = useRef(new Animated.Value(1)).current

  // Entrance animation
  useEffect(() => {
    Animated.spring(heroAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springGentle,
    }).start()
  }, [heroAnim])

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

  const handleSavePressIn = () => {
    Animated.spring(saveScaleAnim, {
      toValue: uiTheme.animation.scalePress,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handleSavePressOut = () => {
    Animated.spring(saveScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
  }

  const handlePassPressIn = () => {
    Animated.spring(passScaleAnim, {
      toValue: uiTheme.animation.scalePress,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handlePassPressOut = () => {
    Animated.spring(passScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
  }

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow}>Mini room ended</Text>
        </View>

        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  })
                },
                {
                  scale: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }
              ],
            }
          ]}
        >
          <View style={styles.avatarGlow}>
            <Avatar
              name={partner.displayName}
              seed={partner.userId}
              size={180}
              ring="strong"
            />
          </View>
          <View style={styles.metaPill}>
            <View style={[styles.metaDot, connected ? null : styles.metaDotSoft]} />
            <Text style={styles.metaPillText}>{meta}</Text>
          </View>
        </Animated.View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subhead}>
            Save the moment if it felt worth returning to. It stays private on
            this device unless the server confirms you both saved.
          </Text>
        </View>

        <View style={styles.momentCard}>
          <LinearGradient
            colors={["#FFFFFF", "#FFF8FB", "#FFF2F8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.momentIconCircle}>
            <Text style={styles.momentIconText}>✦</Text>
          </View>
          <View style={styles.momentCopy}>
            <Text style={styles.momentLabel}>Private memory</Text>
            <Text style={styles.momentText}>{momentLine}</Text>
          </View>
        </View>

        <View style={styles.choices}>
          <Animated.View style={[styles.choiceFlex, { transform: [{ scale: passScaleAnim }] }]}>
            <Pressable
              disabled={buttonsLocked}
              onPress={() => {
                void onPass()
              }}
              onPressIn={handlePassPressIn}
              onPressOut={handlePassPressOut}
              style={[
                styles.choiceButton,
                styles.passButton,
                buttonsLocked ? styles.choiceButtonLocked : null
              ]}
            >
              <Text style={styles.passEmoji}>👋</Text>
              <Text style={styles.passLabel}>Pass</Text>
              <Text style={styles.choiceHint}>Not this one</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.choiceFlex, { transform: [{ scale: saveScaleAnim }] }]}>
            <Pressable
              disabled={buttonsLocked}
              onPress={() => {
                void onSave()
              }}
              onPressIn={handleSavePressIn}
              onPressOut={handleSavePressOut}
              style={[
                styles.choiceButton,
                buttonsLocked ? styles.choiceButtonLocked : null
              ]}
            >
              <LinearGradient
                colors={uiTheme.gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFillObject, { borderRadius: uiTheme.radius.xl }]}
              />
              <Text style={styles.saveEmoji}>💖</Text>
              <Text style={styles.saveLabel}>Save moment</Text>
              <Text style={[styles.choiceHint, styles.saveHint]}>
                Keep it close
              </Text>
            </Pressable>
          </Animated.View>
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
    backgroundColor: uiTheme.colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.md,
    paddingBottom: uiTheme.spacing.lg,
  },
  eyebrowRow: {
    alignItems: "center",
    paddingVertical: uiTheme.spacing.sm,
  },
  eyebrow: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  hero: {
    alignItems: "center",
    gap: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.lg,
  },
  avatarGlow: {
    ...uiTheme.shadow.glow,
    borderRadius: 90,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    backgroundColor: uiTheme.colors.glass,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
  },
  metaDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: uiTheme.colors.success,
  },
  metaDotSoft: {
    backgroundColor: uiTheme.colors.warning,
  },
  metaPillText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  copyBlock: {
    gap: uiTheme.spacing.xs,
    paddingHorizontal: uiTheme.spacing.xs,
    paddingTop: uiTheme.spacing.sm,
    alignItems: "center",
  },
  title: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
    textAlign: "center",
  },
  subhead: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: uiTheme.spacing.md,
  },
  momentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.md,
    marginTop: uiTheme.spacing.lg,
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.float,
  },
  momentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: uiTheme.colors.chipBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  momentIconText: {
    fontSize: 18,
    color: uiTheme.colors.primary,
  },
  momentCopy: {
    flex: 1,
    gap: 3,
  },
  momentLabel: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  momentText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: "600",
  },
  choices: {
    flex: 1,
    flexDirection: "row",
    gap: uiTheme.spacing.md,
    marginTop: uiTheme.spacing.xl,
    marginBottom: uiTheme.spacing.md,
  },
  choiceFlex: {
    flex: 1,
  },
  choiceButton: {
    flex: 1,
    borderRadius: uiTheme.radius.xl,
    paddingVertical: uiTheme.spacing.xl,
    paddingHorizontal: uiTheme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.xs,
    borderWidth: 1,
    overflow: "hidden",
  },
  choiceButtonLocked: {
    opacity: 0.6,
  },
  passButton: {
    backgroundColor: uiTheme.colors.glass,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.soft,
  },
  passEmoji: {
    fontSize: 40,
  },
  passLabel: {
    ...uiTheme.font.subheading,
    color: uiTheme.colors.textPrimary,
  },
  saveEmoji: {
    fontSize: 40,
  },
  saveLabel: {
    ...uiTheme.font.subheading,
    color: "#FFFFFF",
    textAlign: "center",
  },
  choiceHint: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    letterSpacing: 0.3,
  },
  saveHint: {
    color: "rgba(255, 255, 255, 0.85)",
  },
  laterButton: {
    alignSelf: "center",
    paddingVertical: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
  },
  laterText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textMuted,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
})
