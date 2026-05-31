/**
 * chatStore – single state owner for all mobile chat data.
 *
 * Rules:
 * - Primary data comes from the server (thread_listed, message_listed,
 *   message_received, thread_created).
 * - Optimistic messages are inserted locally on send for instant UX,
 *   then replaced by the server-confirmed version on receipt.
 * - No fake unread counts or delivery/read status.
 * - Exposes a reactive hook for components.
 */

import type {
  ChatMessage,
  ChatMessageList,
  ChatThread,
  ChatThreadList
} from "@datevibe/contracts"
import { useCallback, useEffect, useState } from "react"

// ─── In-memory store ────────────────────────────────────────
let threadCache: ChatThread[] = []
let messageCache: Map<string, ChatMessage[]> = new Map()
let threadsFetched = false

// Track optimistic message local IDs so we can replace them on server confirmation
const pendingLocalIds: Set<string> = new Set()
let localIdCounter = 0

// Unread message tracking per thread
let unreadCounts: Map<string, number> = new Map()
let activeThreadId: string | null = null // which thread is currently being viewed

type Listener = () => void
const listeners: Set<Listener> = new Set()

function notify(): void {
  for (const l of listeners) l()
}

// ─── Server-event reducers (called from RootNavigator) ──────
export function applyChatThreadListed(payload: ChatThreadList): void {
  threadCache = [...payload.threads].sort(
    (a, b) => (b.lastMessage?.sentAt ? Date.parse(b.lastMessage.sentAt) : 0) - 
              (a.lastMessage?.sentAt ? Date.parse(a.lastMessage.sentAt) : 0)
  )
  threadsFetched = true
  notify()
}

export function applyChatThreadCreated(thread: ChatThread): void {
  // Dedupe by threadId, put newest first.
  const filtered = threadCache.filter((t) => t.threadId !== thread.threadId)
  threadCache = [thread, ...filtered].sort(
    (a, b) => (b.lastMessage?.sentAt ? Date.parse(b.lastMessage.sentAt) : 0) - 
              (a.lastMessage?.sentAt ? Date.parse(a.lastMessage.sentAt) : 0)
  )
  notify()
}

export function applyChatMessageListed(payload: ChatMessageList): void {
  const sorted = [...payload.messages].sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))
  messageCache.set(payload.threadId, sorted)
  notify()
}

export function applyChatMessageReceived(message: ChatMessage): void {
  const existing = messageCache.get(message.threadId) ?? []

  // If we already have this exact message, skip
  if (existing.some((m) => m.messageId === message.messageId)) return

  // Remove any optimistic messages from the same sender that are pending
  // (the server version replaces the local echo)
  const cleaned = existing.filter((m) => {
    if (pendingLocalIds.has(m.messageId) && m.senderUserId === message.senderUserId) {
      // Only replace the oldest pending message — 1:1 replacement
      pendingLocalIds.delete(m.messageId)
      return false
    }
    return true
  })

  const sorted = [...cleaned, message].sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt))
  messageCache.set(message.threadId, sorted)

  // Update lastMessage on thread
  threadCache = threadCache.map((thread) =>
    thread.threadId === message.threadId
      ? { ...thread, lastMessage: message }
      : thread
  ).sort(
    (a, b) => (b.lastMessage?.sentAt ? Date.parse(b.lastMessage.sentAt) : 0) - 
              (a.lastMessage?.sentAt ? Date.parse(a.lastMessage.sentAt) : 0)
  )

  // Increment unread count if this thread isn't currently active
  // and the message isn't from local optimistic echo
  if (message.threadId !== activeThreadId && !message.messageId.startsWith("__local_")) {
    const current = unreadCounts.get(message.threadId) ?? 0
    unreadCounts.set(message.threadId, current + 1)
  }

  notify()
}

/**
 * Insert an optimistic (local-only) message for instant UX.
 * When the server confirms via applyChatMessageReceived, the local echo is replaced.
 */
export function addOptimisticMessage(opts: {
  threadId: string
  senderUserId: string
  body: string
}): void {
  const localId = `__local_${++localIdCounter}_${Date.now()}`
  pendingLocalIds.add(localId)

  const optimistic: ChatMessage = {
    messageId: localId,
    threadId: opts.threadId,
    senderUserId: opts.senderUserId,
    body: opts.body,
    sentAt: new Date().toISOString()
  }

  const existing = messageCache.get(opts.threadId) ?? []
  messageCache.set(opts.threadId, [...existing, optimistic])
  notify()
}

export function resetChatStore(): void {
  threadCache = []
  messageCache = new Map()
  threadsFetched = false
  pendingLocalIds.clear()
  unreadCounts = new Map()
  activeThreadId = null
  notify()
}

/** Mark a thread as currently being viewed — suppresses unread increments. */
export function setActiveThread(threadId: string | null): void {
  activeThreadId = threadId
  if (threadId) {
    unreadCounts.set(threadId, 0)
    notify()
  }
}

/** Clear unread count for a specific thread. */
export function markThreadRead(threadId: string): void {
  if (unreadCounts.get(threadId)) {
    unreadCounts.set(threadId, 0)
    notify()
  }
}

/** Get total unread across all threads. */
export function getTotalUnreadCount(): number {
  let total = 0
  for (const count of unreadCounts.values()) {
    total += count
  }
  return total
}

/** Get unread count for a specific thread. */
export function getThreadUnreadCount(threadId: string): number {
  return unreadCounts.get(threadId) ?? 0
}

// ─── Read helpers ───────────────────────────────────────────
export function getThreads(): ChatThread[] {
  return threadCache
}

export function getMessages(threadId: string): ChatMessage[] {
  return messageCache.get(threadId) ?? []
}

export function hasThreadsFetched(): boolean {
  return threadsFetched
}

/** Find a thread for a given partner userId, if the server created one. */
export function findThreadForPartner(
  partnerUserId: string
): ChatThread | undefined {
  return threadCache.find((t) =>
    t.participantUserIds.includes(partnerUserId)
  )
}

// ─── Reactive hook ──────────────────────────────────────────
export interface ChatStoreView {
  threads: ChatThread[]
  threadsFetched: boolean
  getMessages: (threadId: string) => ChatMessage[]
  findThreadForPartner: (partnerUserId: string) => ChatThread | undefined
  addOptimisticMessage: typeof addOptimisticMessage
  totalUnreadCount: number
  getThreadUnreadCount: typeof getThreadUnreadCount
  setActiveThread: typeof setActiveThread
  markThreadRead: typeof markThreadRead
}

export function useChatStore(): ChatStoreView {
  const [, setTick] = useState(0)

  const sync = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [sync])

  return {
    threads: threadCache,
    threadsFetched,
    getMessages,
    findThreadForPartner,
    addOptimisticMessage,
    totalUnreadCount: getTotalUnreadCount(),
    getThreadUnreadCount,
    setActiveThread,
    markThreadRead
  }
}
