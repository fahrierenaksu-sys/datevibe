import { useCallback, useEffect, useRef } from "react"
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View
} from "react-native"
import { Avatar } from "../ui/avatar"
import { PrimaryButton, SecondaryButton } from "../ui/primitives"
import { uiTheme } from "../ui/theme"

interface MatchResultModalProps {
  visible: boolean
  currentUserName: string
  matchedUserName: string
  matchedUserId?: string
  onClose: () => void
  onViewSaved: () => void
  onKeepDiscovering: () => void
  onSendMessage?: () => void
}

// ── Confetti particle config ─────────────────────────────────
const PARTICLE_COUNT = 12
const PARTICLE_COLORS = [
  "#FF6B9D", "#C084FC", "#FF9A76", "#FACC15",
  "#4ADE80", "#60A5FA", "#F472B6", "#A78BFA",
  "#FB923C", "#34D399", "#818CF8", "#F87171"
]

interface ParticleConfig {
  color: string
  startX: number
  size: number
  glyph: string
}

const GLYPHS = ["✦", "♥", "◆", "●", "✧", "♡"]

function buildParticles(): ParticleConfig[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    startX: -120 + Math.random() * 240,
    size: 8 + Math.random() * 10,
    glyph: GLYPHS[i % GLYPHS.length]
  }))
}

function ConfettiOverlay(props: { playing: boolean }) {
  const particles = useRef(buildParticles()).current
  const anims = useRef(particles.map(() => new Animated.Value(0))).current

  useEffect(() => {
    if (!props.playing) {
      anims.forEach((a) => a.setValue(0))
      return
    }

    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 900 + i * 60,
        delay: i * 50,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      })
    )

    Animated.stagger(35, animations).start()
  }, [anims, props.playing])

  if (!props.playing) return null

  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.Text
          key={i}
          style={[
            confettiStyles.particle,
            {
              color: p.color,
              fontSize: p.size,
              opacity: anims[i].interpolate({
                inputRange: [0, 0.3, 1],
                outputRange: [0, 1, 0]
              }),
              transform: [
                {
                  translateX: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.startX]
                  })
                },
                {
                  translateY: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -180 - Math.random() * 60]
                  })
                },
                {
                  rotate: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", `${-180 + Math.random() * 360}deg`]
                  })
                },
                {
                  scale: anims[i].interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0, 1.2, 0.6]
                  })
                }
              ]
            }
          ]}
        >
          {p.glyph}
        </Animated.Text>
      ))}
    </View>
  )
}

const confettiStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 10
  },
  particle: {
    position: "absolute",
    fontWeight: "800"
  }
})

// ── Main modal ──────────────────────────────────────────────

export function MatchResultModal(props: MatchResultModalProps) {
  const {
    visible,
    currentUserName,
    matchedUserName,
    matchedUserId,
    onClose,
    onViewSaved,
    onKeepDiscovering,
    onSendMessage
  } = props

  const scaleAnim = useRef(new Animated.Value(0)).current
  const heartPulse = useRef(new Animated.Value(1)).current

  const runEntrance = useCallback(() => {
    scaleAnim.setValue(0)
    heartPulse.setValue(1)

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(heartPulse, {
            toValue: 1.18,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(heartPulse, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          })
        ])
      )
    ]).start()

    // Haptic burst
    if (Platform.OS !== "web") {
      Vibration.vibrate([0, 40, 60, 40, 60, 80])
    }
  }, [heartPulse, scaleAnim])

  useEffect(() => {
    if (visible) {
      runEntrance()
    }
  }, [runEntrance, visible])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <ConfettiOverlay playing={visible} />

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>

          <Text style={styles.headline}>It&apos;s a Match!</Text>
          <Text style={styles.supportText}>
            You and {matchedUserName} both saved the moment. It&apos;s now in your private memory shelf.
          </Text>

          <View style={styles.confirmedPill}>
            <View style={styles.confirmedDot} />
            <Text style={styles.confirmedText}>Server-confirmed mutual save</Text>
          </View>

          <View style={styles.connectionRow}>
            <View style={styles.avatarColumn}>
              <Avatar
                name={currentUserName}
                seed={currentUserName}
                size={84}
                ring="strong"
              />
              <Text style={styles.avatarName}>{currentUserName}</Text>
            </View>

            <View style={styles.heartConnector}>
              <View style={styles.connectorLine} />
              <Animated.View
                style={[
                  styles.heartBadge,
                  { transform: [{ scale: heartPulse }] }
                ]}
              >
                <Text style={styles.heartText}>♥</Text>
              </Animated.View>
              <View style={styles.connectorLine} />
            </View>

            <View style={styles.avatarColumn}>
              <Avatar
                name={matchedUserName}
                seed={matchedUserId ?? matchedUserName}
                size={84}
                ring="strong"
              />
              <Text style={styles.avatarName}>{matchedUserName}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label="View Saved Moment"
              onPress={() => {
                onViewSaved()
              }}
            />
            {onSendMessage ? (
              <SecondaryButton
                label="Send a Message"
                onPress={() => {
                  onSendMessage()
                }}
              />
            ) : null}
            <SecondaryButton
              label="Keep Discovering"
              onPress={() => {
                onKeepDiscovering()
              }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.lg
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28, 16, 34, 0.56)"
  },
  modalCard: {
    width: "100%",
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.xxl,
    paddingBottom: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    overflow: "visible",
    ...uiTheme.shadow.card
  },
  closeButton: {
    position: "absolute",
    right: uiTheme.spacing.md,
    top: uiTheme.spacing.md,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.secondary,
    zIndex: 20
  },
  closeButtonText: {
    color: uiTheme.colors.secondaryText,
    fontSize: 15,
    fontWeight: "700"
  },
  headline: {
    color: uiTheme.colors.textPrimary,
    fontSize: 34,
    textAlign: "center",
    fontWeight: "800"
  },
  supportText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: uiTheme.spacing.sm
  },
  confirmedPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.successSoft,
    borderWidth: 1,
    borderColor: "rgba(58, 192, 138, 0.28)"
  },
  confirmedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.success
  },
  confirmedText: {
    color: uiTheme.colors.successInk,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: uiTheme.spacing.sm
  },
  avatarColumn: {
    alignItems: "center",
    width: 96,
    gap: uiTheme.spacing.xs
  },
  avatarName: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600",
    textAlign: "center"
  },
  heartConnector: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: uiTheme.spacing.xs
  },
  connectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#F1D7E6"
  },
  heartBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFE7F3",
    borderWidth: 1,
    borderColor: "#F7BCD8",
    alignItems: "center",
    justifyContent: "center"
  },
  heartText: {
    color: uiTheme.colors.primary,
    fontSize: 18,
    fontWeight: "800"
  },
  actions: {
    gap: uiTheme.spacing.sm,
    marginTop: uiTheme.spacing.sm
  }
})
