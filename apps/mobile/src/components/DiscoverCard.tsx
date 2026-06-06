import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View } from "react-native"
import type { RealtimeConnectionStatus } from "../features/realtime/realtimeClient"
import { Avatar } from "../ui/avatar"
import { MyAvatar } from "../ui/myAvatar"
import { TagChip } from "../ui/primitives"
import { uiTheme } from "../ui/theme"

// ── Breathing pulse for online presence ─────────────────────

function useBreathingPulse(active: boolean) {
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!active) {
      anim.setValue(1)
      return
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1.08,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    )

    loop.start()
    return () => loop.stop()
  }, [active, anim])

  return anim
}

// ── DiscoverCard ────────────────────────────────────────────

export interface DiscoverCardProps {
  displayName: string
  userId: string
  avatarSnapshot?: CandidateAvatarSnapshot
  headline: string
  distanceLabel: string
  vibeTags: string[]
  isPending: boolean
  isOnline: boolean
}

export type CandidateAvatarSnapshotSource =
  | "remote_candidate_avatar"
  | "preview_fallback"

export interface CandidateAvatarSnapshot {
  kind: "candidate_avatar_snapshot"
  userId: string
  displayName: string
  source: CandidateAvatarSnapshotSource
  previewSeed: string
  label: string
}

export function createCandidateAvatarSnapshot(input: {
  userId: string
  displayName: string
  avatarSnapshot?: CandidateAvatarSnapshot | null
}): CandidateAvatarSnapshot {
  if (
    input.avatarSnapshot &&
    input.avatarSnapshot.kind === "candidate_avatar_snapshot" &&
    input.avatarSnapshot.userId === input.userId
  ) {
    return input.avatarSnapshot
  }

  return {
    kind: "candidate_avatar_snapshot",
    userId: input.userId,
    displayName: input.displayName,
    source: "preview_fallback",
    previewSeed: input.userId,
    label: "Preview avatar"
  }
}

export function readCandidateAvatarSnapshot(
  value: unknown,
  fallback: { userId: string; displayName: string }
): CandidateAvatarSnapshot {
  const candidate = value as { avatarSnapshot?: unknown } | null | undefined
  const avatarSnapshot =
    candidate && typeof candidate === "object"
      ? candidate.avatarSnapshot
      : undefined

  return createCandidateAvatarSnapshot({
    ...fallback,
    avatarSnapshot: isCandidateAvatarSnapshot(avatarSnapshot)
      ? avatarSnapshot
      : null
  })
}

function isCandidateAvatarSnapshot(
  value: unknown
): value is CandidateAvatarSnapshot {
  if (!value || typeof value !== "object") return false
  const snapshot = value as CandidateAvatarSnapshot
  return (
    snapshot.kind === "candidate_avatar_snapshot" &&
    typeof snapshot.userId === "string" &&
    typeof snapshot.displayName === "string" &&
    typeof snapshot.previewSeed === "string" &&
    typeof snapshot.label === "string" &&
    (snapshot.source === "remote_candidate_avatar" ||
      snapshot.source === "preview_fallback")
  )
}

export function DiscoverCard(props: DiscoverCardProps) {
  const {
    displayName,
    userId,
    avatarSnapshot,
    headline,
    distanceLabel,
    vibeTags,
    isPending,
    isOnline
  } = props

  const breathScale = useBreathingPulse(isOnline)
  const resolvedAvatarSnapshot = createCandidateAvatarSnapshot({
    userId,
    displayName,
    avatarSnapshot
  })

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.heroBlock}>
        <View style={cardStyles.stageLabel}>
          <View
            style={[
              cardStyles.stageDot,
              { backgroundColor: isOnline ? uiTheme.colors.success : uiTheme.colors.warning }
            ]}
          />
          <Text style={cardStyles.stageLabelText}>
            {isOnline ? "Live stage" : "Quiet stage"}
          </Text>
        </View>
        <Animated.View
          style={[cardStyles.heroGlow, { transform: [{ scale: breathScale }] }]}
          pointerEvents="none"
        />
        <View style={cardStyles.heroGlowSecondary} pointerEvents="none" />
        <Avatar
          name={resolvedAvatarSnapshot.displayName}
          seed={resolvedAvatarSnapshot.previewSeed}
          size={172}
          ring="strong"
        />
        <View style={cardStyles.avatarSourcePill}>
          <Text style={cardStyles.avatarSourceText}>
            {resolvedAvatarSnapshot.label}
          </Text>
        </View>
        <View style={cardStyles.distancePill}>
          <View
            style={[
              cardStyles.distanceDot,
              { backgroundColor: isOnline ? uiTheme.colors.success : uiTheme.colors.warning }
            ]}
          />
          <Text style={cardStyles.distanceText}>{distanceLabel}</Text>
        </View>
      </View>

      <View style={cardStyles.nameRow}>
        <View style={cardStyles.identityStack}>
          <Text style={cardStyles.nameText}>{displayName}</Text>
          <Text style={cardStyles.headlineText}>{headline}</Text>
        </View>
        <TagChip label={isOnline ? "Online now" : "Taking it slow"} />
      </View>

      <View style={cardStyles.tagsRow}>
        {vibeTags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </View>

      {isPending ? (
        <View style={cardStyles.pendingBanner}>
          <View style={cardStyles.pendingDot} />
          <Text style={cardStyles.pendingText}>
            Waiting for {displayName.split(" ")[0]} to accept…
          </Text>
        </View>
      ) : null}
    </View>
  )
}

// ── EmptyDiscoverCard ───────────────────────────────────────

export interface EmptyDiscoverCardProps {
  connectionStatus: RealtimeConnectionStatus
  myDisplayName: string
  myUserId: string
  hasSeenEveryone: boolean
}

export function EmptyDiscoverCard(props: EmptyDiscoverCardProps) {
  const { connectionStatus, myDisplayName, myUserId, hasSeenEveryone } = props
  const connecting = connectionStatus === "connecting" || connectionStatus === "idle"
  const offline = connectionStatus === "error" || connectionStatus === "disconnected"

  const title = offline
    ? "We can't reach the room"
    : connecting
      ? "Joining the room…"
      : hasSeenEveryone
        ? "You've seen everyone nearby"
        : "Quiet around you"
  const body = offline
    ? "Check your connection and we'll try again."
    : connecting
      ? "Tuning in to who's nearby. One moment."
      : hasSeenEveryone
        ? "New people will appear here as the room changes."
        : "Stay a moment. We'll introduce you the second someone comes close."

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.heroBlock}>
        <View style={cardStyles.heroGlow} pointerEvents="none" />
        <View style={cardStyles.heroGlowSecondary} pointerEvents="none" />
        <MyAvatar
          name={myDisplayName}
          seed={myUserId}
          size={132}
          ring="soft"
        />
      </View>
      <Text style={cardStyles.emptyTitle}>{title}</Text>
      <Text style={cardStyles.emptyBody}>{body}</Text>
    </View>
  )
}

// ── Styles ──────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    ...uiTheme.shadow.card
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
    borderRadius: 3
  },
  stageLabelText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2
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
  avatarSourcePill: {
    position: "absolute",
    bottom: 54,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)"
  },
  avatarSourceText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  distanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3
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
  nameText: {
    color: uiTheme.colors.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0
  },
  headlineText: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 18,
    fontWeight: "800"
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: "#FAD0E3"
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.primary
  },
  pendingText: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
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
  }
})
