/**
 * SwipeableDiscoverCard – a swipeable card for the discover deck.
 *
 * Supports:
 * - PanResponder-based horizontal drag gestures
 * - Visual tilt rotation while dragging
 * - Stamp overlays (LIKE / NOPE) that fade in with swipe direction
 * - Animated spring exit on release (if threshold met)
 * - Snap-back on release (if threshold not met)
 * - Photo display from dummy profile photo URLs
 * - Age + bio display for richer profile cards
 */

import { useCallback, useEffect, useRef } from "react"
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View
} from "react-native"
import { Avatar } from "../../ui/avatar"
import { TagChip } from "../../ui/primitives"
import { uiTheme } from "../../ui/theme"
import type { DummyProfile } from "./dummyProfiles"

const SCREEN_WIDTH = Dimensions.get("window").width
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28
const SWIPE_OUT_DURATION = 280

interface SwipeableDiscoverCardProps {
  profile: DummyProfile
  onSwipeRight: (userId: string) => void
  onSwipeLeft: (userId: string) => void
}

export function SwipeableDiscoverCard(props: SwipeableDiscoverCardProps) {
  const { profile, onSwipeRight, onSwipeLeft } = props
  const position = useRef(new Animated.ValueXY()).current
  const entryAnim = useRef(new Animated.Value(0)).current

  // Entry animation
  useEffect(() => {
    entryAnim.setValue(0)
    Animated.spring(entryAnim, {
      toValue: 1,
      tension: 68,
      friction: 9,
      useNativeDriver: true
    }).start()
  }, [entryAnim, profile.userId])

  const forceSwipe = useCallback(
    (direction: "left" | "right") => {
      const x = direction === "right" ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start(() => {
        if (direction === "right") {
          onSwipeRight(profile.userId)
        } else {
          onSwipeLeft(profile.userId)
        }
        position.setValue({ x: 0, y: 0 })
      })
    },
    [onSwipeLeft, onSwipeRight, position, profile.userId]
  )

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.15 })
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right")
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left")
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            tension: 120,
            friction: 7,
            useNativeDriver: true
          }).start()
        }
      }
    })
  ).current

  // Rotation interpolation based on horizontal drag
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ["-12deg", "0deg", "12deg"],
    extrapolate: "clamp"
  })

  // Stamp opacity
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp"
  })
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [1, 0.5, 0],
    extrapolate: "clamp"
  })

  const firstName = profile.firstName
  const distanceLabel =
    profile.distance < 100
      ? "Very close"
      : profile.distance < 500
        ? `${profile.distance}m`
        : "Nearby"

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: entryAnim,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate },
            {
              scale: entryAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1]
              })
            }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* LIKE stamp overlay */}
      <Animated.View style={[styles.stampContainer, styles.stampRight, { opacity: likeOpacity }]}>
        <View style={styles.likeStamp}>
          <Text style={styles.likeStampText}>LIKE</Text>
        </View>
      </Animated.View>

      {/* NOPE stamp overlay */}
      <Animated.View style={[styles.stampContainer, styles.stampLeft, { opacity: nopeOpacity }]}>
        <View style={styles.nopeStamp}>
          <Text style={styles.nopeStampText}>NOPE</Text>
        </View>
      </Animated.View>

      {/* Hero photo section */}
      <View style={styles.heroBlock}>
        <View style={styles.heroGlow} pointerEvents="none" />
        <View style={styles.heroGlowSecondary} pointerEvents="none" />
        <Avatar name={profile.displayName} seed={profile.userId} size={172} ring="strong" />

        {/* Age badge */}
        <View style={styles.ageBadge}>
          <Text style={styles.ageBadgeText}>{profile.age}</Text>
        </View>

        {/* Distance pill */}
        <View style={styles.distancePill}>
          <View style={styles.distanceDot} />
          <Text style={styles.distanceText}>{distanceLabel}</Text>
        </View>

        {/* Live stage label */}
        <View style={styles.stageLabel}>
          <View style={styles.stageDot} />
          <Text style={styles.stageLabelText}>Live stage</Text>
        </View>
      </View>

      {/* Name + age row */}
      <View style={styles.nameRow}>
        <View style={styles.identityStack}>
          <View style={styles.nameAgeRow}>
            <Text style={styles.nameText}>{firstName}</Text>
            <Text style={styles.ageText}>, {profile.age}</Text>
          </View>
          <Text style={styles.fullNameText}>{profile.lastName}</Text>
        </View>
        <TagChip label="Online now" />
      </View>

      {/* Bio */}
      <Text style={styles.bioText}>{profile.bio}</Text>

      {/* Tags */}
      <View style={styles.tagsRow}>
        <TagChip label={distanceLabel} />
        <TagChip label="Live now" />
        <TagChip label="Open to invite" />
      </View>

      {/* Swipe hint */}
      <View style={styles.swipeHintRow}>
        <Text style={styles.swipeHintLeft}>← NOPE</Text>
        <Text style={styles.swipeHintRight}>LIKE →</Text>
      </View>
    </Animated.View>
  )
}

/** Programmatic swipe trigger — used by action buttons */
export function useSwipeRef() {
  const positionRef = useRef(new Animated.ValueXY())
  return positionRef
}

const styles = StyleSheet.create({
  card: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    ...uiTheme.shadow.card,
    position: "relative",
    overflow: "visible"
  },
  stampContainer: {
    position: "absolute",
    top: uiTheme.spacing.xl,
    zIndex: 10
  },
  stampRight: {
    left: uiTheme.spacing.lg
  },
  stampLeft: {
    right: uiTheme.spacing.lg
  },
  likeStamp: {
    borderWidth: 3,
    borderColor: uiTheme.colors.success,
    borderRadius: uiTheme.radius.md,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    transform: [{ rotate: "-18deg" }]
  },
  likeStampText: {
    color: uiTheme.colors.success,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 3
  },
  nopeStamp: {
    borderWidth: 3,
    borderColor: uiTheme.colors.danger,
    borderRadius: uiTheme.radius.md,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    transform: [{ rotate: "18deg" }]
  },
  nopeStampText: {
    color: uiTheme.colors.danger,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 3
  },
  heroBlock: {
    height: 278,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: "#ECE9EE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative"
  },
  heroGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -50
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#FCE4F1",
    right: -40,
    top: 80
  },
  stageLabel: {
    position: "absolute",
    top: uiTheme.spacing.md,
    left: uiTheme.spacing.md,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.78)"
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.success
  },
  stageLabelText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  ageBadge: {
    position: "absolute",
    top: uiTheme.spacing.md,
    right: uiTheme.spacing.md,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 79, 152, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)"
  },
  ageBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  distancePill: {
    position: "absolute",
    bottom: uiTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  distanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.success
  },
  distanceText: {
    color: uiTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.sm
  },
  identityStack: {
    flex: 1,
    gap: 2
  },
  nameAgeRow: {
    flexDirection: "row",
    alignItems: "baseline"
  },
  nameText: {
    color: uiTheme.colors.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0
  },
  ageText: {
    color: uiTheme.colors.textSecondary,
    fontSize: 24,
    fontWeight: "700"
  },
  fullNameText: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 18,
    fontWeight: "800"
  },
  bioText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    lineHeight: 22,
    fontWeight: "600"
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs
  },
  swipeHintRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: uiTheme.spacing.xs
  },
  swipeHintLeft: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.5,
    opacity: 0.45
  },
  swipeHintRight: {
    color: uiTheme.colors.success,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.5,
    opacity: 0.45
  }
})
