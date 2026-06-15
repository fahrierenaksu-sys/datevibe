import { useEffect, useMemo, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View } from "react-native"
import type { RealtimeConnectionStatus } from "../features/realtime/realtimeClient"
import {
  DEFAULT_ROOM_AVATAR_FEMALE,
  DEFAULT_ROOM_AVATAR_MALE,
  ROOM_AVATAR_CATALOG
} from "../features/avatarV2/room/avatarRoom.mock"
import {
  getRoomAvatarRenderLayers,
  resolveRoomAvatarAppearance
} from "../features/avatarV2/room/avatarRoomSelectors"
import { RoomAvatarRenderer2D } from "../features/avatarV2/room/components/RoomAvatarRenderer2D"
import type { RoomAvatarAppearance } from "../features/avatarV2/room/avatarRoom.types"
import { LinearGradient } from "../ui/linearGradient"
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
        <LinearGradient
          colors={uiTheme.gradients.heroBackground as [string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
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
        <CandidateAvatarPreview
          snapshot={resolvedAvatarSnapshot}
          size={202}
          stage="discover"
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
        <TagChip label={isOnline ? "Online now" : "Taking it slow"} variant={isOnline ? "success" : "muted"} />
      </View>

      <View style={cardStyles.tagsRow}>
        {vibeTags.map((tag) => (
          <TagChip key={tag} label={tag} />
        ))}
      </View>

      {isPending ? (
        <LinearGradient
          colors={[uiTheme.colors.primarySoft, "#FFF0F6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={cardStyles.pendingBanner}
        >
          <View style={cardStyles.pendingDot} />
          <Text style={cardStyles.pendingText}>
            Waiting for {displayName.split(" ")[0]} to accept…
          </Text>
        </LinearGradient>
      ) : null}
    </View>
  )
}

export function CandidateAvatarPreview(props: {
  snapshot: CandidateAvatarSnapshot
  size?: number
  stage?: "discover" | "profile" | "match"
}) {
  const { snapshot, size = 160, stage = "profile" } = props
  const layers = useMemo(() => {
    const appearance = createPreviewCandidateAppearance(snapshot.previewSeed)
    return getRoomAvatarRenderLayers({
      appearance,
      catalog: ROOM_AVATAR_CATALOG
    })
  }, [snapshot.previewSeed])
  const platformWidth = size * (stage === "discover" ? 0.96 : 0.82)
  const avatarWidth = size * 0.54
  const avatarHeight = avatarWidth / (256 / 384)

  return (
    <View
      accessibilityLabel={`${snapshot.displayName} ${snapshot.label}`}
      style={[
        cardStyles.candidateAvatarStage,
        {
          width: size,
          height: size,
          borderRadius: size * 0.18
        }
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          cardStyles.candidateAvatarGlow,
          {
            width: size * 0.92,
            height: size * 0.68,
            borderRadius: size * 0.46
          }
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          cardStyles.candidateAvatarPlatform,
          {
            width: platformWidth,
            height: size * 0.2,
            borderRadius: size * 0.1
          }
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          cardStyles.candidateAvatarShadow,
          {
            width: size * 0.38,
            height: size * 0.08,
            borderRadius: size * 0.04
          }
        ]}
      />
      <View
        style={[
          cardStyles.candidateAvatarBody,
          {
            width: avatarWidth,
            height: avatarHeight
          }
        ]}
      >
        <RoomAvatarRenderer2D layers={layers} />
      </View>
    </View>
  )
}

function createPreviewCandidateAppearance(seed: string): RoomAvatarAppearance {
  const hash = hashCandidateSeed(seed)
  const useMalePreset = hash % 5 === 0
  if (useMalePreset) {
    return resolveRoomAvatarAppearance(DEFAULT_ROOM_AVATAR_MALE, ROOM_AVATAR_CATALOG)
  }

  const variant = hash % 3
  const appearancePatch: Partial<RoomAvatarAppearance> =
    variant === 0
      ? {
          bodyPreset: "female",
          hairBackId: "",
          hairFrontId: "room_avatar_hair_female_plum_crop_front_v2",
          hairId: "room_avatar_hair_female_plum_crop_front_v2",
          topId: "room_avatar_top_female_cream_knit_v2",
          bottomId: "room_avatar_bottom_female_denim_straight_v2",
          shoesId: "room_avatar_shoes_female_cream_sneakers_v2"
        }
      : variant === 1
        ? {
            bodyPreset: "female",
            hairBackId: "room_avatar_hair_female_cocoa_wave_back_v2",
            hairFrontId: "room_avatar_hair_female_cocoa_wave_front_v2",
            hairId: "room_avatar_hair_female_cocoa_wave_front_v2",
            topId: "room_avatar_top_female_cream_knit_v2",
            bottomId: "room_avatar_bottom_female_denim_straight_v2",
            shoesId: "room_avatar_shoes_female_cream_sneakers_v2"
          }
        : DEFAULT_ROOM_AVATAR_FEMALE

  return resolveRoomAvatarAppearance(appearancePatch, ROOM_AVATAR_CATALOG)
}

function hashCandidateSeed(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
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
        <LinearGradient
          colors={uiTheme.gradients.heroBackground as [string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
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
    ...uiTheme.shadow.deep,
  },
  heroBlock: {
    height: 290,
    borderRadius: uiTheme.radius.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  stageLabel: {
    position: "absolute",
    top: uiTheme.spacing.md,
    left: uiTheme.spacing.md,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.78)",
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stageLabelText: {
    ...uiTheme.font.micro,
    color: "#FFFFFF",
  },
  heroGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -60,
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FCE4F1",
    right: -50,
    top: 70,
  },
  candidateAvatarStage: {
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },
  candidateAvatarGlow: {
    position: "absolute",
    bottom: "13%",
    backgroundColor: "rgba(255, 79, 152, 0.16)"
  },
  candidateAvatarPlatform: {
    position: "absolute",
    bottom: "7%",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    transform: [{ rotate: "-3deg" }]
  },
  candidateAvatarShadow: {
    position: "absolute",
    bottom: "9%",
    backgroundColor: "rgba(64, 31, 66, 0.28)",
    transform: [{ rotate: "-3deg" }]
  },
  candidateAvatarBody: {
    marginBottom: "8%",
    zIndex: 2
  },
  distancePill: {
    position: "absolute",
    bottom: uiTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.glassStrong,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.soft,
  },
  avatarSourcePill: {
    position: "absolute",
    bottom: 56,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  avatarSourceText: {
    ...uiTheme.font.micro,
    color: "#FFFFFF",
    fontSize: 10,
  },
  distanceDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  distanceText: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textPrimary,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.sm,
  },
  identityStack: {
    flex: 1,
    gap: 3,
  },
  nameText: {
    ...uiTheme.font.title,
    fontSize: 32,
    color: uiTheme.colors.textPrimary,
  },
  headlineText: {
    ...uiTheme.font.label,
    color: uiTheme.colors.primaryDeep,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: "#FAD0E3",
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.primary,
  },
  pendingText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.primaryDeep,
    fontWeight: "700",
  },
  emptyTitle: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
    textAlign: "center",
  },
  emptyBody: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: uiTheme.spacing.md,
  },
})
