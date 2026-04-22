import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { IncomingInviteCallout } from "../components/IncomingInviteCallout"
import { DiscoverCard, EmptyDiscoverCard } from "../components/DiscoverCard"
import { ConnectionBanner } from "../ui/connectionBanner"
import { isUserBlocked } from "../features/safety/blockStore"
import {
  DiscoverFiltersBottomSheet,
  DEFAULT_DISCOVER_FILTERS,
  type DiscoverFilters
} from "../components/DiscoverFiltersBottomSheet"
import {
  skipDiscoveryCandidate,
  useSavedConnections
} from "../features/connections/savedConnectionsStore"
import { useLobbyFlow } from "../features/lobby/useLobbyFlow"
import {
  loadPendingInvitesForUser,
  recordPendingInviteForUser,
  replacePendingInvitesForUser,
  type PendingInviteMemory
} from "../features/lobby/pendingInvitesStore"
import type { SessionActor } from "../features/session/sessionApi"
import type {
  MiniRoomParticipantsRouteParam,
  RootStackParamList
} from "../navigation/RootNavigator"
import type {
  ProfileCue,
  ProfilePreviewData
} from "./ProfilePreviewScreen"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BrandMark } from "../ui/brandMark"
import { ConnectionPill } from "../ui/connectionPill"
import {
  ActionButtonCircle,
  TagChip,
  TopBar
} from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { useChatStore } from "../features/chat/chatStore"
import { BottomNav, type BottomNavKey } from "../ui/bottomNav"

interface LobbyScreenProps {
  sessionActor: SessionActor
  onResetSession: () => Promise<void>
}

interface DiscoverProfile {
  userId: string
  displayName: string
  spotId: string
  distance?: number
  canInvite: boolean
  blocked: boolean
}

const PENDING_INVITE_TTL_MS = 30_000

type DiscoverFeedbackTone = "soft" | "warm"

interface DiscoverFeedback {
  id: number
  text: string
  tone: DiscoverFeedbackTone
}


function distanceLabelOf(distance: number | undefined): string {
  if (!Number.isFinite(distance)) {
    return "Nearby"
  }
  const value = distance ?? 0
  if (value < 100) return "Very close"
  if (value < 500) return `${Math.round(value)}m away`
  return "In the area"
}

function firstNameOf(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] || "They"
}

function inviteReadinessLabel(candidate: DiscoverProfile): string {
  if (candidate.blocked) return "Unavailable"
  return candidate.canInvite ? "Open to a mini-room" : "Not available right now"
}

function buildProfileCues(
  candidate: DiscoverProfile,
  distanceLabel: string
): ProfileCue[] {
  return [
    {
      id: "live_overlap",
      label: "Live overlap",
      value: "Here now",
      detail: "You are seeing this person because they are currently in the lobby."
    },
    {
      id: "proximity",
      label: "Proximity",
      value: distanceLabel,
      detail: "Discovery is based on live nearby presence, not a static profile stack."
    },
    {
      id: "room_readiness",
      label: "Mini-room",
      value: inviteReadinessLabel(candidate),
      detail: candidate.canInvite && !candidate.blocked
        ? "If they accept, DateVibe opens one exclusive live encounter."
        : "They cannot start a live encounter from this state."
    }
  ]
}

