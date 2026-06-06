import { useCallback, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AVATAR_V2_CATALOG } from "../avatarV2/avatarV2.mock"
import { ROOM_V2_FURNITURE_CATALOG } from "../roomV2/roomV2.mock"

export const INVENTORY_STORAGE_KEY = "@datevibe/inventory/local_inventory_v1"

export interface DateVibeInventorySnapshot {
  coins: number
  ownedAvatarItemIds: string[]
  ownedRoomItemIds: string[]
  unlockedFeatureIds: string[]
  updatedAt: string
}

export interface InventoryUnlockResult {
  success: boolean
  reason?: "already_owned" | "not_enough_coins" | "invalid_price" | "invalid_item"
}

interface InventoryStoreView {
  inventory: DateVibeInventorySnapshot
  ownsAvatarItem: (itemId: string) => boolean
  ownsRoomItem: (itemId: string) => boolean
  unlockAvatarItem: (itemId: string, priceCoins: number) => InventoryUnlockResult
  unlockRoomItem: (itemId: string, priceCoins: number) => InventoryUnlockResult
  unlockFeature: (featureId: string) => void
}

const STARTER_COINS = 1250

const DEFAULT_OWNED_AVATAR_ITEM_IDS = AVATAR_V2_CATALOG
  .filter((item) => item.ownedByDefault)
  .map((item) => item.id)

const DEFAULT_OWNED_ROOM_ITEM_IDS = ROOM_V2_FURNITURE_CATALOG
  .filter((item) => item.ownedByDefault)
  .map((item) => item.id)

const VALID_AVATAR_ITEM_IDS = new Set(AVATAR_V2_CATALOG.map((item) => item.id))
const VALID_ROOM_ITEM_IDS = new Set(ROOM_V2_FURNITURE_CATALOG.map((item) => item.id))

let inventoryState: DateVibeInventorySnapshot = createDefaultInventorySnapshot()
let hasLoaded = false

type Listener = () => void
const listeners = new Set<Listener>()

function createDefaultInventorySnapshot(): DateVibeInventorySnapshot {
  return {
    coins: STARTER_COINS,
    ownedAvatarItemIds: DEFAULT_OWNED_AVATAR_ITEM_IDS,
    ownedRoomItemIds: DEFAULT_OWNED_ROOM_ITEM_IDS,
    unlockedFeatureIds: [],
    updatedAt: new Date(0).toISOString()
  }
}

function normalizeInventorySnapshot(value: unknown): DateVibeInventorySnapshot | null {
  if (!value || typeof value !== "object") return null
  const candidate = value as Partial<DateVibeInventorySnapshot>
  if (
    typeof candidate.coins !== "number" ||
    !Array.isArray(candidate.ownedAvatarItemIds) ||
    !Array.isArray(candidate.ownedRoomItemIds)
  ) {
    return null
  }

  const defaultSnapshot = createDefaultInventorySnapshot()
  return {
    coins: Math.max(0, Math.floor(candidate.coins)),
    ownedAvatarItemIds: validAvatarItemIds(uniqueStrings([
      ...defaultSnapshot.ownedAvatarItemIds,
      ...candidate.ownedAvatarItemIds
    ])),
    ownedRoomItemIds: validRoomItemIds(uniqueStrings([
      ...defaultSnapshot.ownedRoomItemIds,
      ...candidate.ownedRoomItemIds
    ])),
    unlockedFeatureIds: uniqueStrings(candidate.unlockedFeatureIds ?? []),
    updatedAt: typeof candidate.updatedAt === "string"
      ? candidate.updatedAt
      : new Date().toISOString()
  }
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string"))]
}

function validRoomItemIds(itemIds: string[]): string[] {
  return itemIds.filter((itemId) => VALID_ROOM_ITEM_IDS.has(itemId))
}

function validAvatarItemIds(itemIds: string[]): string[] {
  return itemIds.filter((itemId) => VALID_AVATAR_ITEM_IDS.has(itemId))
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function setInventoryState(
  createNext: (current: DateVibeInventorySnapshot) => DateVibeInventorySnapshot
): void {
  inventoryState = createNext(copyInventorySnapshot(inventoryState))
  notify()
  void saveInventorySnapshot(inventoryState)
}

function copyInventorySnapshot(
  snapshot: DateVibeInventorySnapshot
): DateVibeInventorySnapshot {
  return {
    ...snapshot,
    ownedAvatarItemIds: [...snapshot.ownedAvatarItemIds],
    ownedRoomItemIds: [...snapshot.ownedRoomItemIds],
    unlockedFeatureIds: [...snapshot.unlockedFeatureIds]
  }
}

async function loadInventorySnapshot(): Promise<void> {
  if (hasLoaded) return
  try {
    const rawValue = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY)
    if (rawValue) {
      const parsed: unknown = JSON.parse(rawValue)
      const storedSnapshot = normalizeInventorySnapshot(parsed)
      if (storedSnapshot) {
        inventoryState = storedSnapshot
      }
    }
  } catch {
    inventoryState = createDefaultInventorySnapshot()
  } finally {
    hasLoaded = true
    notify()
  }
}

