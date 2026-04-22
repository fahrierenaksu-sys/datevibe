/**
 * demoStore – centralized demo/dummy-data state manager.
 *
 * When demo mode is active, the LobbyScreen consumes profiles from here
 * instead of the real WebSocket lobby flow. Swiping right on a profile
 * that has `hasLikedMe: true` produces a match, which injects a thread
 * into the chatStore so the matched person appears in the Inbox.
 */

import { useCallback, useEffect, useState } from "react"
import {
  DUMMY_PROFILES,
  DEMO_CURRENT_USER,
  shouldTriggerMatch,
  type DummyProfile
} from "./dummyProfiles"
import {
  applyChatThreadCreated,
  applyChatMessageReceived
} from "../chat/chatStore"

// ─── In-memory state ─────────────────────────────────────────

let demoEnabled = true // flip to false to use real lobby flow
let deckIndex = 0
let likedUserIds: Set<string> = new Set()
let skippedUserIds: Set<string> = new Set()
let matchedUserIds: Set<string> = new Set()
let pendingMatchUserId: string | null = null // set when a match animation should play

type DemoListener = () => void
const demoListeners: Set<DemoListener> = new Set()

function notifyDemo(): void {
  for (const l of demoListeners) l()
}

// ─── Actions ─────────────────────────────────────────────────

export function isDemoMode(): boolean {
  return demoEnabled
}

export function setDemoMode(enabled: boolean): void {
  demoEnabled = enabled
  deckIndex = 0
  likedUserIds.clear()
  skippedUserIds.clear()
  matchedUserIds.clear()
  pendingMatchUserId = null
  notifyDemo()
}

/** Get the visible deck (profiles not yet liked/skipped) */
export function getDemoDeck(): DummyProfile[] {
  return DUMMY_PROFILES.filter(
    (p) => !likedUserIds.has(p.userId) && !skippedUserIds.has(p.userId)
  )
}

/** Get the current "featured" candidate at top of deck */
export function getDemoFeatured(): DummyProfile | null {
  const deck = getDemoDeck()
  return deck[0] ?? null
}

export interface DemoLikeCurrentUser {
  userId: string
  displayName: string
}

/** Like (swipe right) the current featured profile */
export function demoLike(
  userId: string,
  currentUser?: DemoLikeCurrentUser
): { matched: boolean; profile: DummyProfile | null } {
  const profile = DUMMY_PROFILES.find((p) => p.userId === userId)
  if (!profile) return { matched: false, profile: null }

  likedUserIds.add(userId)

  if (shouldTriggerMatch(userId)) {
    matchedUserIds.add(userId)
    pendingMatchUserId = userId

    // Prefer the real session user so the chat thread's "self" participant
    // matches sessionActor.profile.userId. Without this, ChatThreadScreen's
    // `participants.find(p => p.userId !== currentUserId)` lookup would return
    // the hardcoded demo self entry and render the user's own name as the partner.
    const selfUserId = currentUser?.userId ?? DEMO_CURRENT_USER.userId
    const selfDisplayName =
      currentUser?.displayName ?? DEMO_CURRENT_USER.displayName

    // Inject a chat thread for this match so it appears in Inbox
    const threadId = `demo-thread-${userId}`
    applyChatThreadCreated({
      threadId,
      miniRoomId: `demo-miniroom-${userId}`,
      participantUserIds: [selfUserId, userId],
      participants: [
        { userId: selfUserId, displayName: selfDisplayName },
        { userId, displayName: profile.displayName }
      ],
      createdAt: new Date().toISOString(),
      lastMessage: undefined
    })

    // Auto-send a greeting message from the matched person after a short delay
    setTimeout(() => {
      applyChatMessageReceived({
        messageId: `demo-msg-${userId}-1`,
        threadId,
        senderUserId: userId,
        body: `Merhaba! 😊 Ben ${profile.firstName}, tanıştığımıza memnun oldum!`,
        sentAt: new Date().toISOString()
      })
    }, 1500)

    // Follow up with an inbound room invite so the user can try the MiniRoom
    // directly from the chat thread without leaving the conversation.
    setTimeout(() => {
      applyChatMessageReceived({
        messageId: `demo-msg-${userId}-invite`,
        threadId,
        senderUserId: userId,
        body: "__room_invite__",
        sentAt: new Date().toISOString()
      })
    }, 2800)

    notifyDemo()
    return { matched: true, profile }
  }

  notifyDemo()
  return { matched: false, profile }
}

/** Skip (swipe left) the current featured profile */
export function demoSkip(userId: string): void {
  skippedUserIds.add(userId)
  notifyDemo()
}

/** Get and clear pending match (for modal display) */
export function consumePendingMatch(): DummyProfile | null {
  if (!pendingMatchUserId) return null
  const profile = DUMMY_PROFILES.find((p) => p.userId === pendingMatchUserId) ?? null
  pendingMatchUserId = null
  return profile
}

/** Check if a match is pending */
export function hasPendingMatch(): boolean {
  return pendingMatchUserId !== null
}

/** Get all matched profiles */
export function getMatchedProfiles(): DummyProfile[] {
  return DUMMY_PROFILES.filter((p) => matchedUserIds.has(p.userId))
}

/** Reset the demo deck back to beginning */
export function resetDemoDeck(): void {
  deckIndex = 0
  likedUserIds.clear()
  skippedUserIds.clear()
  matchedUserIds.clear()
  pendingMatchUserId = null
  notifyDemo()
}

// ─── Reactive hook ───────────────────────────────────────────

export interface DemoStoreView {
  isDemo: boolean
  deck: DummyProfile[]
  featured: DummyProfile | null
  matchedProfiles: DummyProfile[]
  deckRemaining: number
  like: (
    userId: string,
    currentUser?: DemoLikeCurrentUser
  ) => { matched: boolean; profile: DummyProfile | null }
  skip: (userId: string) => void
  consumeMatch: () => DummyProfile | null
  hasPendingMatch: boolean
  reset: () => void
}

export function useDemoStore(): DemoStoreView {
  const [, setTick] = useState(0)

  const sync = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    demoListeners.add(sync)
    return () => {
      demoListeners.delete(sync)
    }
  }, [sync])

  const deck = getDemoDeck()

  return {
    isDemo: demoEnabled,
    deck,
    featured: deck[0] ?? null,
    matchedProfiles: getMatchedProfiles(),
    deckRemaining: deck.length,
    like: demoLike,
    skip: demoSkip,
    consumeMatch: consumePendingMatch,
    hasPendingMatch: hasPendingMatch(),
    reset: resetDemoDeck
  }
}
