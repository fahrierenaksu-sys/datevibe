/**
 * DemoLobbyView – replaces the real lobby discover section when demo mode is active.
 *
 * Shows:
 * - Swipeable profile cards with left/right gestures
 * - Like (♥) / Skip (✕) action buttons
 * - Match detection + MatchResultModal trigger
 * - Empty state when deck is exhausted
 * - Deck progress indicator
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  Vibration,
  View
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { useDemoStore } from "../features/demo/demoStore"
import { DEMO_CURRENT_USER } from "../features/demo/dummyProfiles"
import type { DummyProfile } from "../features/demo/dummyProfiles"
import { useSessionState } from "../features/session/useSessionState"
import { SwipeableDiscoverCard } from "../features/demo/SwipeableDiscoverCard"
import { MatchResultModal } from "../components/MatchResultModal"
import { findThreadForPartner } from "../features/chat/chatStore"
import { Avatar } from "../ui/avatar"
import { ActionButtonCircle } from "../ui/primitives"
import { uiTheme } from "../ui/theme"

export function DemoLobbyView() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const demo = useDemoStore()
  const { sessionActor } = useSessionState()
  const [matchModalProfile, setMatchModalProfile] = useState<DummyProfile | null>(null)

  // Match animation values
  const matchGlowAnim = useRef(new Animated.Value(0)).current

  const handleSwipeRight = useCallback(
    (userId: string) => {
      Vibration.vibrate(18)
      const result = demo.like(
        userId,
        sessionActor
          ? {
              userId: sessionActor.profile.userId,
              displayName: sessionActor.profile.displayName
            }
          : undefined
      )
      if (result.matched && result.profile) {
        // Show match modal with delay for card exit animation
        setTimeout(() => {
          setMatchModalProfile(result.profile)
          // Trigger match glow animation
          matchGlowAnim.setValue(0)
          Animated.sequence([
            Animated.timing(matchGlowAnim, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true
            }),
            Animated.timing(matchGlowAnim, {
              toValue: 0.6,
              duration: 600,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true
            })
          ]).start()
          Vibration.vibrate([0, 40, 60, 40, 60, 80])
        }, 320)
      }
    },
    [demo, matchGlowAnim, sessionActor]
  )

  const handleSwipeLeft = useCallback(
    (userId: string) => {
      Vibration.vibrate(10)
      demo.skip(userId)
    },
    [demo]
  )

  const handleDismissMatch = useCallback(() => {
    setMatchModalProfile(null)
  }, [])

  const handleKeepDiscovering = useCallback(() => {
    setMatchModalProfile(null)
  }, [])

  const handleViewSaved = useCallback(() => {
    setMatchModalProfile(null)
    navigation.navigate("SavedConnections")
  }, [navigation])

  const handleSendMessage = useCallback(() => {
    if (!matchModalProfile) return
    setMatchModalProfile(null)
    const thread = findThreadForPartner(matchModalProfile.userId)
    if (thread) {
      navigation.navigate("ChatThread", { threadId: thread.threadId })
    } else {
      navigation.navigate("ChatThread", {
        partnerId: matchModalProfile.userId,
        partnerName: matchModalProfile.displayName
      })
    }
  }, [matchModalProfile, navigation])

  const handleGoInbox = useCallback(() => {
    navigation.navigate("Inbox")
  }, [navigation])

  return (
    <View style={styles.demoContainer}>
      {/* "Who liked you" hint strip */}
      <View style={styles.likeHintStrip}>
        <View style={styles.likeHintIcon}>
          <Text style={styles.likeHintIconText}>♥</Text>
        </View>
        <View style={styles.likeHintContent}>
          <Text style={styles.likeHintTitle}>2 kişi seni beğendi</Text>
          <Text style={styles.likeHintBody}>
            Sağa kaydırarak eşleşme şansını yakala!
          </Text>
        </View>
      </View>

      {/* Swipeable card */}
      {demo.featured ? (
        <>
          <SwipeableDiscoverCard
            key={demo.featured.userId}
            profile={demo.featured}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
          />

          {/* Action buttons under card */}
          <View style={styles.actionRow}>
            <ActionButtonCircle
              onPress={() => {
                if (demo.featured) handleSwipeLeft(demo.featured.userId)
              }}
              size={60}
            >
              ✕
            </ActionButtonCircle>
            <ActionButtonCircle
              onPress={handleGoInbox}
              size={52}
            >
              💬
            </ActionButtonCircle>
            <ActionButtonCircle
              onPress={() => {
                if (demo.featured) handleSwipeRight(demo.featured.userId)
              }}
              size={76}
              variant="primary"
            >
              ♥
            </ActionButtonCircle>
          </View>
        </>
      ) : (
        <EmptyDemoDeck onReset={demo.reset} />
      )}

      {/* Deck progress */}
      <View style={styles.progressRow}>
        <View style={styles.progressDot} />
        <Text style={styles.progressText}>
          {demo.deckRemaining > 0
            ? `${demo.deckRemaining} kişi kaldı`
            : "Herkesi gördün"}
        </Text>
      </View>

      {/* Matched profiles indicator */}
      {demo.matchedProfiles.length > 0 ? (
        <View style={styles.matchedStrip}>
          <View style={styles.matchedIcon}>
            <Text style={styles.matchedIconText}>✦</Text>
          </View>
          <View style={styles.matchedContent}>
            <Text style={styles.matchedTitle}>
              {demo.matchedProfiles.length} eşleşme!
            </Text>
            <Text style={styles.matchedBody}>
              {demo.matchedProfiles.map((p) => p.firstName).join(", ")} ile eşleştin.
              Chat'e git ve konuş!
            </Text>
          </View>
          <ActionButtonCircle onPress={handleGoInbox} size={40}>
            →
          </ActionButtonCircle>
        </View>
      ) : null}

      {/* Match Result Modal */}
      <MatchResultModal
        visible={matchModalProfile !== null}
        currentUserName={DEMO_CURRENT_USER.displayName}
        matchedUserName={matchModalProfile?.displayName ?? ""}
        matchedUserId={matchModalProfile?.userId}
        onClose={handleDismissMatch}
        onViewSaved={handleViewSaved}
        onKeepDiscovering={handleKeepDiscovering}
        onSendMessage={handleSendMessage}
      />
    </View>
  )
}

