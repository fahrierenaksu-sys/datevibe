import AsyncStorage from "@react-native-async-storage/async-storage"
import { useCallback, useEffect, useState } from "react"

const SAVED_KEY = "@datevibe/savedConnections/v1"
const SKIPPED_KEY = "@datevibe/skippedConnections/v1"

export type SavedConnectionStatus =
  | "local-only"
  | "pending"
  | "mutual"
  | "unmatched"

export interface SavedConnection {
  userId: string
  displayName: string
  savedAt: string
  connected?: boolean
  durationSeconds?: number
  status?: SavedConnectionStatus
}

export interface SkippedConnection {
  userId: string
  skippedAt: string
}

type Listener = () => void

let savedCache: SavedConnection[] | null = null
let skippedCache: SkippedConnection[] | null = null
let hydratePromise: Promise<void> | null = null
const listeners: Set<Listener> = new Set()

function notify(): void {
  listeners.forEach((listener) => {
    listener()
  })
}

async function hydrate(): Promise<void> {
  if (savedCache !== null && skippedCache !== null) return
  if (hydratePromise) {
    await hydratePromise
    return
  }
  hydratePromise = (async () => {
    try {
      const [rawSaved, rawSkipped] = await Promise.all([
        AsyncStorage.getItem(SAVED_KEY),
        AsyncStorage.getItem(SKIPPED_KEY)
      ])
      savedCache = rawSaved ? (JSON.parse(rawSaved) as SavedConnection[]) : []
      skippedCache = rawSkipped
        ? (JSON.parse(rawSkipped) as SkippedConnection[])
        : []
    } catch {
      savedCache = savedCache ?? []
      skippedCache = skippedCache ?? []
    }
  })()
  await hydratePromise
  hydratePromise = null
}

async function persistSaved(): Promise<void> {
  if (!savedCache) return
  try {
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(savedCache))
  } catch {
    // best-effort persistence
  }
}

async function persistSkipped(): Promise<void> {
  if (!skippedCache) return
  try {
    await AsyncStorage.setItem(SKIPPED_KEY, JSON.stringify(skippedCache))
  } catch {
    // best-effort persistence
  }
}

export async function getSavedConnections(): Promise<SavedConnection[]> {
  await hydrate()
  return savedCache ? [...savedCache] : []
}

export async function getSkippedConnections(): Promise<SkippedConnection[]> {
  await hydrate()
  return skippedCache ? [...skippedCache] : []
}

export async function saveConnection(input: {
  userId: string
  displayName: string
  connected?: boolean
  durationSeconds?: number
  status?: SavedConnectionStatus
}): Promise<void> {
  await hydrate()
  if (!savedCache) savedCache = []
  const filtered = savedCache.filter((entry) => entry.userId !== input.userId)
  filtered.unshift({
    userId: input.userId,
    displayName: input.displayName,
    savedAt: new Date().toISOString(),
    connected: input.connected,
    durationSeconds: input.durationSeconds,
    status: input.status ?? "local-only"
  })
  savedCache = filtered
  await persistSaved()
  notify()
}

export async function updateSavedConnectionStatus(input: {
  userId: string
  status: SavedConnectionStatus
}): Promise<void> {
  await hydrate()
  if (!savedCache) return
  const next = savedCache.map((entry) =>
    entry.userId === input.userId
      ? { ...entry, status: input.status }
      : entry
  )
  savedCache = next
  await persistSaved()
  notify()
}

export async function recordMutualConnection(input: {
  currentUserId: string
  participantUserIds: readonly [string, string]
}): Promise<SavedConnection | undefined> {
  await hydrate()
  if (!savedCache) savedCache = []

  const partnerUserId = input.participantUserIds.find(
    (userId) => userId !== input.currentUserId
  )
  if (!partnerUserId) return undefined

  const existing = savedCache.find((entry) => entry.userId === partnerUserId)
  const updated: SavedConnection = existing
    ? { ...existing, status: "mutual" }
    : {
        userId: partnerUserId,
        displayName: partnerUserId,
        savedAt: new Date().toISOString(),
        status: "mutual"
      }

  savedCache = [
    updated,
    ...savedCache.filter((entry) => entry.userId !== partnerUserId)
  ]
  await persistSaved()
  notify()
  return updated
}

export async function removeSavedConnection(input: {
  userId: string
}): Promise<void> {
  await hydrate()
  if (!savedCache) return
  const next = savedCache.filter((entry) => entry.userId !== input.userId)
  if (next.length === savedCache.length) return
  savedCache = next
  await persistSaved()
  notify()
}

export async function passConnection(input: { userId: string }): Promise<void> {
  await hydrate()
  if (!skippedCache) skippedCache = []
  const filtered = skippedCache.filter((entry) => entry.userId !== input.userId)
  filtered.unshift({
    userId: input.userId,
    skippedAt: new Date().toISOString()
  })
  skippedCache = filtered
  if (savedCache) {
    savedCache = savedCache.map((entry) =>
      entry.userId === input.userId
        ? { ...entry, status: "unmatched" }
        : entry
    )
    await persistSaved()
  }
  await persistSkipped()
  notify()
}

export async function skipDiscoveryCandidate(input: {
  userId: string
}): Promise<void> {
  await hydrate()
  if (!skippedCache) skippedCache = []
  const filtered = skippedCache.filter((entry) => entry.userId !== input.userId)
  filtered.unshift({
    userId: input.userId,
    skippedAt: new Date().toISOString()
  })
  skippedCache = filtered
  await persistSkipped()
  notify()
}

export interface SavedConnectionsView {
  saved: SavedConnection[]
  skipped: SkippedConnection[]
  isHydrating: boolean
  refresh: () => Promise<void>
}

export function useSavedConnections(): SavedConnectionsView {
  const [saved, setSaved] = useState<SavedConnection[]>(() => savedCache ?? [])
  const [skipped, setSkipped] = useState<SkippedConnection[]>(
    () => skippedCache ?? []
  )
  const [isHydrating, setIsHydrating] = useState<boolean>(savedCache === null)

  const sync = useCallback((): void => {
    setSaved(savedCache ? [...savedCache] : [])
    setSkipped(skippedCache ? [...skippedCache] : [])
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    await hydrate()
    sync()
  }, [sync])

  useEffect(() => {
    let active = true
    const listener: Listener = () => {
      if (!active) return
      sync()
    }
    listeners.add(listener)
    void (async () => {
      await hydrate()
      if (!active) return
      sync()
      setIsHydrating(false)
    })()
    return () => {
      active = false
      listeners.delete(listener)
    }
  }, [sync])

  return { saved, skipped, isHydrating, refresh }
}