export function LobbyScreen(props: LobbyScreenProps) {
  const { sessionActor, onResetSession } = props
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, "Lobby">>()
  const lastNavigatedMiniRoomIdRef = useRef<string | null>(null)

  const handleInvalidSession = useCallback(() => {
    void onResetSession()
  }, [onResetSession])

  const {
    connectionStatus,
    lobbyState,
    nearbyUsers,
    incomingInvite,
    readyMiniRoom,
    clearReadyMiniRoom,
    sendInvite,
    decideInvite,
    requestRefresh
  } = useLobbyFlow({
    sessionActor,
    onInvalidSession: handleInvalidSession
  })

  const myUserId = sessionActor.profile.userId
  const myDisplayName = sessionActor.profile.displayName
  const { saved: savedConnections, skipped: skippedConnections } = useSavedConnections()
  const { threads: chatThreads, totalUnreadCount } = useChatStore()
  const [seenThisSessionUserIds, setSeenThisSessionUserIds] = useState<Set<string>>(
    () => new Set()
  )

  // Outgoing invites are optimistic locally, then cleared by server decisions or TTL.
  const [pendingInvites, setPendingInvites] = useState<PendingInviteMemory[]>([])
  const [pendingInviteNow, setPendingInviteNow] = useState(() => Date.now())
  const [discoverFeedback, setDiscoverFeedback] =
    useState<DiscoverFeedback | null>(null)
  const cardEntryAnim = useRef(new Animated.Value(1)).current
  const feedbackAnim = useRef(new Animated.Value(0)).current
  const feedbackCounterRef = useRef(0)

  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    requestRefresh()
    setTimeout(() => setRefreshing(false), 1200)
  }, [requestRefresh])

  const skippedUserIds = useMemo(
    () => new Set(skippedConnections.map((entry) => entry.userId)),
    [skippedConnections]
  )

  const savedUserIds = useMemo(
    () => new Set(savedConnections.map((entry) => entry.userId)),
    [savedConnections]
  )

  const pendingInviteUserIds = useMemo(
    () => new Set(pendingInvites.map((invite) => invite.userId)),
    [pendingInvites]
  )

  const discoverDeck = useMemo<DiscoverProfile[]>(() => {
    return nearbyUsers
      .filter((user) => {
        if (user.blocked) return false
        if (isUserBlocked(user.userId)) return false
        if (skippedUserIds.has(user.userId)) return false
        if (savedUserIds.has(user.userId)) return false
        if (seenThisSessionUserIds.has(user.userId)) return false
        if (pendingInviteUserIds.has(user.userId)) return false
        return true
      })
      .map((nearby) => ({
        userId: nearby.userId,
        displayName: nearby.displayName,
        spotId: nearby.spotId,
        distance: nearby.distance,
        canInvite: nearby.canInvite,
        blocked: nearby.blocked
      }))
  }, [
    nearbyUsers,
    pendingInviteUserIds,
    savedUserIds,
    seenThisSessionUserIds,
    skippedUserIds
  ])

  const featuredCandidate = discoverDeck[0] ?? null
  const cardAnimationKey = featuredCandidate?.userId ?? "empty"

  useEffect(() => {
    cardEntryAnim.setValue(0)
    Animated.timing(cardEntryAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start()
  }, [cardAnimationKey, cardEntryAnim])

  const senderDisplayName = useMemo(() => {
    if (!incomingInvite) return null
    const sender =
      lobbyState.snapshot?.users.find(
        (user) => user.userId === incomingInvite.senderUserId
      ) ?? null
    return sender?.displayName ?? incomingInvite.senderUserId
  }, [incomingInvite, lobbyState.snapshot?.users])

  useEffect(() => {
    let active = true
    void (async () => {
      const restored = await loadPendingInvitesForUser({
        actorUserId: myUserId,
        now: Date.now(),
        ttlMs: PENDING_INVITE_TTL_MS
      })
      if (!active) return
      setPendingInvites((current) => {
        const restoredUserIds = new Set(restored.map((invite) => invite.userId))
        return [
          ...restored,
          ...current.filter((invite) => !restoredUserIds.has(invite.userId))
        ]
      })
      setPendingInviteNow(Date.now())
    })()
    return () => {
      active = false
    }
  }, [myUserId])

  const persistPendingInvites = useCallback(
    (invites: PendingInviteMemory[]): void => {
      void replacePendingInvitesForUser({
        actorUserId: myUserId,
        invites,
        now: Date.now(),
        ttlMs: PENDING_INVITE_TTL_MS
      })
    },
    [myUserId]
  )

  const addPendingInvite = useCallback((invite: PendingInviteMemory): void => {
    setPendingInvites((current) => {
      const withoutDuplicate = current.filter(
        (entry) => entry.userId !== invite.userId
      )
      const next = [...withoutDuplicate, invite]
      void recordPendingInviteForUser({
        actorUserId: myUserId,
        invite,
        now: Date.now(),
        ttlMs: PENDING_INVITE_TTL_MS
      })
      return next
    })
  }, [myUserId])

  // Auto-expire pending invites after TTL.
  useEffect(() => {
    if (pendingInvites.length === 0) return
    setPendingInvites((current) => {
      const next = current.filter(
        (invite) => pendingInviteNow - invite.sentAt < PENDING_INVITE_TTL_MS
      )
      if (next.length !== current.length) {
        persistPendingInvites(next)
      }
      return next
    })
  }, [pendingInviteNow, pendingInvites.length, persistPendingInvites])

  useEffect(() => {
    if (pendingInvites.length === 0) return
    setPendingInviteNow(Date.now())
    const timer = setInterval(() => {
      setPendingInviteNow(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [pendingInvites.length])

  // Clear pending invites if their targets leave the nearby pool.
  useEffect(() => {
    if (pendingInvites.length === 0) return
    if (!lobbyState.isJoined) return
    const nearbyUserIds = new Set(nearbyUsers.map((user) => user.userId))
    setPendingInvites((current) => {
      const next = current.filter((invite) => nearbyUserIds.has(invite.userId))
      if (next.length !== current.length) {
        persistPendingInvites(next)
      }
      return next
    })
  }, [
    lobbyState.isJoined,
    nearbyUsers,
    pendingInvites.length,
    persistPendingInvites
  ])

  useEffect(() => {
    const decision = lobbyState.interaction.latestInviteDecision
    if (!decision) return
    const otherUserId =
      decision.senderUserId === myUserId
        ? decision.recipientUserId
        : decision.senderUserId
    setPendingInvites((current) => {
      const next = current.filter((invite) => invite.userId !== otherUserId)
      if (next.length !== current.length) {
        persistPendingInvites(next)
      }
      return next
    })
  }, [
    lobbyState.interaction.latestInviteDecision,
    myUserId,
    persistPendingInvites
  ])

  useEffect(() => {
    setSeenThisSessionUserIds((current) => {
      const nearbyUserIds = new Set(nearbyUsers.map((user) => user.userId))
      const next = new Set(
        [...current].filter((userId) => nearbyUserIds.has(userId))
      )
      return next.size === current.size ? current : next
    })
  }, [nearbyUsers])

  // Resolve participant display names then navigate to MiniRoom.
  useEffect(() => {
    if (!readyMiniRoom) return

    const nextMiniRoomId = readyMiniRoom.miniRoom.miniRoomId
    if (lastNavigatedMiniRoomIdRef.current === nextMiniRoomId) {
      return
    }
    lastNavigatedMiniRoomIdRef.current = nextMiniRoomId

    const ids = readyMiniRoom.miniRoom.participantUserIds
    const partnerUserId = ids.find((id) => id !== myUserId) ?? ids[0] ?? ""
    setPendingInvites((current) => {
      const next = current.filter((invite) => invite.userId !== partnerUserId)
      if (next.length !== current.length) {
        persistPendingInvites(next)
      }
      return next
    })
    const presence = lobbyState.snapshot?.users ?? []
    const partnerPresence = presence.find((u) => u.userId === partnerUserId)
    const partnerNearby = nearbyUsers.find((u) => u.userId === partnerUserId)
    const partnerDisplayName =
      partnerPresence?.displayName ?? partnerNearby?.displayName ?? "Someone"

    const participants: MiniRoomParticipantsRouteParam = {
      you: { userId: myUserId, displayName: myDisplayName },
      partner: { userId: partnerUserId, displayName: partnerDisplayName }
    }

    navigation.navigate("MiniRoom", { readyMiniRoom, participants })
  }, [
    lobbyState.snapshot?.users,
    myDisplayName,
    myUserId,
    navigation,
    nearbyUsers,
    persistPendingInvites,
    readyMiniRoom
  ])

  useFocusEffect(
    useCallback(() => {
      const readyMiniRoomId = readyMiniRoom?.miniRoom.miniRoomId
      if (
        readyMiniRoomId &&
        lastNavigatedMiniRoomIdRef.current === readyMiniRoomId
      ) {
        clearReadyMiniRoom()
      }
    }, [clearReadyMiniRoom, readyMiniRoom])
  )

  useEffect(() => {
    if (!lobbyState.isJoined && lobbyState.snapshot === null) {
      lastNavigatedMiniRoomIdRef.current = null
    }
  }, [lobbyState.isJoined, lobbyState.snapshot])

  const triggerHaptic = useCallback((tone: DiscoverFeedbackTone): void => {
    Vibration.vibrate(tone === "warm" ? 18 : 10)
  }, [])

  const showDiscoverFeedback = useCallback(
    (text: string, tone: DiscoverFeedbackTone): void => {
      feedbackCounterRef.current += 1
      const nextId = feedbackCounterRef.current
      setDiscoverFeedback({ id: nextId, text, tone })
      feedbackAnim.stopAnimation()
      feedbackAnim.setValue(0)
      Animated.sequence([
        Animated.timing(feedbackAnim, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }),
        Animated.delay(1050),
        Animated.timing(feedbackAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true
        })
      ]).start(() => {
        setDiscoverFeedback((current) =>
          current?.id === nextId ? null : current
        )
      })
    },
    [feedbackAnim]
  )

  const handlePrimaryLike = useCallback(() => {
    if (!featuredCandidate) return
    if (featuredCandidate.blocked || !featuredCandidate.canInvite) return
    triggerHaptic("warm")
    showDiscoverFeedback("Invite sent. We'll open a room if they accept.", "warm")
    sendInvite(featuredCandidate.userId)
    addPendingInvite({
      userId: featuredCandidate.userId,
      displayName: featuredCandidate.displayName,
      sentAt: Date.now()
    })
    setSeenThisSessionUserIds((current) => {
      const next = new Set(current)
      next.add(featuredCandidate.userId)
      return next
    })
  }, [
    addPendingInvite,
    featuredCandidate,
    sendInvite,
    showDiscoverFeedback,
    triggerHaptic
  ])

  const handleSkipFeatured = useCallback(() => {
    if (!featuredCandidate) return
    triggerHaptic("soft")
    showDiscoverFeedback("Passed for now.", "soft")
    setSeenThisSessionUserIds((current) => {
      const next = new Set(current)
      next.add(featuredCandidate.userId)
      return next
    })
    void skipDiscoveryCandidate({ userId: featuredCandidate.userId })
  }, [featuredCandidate, showDiscoverFeedback, triggerHaptic])

  // Handle Like fired from ProfilePreview via navigation param bounce.
  useEffect(() => {
    const target = route.params?.pendingLikeUserId
    if (!target) return
    const targetUser = nearbyUsers.find((user) => user.userId === target)
    sendInvite(target)
    addPendingInvite({
      userId: target,
      displayName: targetUser?.displayName ?? "Someone",
      sentAt: Date.now()
    })
    setSeenThisSessionUserIds((current) => {
      const next = new Set(current)
      next.add(target)
      return next
    })
    navigation.setParams({ pendingLikeUserId: undefined })
  }, [
    addPendingInvite,
    navigation,
    nearbyUsers,
    route.params?.pendingLikeUserId,
    sendInvite
  ])

  const isPendingForFeatured =
    !!featuredCandidate &&
    pendingInviteUserIds.has(featuredCandidate.userId)

  const likeDisabled =
    !featuredCandidate ||
    !lobbyState.isJoined ||
    connectionStatus !== "connected" ||
    !featuredCandidate.canInvite ||
    featuredCandidate.blocked ||
    isPendingForFeatured

  const distanceLabel = distanceLabelOf(featuredCandidate?.distance)

  const vibeTags = useMemo(() => {
    if (!featuredCandidate) return []
    const tags: string[] = []
    if (featuredCandidate.canInvite && !featuredCandidate.blocked) {
      tags.push("Open to invite")
    } else if (featuredCandidate.blocked) {
      tags.push("Unavailable")
    } else {
      tags.push("Browsing")
    }
    tags.push(distanceLabel)
    tags.push("Live now")
    return tags
  }, [distanceLabel, featuredCandidate])

  const profileHeadline = useMemo(() => {
    if (!featuredCandidate) return ""
    return featuredCandidate.canInvite && !featuredCandidate.blocked
      ? "Available for one live encounter"
      : inviteReadinessLabel(featuredCandidate)
  }, [featuredCandidate])

  const profileCues = useMemo(
    () =>
      featuredCandidate
        ? buildProfileCues(featuredCandidate, distanceLabel)
        : [],
    [distanceLabel, featuredCandidate]
  )

  const profilePreviewData = useMemo<ProfilePreviewData | null>(() => {
    if (!featuredCandidate) return null
    return {
      userId: featuredCandidate.userId,
      displayName: featuredCandidate.displayName,
      headline: profileHeadline,
      vibeLine: distanceLabel,
      tags: vibeTags,
      bio: "",
      cues: profileCues,
      prompts: [],
      canInvite: featuredCandidate.canInvite,
      blocked: featuredCandidate.blocked,
      isSelf: false,
      spotId: featuredCandidate.spotId,
      distanceLabel
    }
  }, [
    distanceLabel,
    featuredCandidate,
    profileCues,
    profileHeadline,
    vibeTags
  ])

  const nearbyCount = useMemo(
    () => nearbyUsers.filter((u) => !u.blocked).length,
    [nearbyUsers]
  )
  const savedCount = savedConnections.length
  const discoverableCount = discoverDeck.length
  const pendingInviteCount = pendingInvites.length
  const pendingInviteRemainingSeconds =
    pendingInviteCount > 0
      ? Math.max(
          0,
          Math.ceil(
            Math.min(
              ...pendingInvites.map(
                (invite) => PENDING_INVITE_TTL_MS - (pendingInviteNow - invite.sentAt)
              )
            ) / 1000
          )
        )
      : 0
  const pendingInviteNames = pendingInvites
    .slice(0, 2)
    .map((invite) => invite.displayName.split(" ")[0])
    .join(", ")
  const progressLabel =
    discoverableCount > 0
      ? `${discoverableCount} ${discoverableCount === 1 ? "person" : "people"} left nearby`
      : nearbyCount > 0
        ? "You've seen everyone nearby for now"
        : null

  const handleBottomNavPress = useCallback(
    (key: BottomNavKey): void => {
      if (key === "saved") {
        navigation.navigate("SavedConnections")
      } else if (key === "chats") {
        navigation.navigate("Inbox")
      } else if (key === "profile") {
        navigation.navigate("You")
      }
    },
    [navigation]
  )

  // ── Discover Filters ──────────────────────────────────────
  const [filtersVisible, setFiltersVisible] = useState(false)
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_DISCOVER_FILTERS)

  // Load persisted filters on mount
  useEffect(() => {
    AsyncStorage.getItem("@datevibe/discover_filters").then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as DiscoverFilters
          setFilters(parsed)
        } catch { /* ignore parse errors */ }
      }
    }).catch(() => { /* ignore */ })
  }, [])

  const handleOpenFilters = useCallback(() => {
    setFiltersVisible(true)
  }, [])

  const handleCloseFilters = useCallback(() => {
    setFiltersVisible(false)
  }, [])

  const handleApplyFilters = useCallback((next: DiscoverFilters) => {
    setFilters(next)
    setFiltersVisible(false)
    void AsyncStorage.setItem("@datevibe/discover_filters", JSON.stringify(next))
  }, [])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.intent !== DEFAULT_DISCOVER_FILTERS.intent) count += 1
    if (filters.ageMin !== DEFAULT_DISCOVER_FILTERS.ageMin || filters.ageMax !== DEFAULT_DISCOVER_FILTERS.ageMax) count += 1
    if (filters.scope !== DEFAULT_DISCOVER_FILTERS.scope) count += 1
    if (JSON.stringify(filters.vibes) !== JSON.stringify(DEFAULT_DISCOVER_FILTERS.vibes)) count += 1
    return count
  }, [filters])

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <ConnectionBanner status={connectionStatus} />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={uiTheme.colors.primary}
              colors={[uiTheme.colors.primary]}
            />
          }
        >
          <TopBar
            title="Vibe Match"
            subtitle="Live nearby"
            titleAlign="start"
            leftSlot={<BrandMark size={40} />}
            rightSlot={
              <View style={styles.topActions}>
                <Pressable
                  style={styles.filterButton}
                  onPress={handleOpenFilters}
                  hitSlop={6}
                >
                  <Text style={styles.filterButtonText}>⚙</Text>
                  {activeFilterCount > 0 ? (
                    <View style={styles.filterBadge}>
                      <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                    </View>
                  ) : null}
                </Pressable>
                <ConnectionPill status={connectionStatus} />
              </View>
            }
          />

          {incomingInvite && senderDisplayName ? (
            <IncomingInviteCallout
              senderDisplayName={senderDisplayName}
              senderUserId={incomingInvite.senderUserId}
              onAccept={() => decideInvite("accepted")}
              onDecline={() => decideInvite("declined")}
            />
          ) : null}

          <Animated.View
            style={[
              styles.cardTransition,
              {
                opacity: cardEntryAnim,
                transform: [
                  {
                    translateY: cardEntryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0]
                    })
                  },
                  {
                    scale: cardEntryAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.985, 1]
                    })
                  }
                ]
              }
            ]}
          >
            {featuredCandidate && profilePreviewData ? (
              <DiscoverCard
                displayName={featuredCandidate.displayName}
                userId={featuredCandidate.userId}
                headline={profileHeadline}
                distanceLabel={distanceLabel}
                vibeTags={vibeTags}
                isPending={isPendingForFeatured}
                isOnline={featuredCandidate.canInvite}
              />
            ) : (
              <EmptyDiscoverCard
                connectionStatus={connectionStatus}
                myDisplayName={myDisplayName}
                myUserId={myUserId}
                hasSeenEveryone={nearbyCount > 0}
              />
            )}
          </Animated.View>

          {featuredCandidate && profilePreviewData ? (
            <View style={styles.actionRow}>
              <ActionButtonCircle
                onPress={handleSkipFeatured}
                size={60}
              >
                ✕
              </ActionButtonCircle>
              <ActionButtonCircle
                onPress={() => {
                  navigation.navigate("ProfilePreview", { profile: profilePreviewData })
                }}
                size={60}
              >
                i
              </ActionButtonCircle>
              <ActionButtonCircle
                onPress={handlePrimaryLike}
                size={76}
                variant="primary"
                disabled={likeDisabled}
              >
                ♥
              </ActionButtonCircle>
            </View>
          ) : null}

          {discoverFeedback ? (
            <Animated.View
              style={[
                styles.feedbackPill,
                discoverFeedback.tone === "warm"
                  ? styles.feedbackPillWarm
                  : styles.feedbackPillSoft,
                {
                  opacity: feedbackAnim,
                  transform: [
                    {
                      translateY: feedbackAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0]
                      })
                    }
                  ]
                }
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  discoverFeedback.tone === "warm"
                    ? styles.feedbackTextWarm
                    : null
                ]}
              >
                {discoverFeedback.text}
              </Text>
            </Animated.View>
          ) : null}

          {pendingInviteCount > 0 ? (
            <View style={styles.pendingInviteStrip}>
              <View style={styles.pendingInviteIcon}>
                <Text style={styles.pendingInviteIconText}>♥</Text>
              </View>
              <View style={styles.pendingInviteCopy}>
                <Text style={styles.pendingInviteTitle}>
                  {pendingInviteCount === 1
                    ? `${pendingInviteNames} may still be open`
                    : `${pendingInviteCount} recent invites may still be open`}
                </Text>
                <Text style={styles.pendingInviteBody}>
                  Keep discovering. If someone accepts while you&apos;re free, we&apos;ll open one mini room.
                </Text>
              </View>
              <Text style={styles.pendingInviteTime}>
                {pendingInviteRemainingSeconds}s
              </Text>
            </View>
          ) : null}

          {progressLabel ? (
            <View style={styles.nearbyHintRow}>
              <View style={styles.nearbyDot} />
              <Text style={styles.nearbyHint}>
                {progressLabel}
              </Text>
            </View>
          ) : null}

        </ScrollView>

        <BottomNav
          currentKey="discover"
          savedCount={savedCount}
          chatCount={totalUnreadCount || chatThreads.length}
          onPress={handleBottomNavPress}
        />
      </SafeAreaView>

      <DiscoverFiltersBottomSheet
        visible={filtersVisible}
        initialFilters={filters}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
  safe: {
    flex: 1
  },
  scroll: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xl,
    gap: uiTheme.spacing.lg
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.secondary,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    position: "relative"
  },
  filterButtonText: {
    fontSize: 16,
    color: uiTheme.colors.secondaryText,
    fontWeight: "700"
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: uiTheme.colors.surface
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800"
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: uiTheme.spacing.lg,
    marginTop: uiTheme.spacing.xs
  },
  cardTransition: {
    width: "100%"
  },
  feedbackPill: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    marginTop: -uiTheme.spacing.xs
  },
  feedbackPillSoft: {
    backgroundColor: uiTheme.colors.surfaceMuted,
    borderColor: uiTheme.colors.border
  },
  feedbackPillWarm: {
    backgroundColor: uiTheme.colors.primarySoft,
    borderColor: "#FAD0E3"
  },
  feedbackText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  feedbackTextWarm: {
    color: uiTheme.colors.primaryDeep
  },
  pendingInviteStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  pendingInviteIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.primarySoft
  },
  pendingInviteIconText: {
    color: uiTheme.colors.primary,
    fontSize: 15,
    fontWeight: "900"
  },
  pendingInviteCopy: {
    flex: 1,
    gap: 2
  },
  pendingInviteTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  pendingInviteBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    lineHeight: 17,
    fontWeight: "600"
  },
  pendingInviteTime: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "right"
  },
  nearbyHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: -uiTheme.spacing.xs
  },
  nearbyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.success
  },
  nearbyHint: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.3
  }
})