function EmptyDemoDeck(props: { onReset: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyGlow} pointerEvents="none" />
      <Avatar
        name={DEMO_CURRENT_USER.displayName}
        seed={DEMO_CURRENT_USER.userId}
        size={100}
        ring="soft"
      />
      <Text style={styles.emptyTitle}>Herkesi gördün! 🎉</Text>
      <Text style={styles.emptyBody}>
        Şimdilik buralarda kimse kalmadı. Eşleşmelerini kontrol et veya tekrar başla.
      </Text>
      <ActionButtonCircle
        onPress={props.onReset}
        size={52}
        variant="primary"
      >
        ↻
      </ActionButtonCircle>
      <Text style={styles.resetHint}>Tekrar Başla</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  demoContainer: {
    gap: uiTheme.spacing.lg,
    width: "100%"
  },
  likeHintStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: "#FAD0E3",
    ...uiTheme.shadow.soft
  },
  likeHintIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.primary
  },
  likeHintIconText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900"
  },
  likeHintContent: {
    flex: 1,
    gap: 2
  },
  likeHintTitle: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  likeHintBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    lineHeight: 17,
    fontWeight: "600"
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: uiTheme.spacing.lg,
    marginTop: -uiTheme.spacing.xs
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -uiTheme.spacing.xs
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.success
  },
  progressText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  matchedStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.successSoft,
    borderWidth: 1,
    borderColor: "rgba(58, 192, 138, 0.28)",
    ...uiTheme.shadow.soft
  },
  matchedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.success
  },
  matchedIconText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  matchedContent: {
    flex: 1,
    gap: 2
  },
  matchedTitle: {
    color: uiTheme.colors.successInk,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  matchedBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    lineHeight: 17,
    fontWeight: "600"
  },
  emptyCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.xl,
    gap: uiTheme.spacing.sm,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.card
  },
  emptyGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: uiTheme.colors.primarySoft,
    top: -90,
    right: -70,
    opacity: 0.55
  },
  emptyTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.heading,
    fontWeight: "800",
    textAlign: "center"
  },
  emptyBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: uiTheme.spacing.md
  },
  resetHint: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    marginTop: -uiTheme.spacing.xxs
  }
})
