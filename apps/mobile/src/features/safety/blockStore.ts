/**
 * Block & Report store — manages local block list and report submissions.
 *
 * Blocked users are persisted to AsyncStorage so they survive restarts.
 * Reports are queued locally (future: POST to server).
 */

import { useCallback, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const STORAGE_KEY = "@datevibe/blocked_users"

// ── In-memory state ─────────────────────────────────────────
let blockedUserIds: Set<string> = new Set()
let hydrated = false

type Listener = () => void
const listeners: Set<Listener> = new Set()

function notify(): void {
  for (const l of listeners) l()
}

function persistBlocked(): void {
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...blockedUserIds]))
}

// ── Mutations ───────────────────────────────────────────────

export function blockUser(userId: string): void {
  blockedUserIds.add(userId)
  persistBlocked()
  notify()
}

export function unblockUser(userId: string): void {
  blockedUserIds.delete(userId)
  persistBlocked()
  notify()
}

export function isUserBlocked(userId: string): boolean {
  return blockedUserIds.has(userId)
}

export function getBlockedUserIds(): string[] {
  return [...blockedUserIds]
}

// ── Reports ─────────────────────────────────────────────────

export type ReportReason =
  | "inappropriate"
  | "harassment"
  | "spam"
  | "underage"
  | "other"

export interface UserReport {
  targetUserId: string
  reason: ReportReason
  details?: string
  createdAt: string
}

const reportQueue: UserReport[] = []

export function submitReport(report: Omit<UserReport, "createdAt">): void {
  reportQueue.push({
    ...report,
    createdAt: new Date().toISOString()
  })
  // Future: POST to server API
  // For now, stored in memory + auto-block
  blockUser(report.targetUserId)
}

export function getPendingReports(): UserReport[] {
  return [...reportQueue]
}

// ── Hydration ───────────────────────────────────────────────

async function hydrate(): Promise<void> {
  if (hydrated) return
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as string[]
      blockedUserIds = new Set(parsed)
    }
  } catch { /* ignore */ }
  hydrated = true
  notify()
}

// Start hydration immediately
void hydrate()

// ── Reactive hook ───────────────────────────────────────────

export interface BlockStoreView {
  blockedUserIds: string[]
  isBlocked: (userId: string) => boolean
  blockUser: typeof blockUser
  unblockUser: typeof unblockUser
}

export function useBlockStore(): BlockStoreView {
  const [, setTick] = useState(0)

  const sync = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    listeners.add(sync)
    return () => { listeners.delete(sync) }
  }, [sync])

  return {
    blockedUserIds: getBlockedUserIds(),
    isBlocked: isUserBlocked,
    blockUser,
    unblockUser
  }
}