async function saveInventorySnapshot(
  snapshot: DateVibeInventorySnapshot
): Promise<void> {
  try {
    await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    return
  }
}

function createUnlockResult(
  current: DateVibeInventorySnapshot,
  itemId: string,
  priceCoins: number,
  ownedIds: string[],
  key: "ownedAvatarItemIds" | "ownedRoomItemIds"
): {
  nextInventory: DateVibeInventorySnapshot
  result: InventoryUnlockResult
} {
  if (ownedIds.includes(itemId)) {
    return {
      nextInventory: current,
      result: { success: false, reason: "already_owned" }
    }
  }
  if (!Number.isFinite(priceCoins) || priceCoins < 0) {
    return {
      nextInventory: current,
      result: { success: false, reason: "invalid_price" }
    }
  }
  if (current.coins < priceCoins) {
    return {
      nextInventory: current,
      result: { success: false, reason: "not_enough_coins" }
    }
  }

  return {
    nextInventory: {
      ...current,
      coins: current.coins - Math.floor(priceCoins),
      [key]: uniqueStrings([...ownedIds, itemId]),
      updatedAt: new Date().toISOString()
    },
    result: { success: true }
  }
}

export function ownsAvatarInventoryItem(
  inventory: DateVibeInventorySnapshot,
  itemId: string
): boolean {
  return inventory.ownedAvatarItemIds.includes(itemId)
}

export function ownsRoomInventoryItem(
  inventory: DateVibeInventorySnapshot,
  itemId: string
): boolean {
  return inventory.ownedRoomItemIds.includes(itemId)
}

export function addInventoryCoins(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) return
  setInventoryState((current) => ({
    ...current,
    coins: current.coins + Math.floor(amount),
    updatedAt: new Date().toISOString()
  }))
}

export function useInventoryStore(): InventoryStoreView {
  const [, setTick] = useState(0)

  const sync = useCallback(() => {
    setTick((current) => current + 1)
  }, [])

  useEffect(() => {
    void loadInventorySnapshot()
    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [sync])

  const ownsAvatarItem = useCallback((itemId: string): boolean => {
    return ownsAvatarInventoryItem(inventoryState, itemId)
  }, [])

  const ownsRoomItem = useCallback((itemId: string): boolean => {
    return ownsRoomInventoryItem(inventoryState, itemId)
  }, [])

  const unlockAvatarItem = useCallback(
    (itemId: string, priceCoins: number): InventoryUnlockResult => {
      if (!VALID_AVATAR_ITEM_IDS.has(itemId)) {
        return { success: false, reason: "invalid_item" }
      }
      let result: InventoryUnlockResult = { success: false }
      setInventoryState((current) => {
        const unlock = createUnlockResult(
          current,
          itemId,
          priceCoins,
          current.ownedAvatarItemIds,
          "ownedAvatarItemIds"
        )
        result = unlock.result
        return unlock.nextInventory
      })
      return result
    },
    []
  )

  const unlockRoomItem = useCallback(
    (itemId: string, priceCoins: number): InventoryUnlockResult => {
      if (!VALID_ROOM_ITEM_IDS.has(itemId)) {
        return { success: false, reason: "invalid_item" }
      }
      let result: InventoryUnlockResult = { success: false }
      setInventoryState((current) => {
        const unlock = createUnlockResult(
          current,
          itemId,
          priceCoins,
          current.ownedRoomItemIds,
          "ownedRoomItemIds"
        )
        result = unlock.result
        return unlock.nextInventory
      })
      return result
    },
    []
  )

  const unlockFeature = useCallback((featureId: string): void => {
    setInventoryState((current) => {
      if (current.unlockedFeatureIds.includes(featureId)) return current
      return {
        ...current,
        unlockedFeatureIds: uniqueStrings([...current.unlockedFeatureIds, featureId]),
        updatedAt: new Date().toISOString()
      }
    })
  }, [])

  return {
    inventory: copyInventorySnapshot(inventoryState),
    ownsAvatarItem,
    ownsRoomItem,
    unlockAvatarItem,
    unlockRoomItem,
    unlockFeature
  }
}
