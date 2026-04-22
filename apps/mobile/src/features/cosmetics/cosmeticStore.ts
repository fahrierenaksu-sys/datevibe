/**
 * cosmeticStore — manages equipped cosmetics and unlock state.
 *
 * Persists to AsyncStorage for cross-session continuity.
 * When a server cosmetic API exists, this becomes the local cache.
 */

import { useCallback, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  COSMETIC_CATALOG,
  DEFAULT_EQUIP_STATE,
  type AvatarCosmetic,
  type CosmeticCategory,
  type CosmeticEquipState
} from "./cosmeticCatalog"

const STORAGE_KEY_UNLOCKED = "@datevibe/cosmetics_unlocked"
const STORAGE_KEY_EQUIPPED = "@datevibe/cosmetics_equipped"
const STORAGE_KEY_COINS = "@datevibe/cosmetics_coins"

// ── In-memory state ─────────────────────────────────────────

let unlockedIds: Set<string> = new Set(
  COSMETIC_CATALOG.filter((c) => c.unlocked).map((c) => c.id)
)
let equipState: CosmeticEquipState = { ...DEFAULT_EQUIP_STATE }
let coinBalance = 1250 // starter coins

type Listener = () => void
const listeners: Set<Listener> = new Set()

function notify(): void {
  for (const l of listeners) l()
}

// ── Persistence ─────────────────────────────────────────────

let loaded = false

async function loadFromStorage(): Promise<void> {
  if (loaded) return
  try {
    const [rawUnlocked, rawEquipped, rawCoins] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_UNLOCKED),
      AsyncStorage.getItem(STORAGE_KEY_EQUIPPED),
      AsyncStorage.getItem(STORAGE_KEY_COINS)
    ])

    if (rawUnlocked) {
      const parsed = JSON.parse(rawUnlocked) as string[]
      unlockedIds = new Set([
        ...COSMETIC_CATALOG.filter((c) => c.unlocked).map((c) => c.id),
        ...parsed
      ])
    }
    if (rawEquipped) {
      equipState = { ...DEFAULT_EQUIP_STATE, ...JSON.parse(rawEquipped) }
    }
    if (rawCoins) {
      coinBalance = Number.parseInt(rawCoins, 10)
    }
  } catch {
    // Silently fail — defaults are fine
  }
  loaded = true
  notify()
}

async function saveToStorage(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(
        STORAGE_KEY_UNLOCKED,
        JSON.stringify([...unlockedIds])
      ),
      AsyncStorage.setItem(STORAGE_KEY_EQUIPPED, JSON.stringify(equipState)),
      AsyncStorage.setItem(STORAGE_KEY_COINS, String(coinBalance))
    ])
  } catch {
    // Silently fail
  }
}

// ── Actions ─────────────────────────────────────────────────

export function isUnlocked(itemId: string): boolean {
  return unlockedIds.has(itemId)
}

export function unlockCosmetic(itemId: string): { success: boolean; reason?: string } {
  const item = COSMETIC_CATALOG.find((c) => c.id === itemId)
  if (!item) return { success: false, reason: "Item not found" }
  if (unlockedIds.has(itemId)) return { success: false, reason: "Already owned" }
  if (coinBalance < item.priceCoins) return { success: false, reason: "Not enough coins" }

  coinBalance -= item.priceCoins
  unlockedIds.add(itemId)
  notify()
  void saveToStorage()
  return { success: true }
}

export function equipCosmetic(itemId: string): boolean {
  const item = COSMETIC_CATALOG.find((c) => c.id === itemId)
  if (!item || !unlockedIds.has(itemId)) return false

  equipState = { ...equipState, [item.category]: itemId }
  notify()
  void saveToStorage()
  return true
}

export function unequipCategory(category: CosmeticCategory): void {
  equipState = { ...equipState, [category]: null }
  notify()
  void saveToStorage()
}

export function addCoins(amount: number): void {
  coinBalance += amount
  notify()
  void saveToStorage()
}

// ── Read helpers ────────────────────────────────────────────

export function getEquipState(): CosmeticEquipState {
  return equipState
}

export function getCoinBalance(): number {
  return coinBalance
}

export function getUnlockedIds(): Set<string> {
  return unlockedIds
}

export function getEquippedItem(category: CosmeticCategory): AvatarCosmetic | null {
  const id = equipState[category]
  if (!id) return null
  return COSMETIC_CATALOG.find((c) => c.id === id) ?? null
}

// ── Reactive hook ───────────────────────────────────────────

export interface CosmeticStoreView {
  equipState: CosmeticEquipState
  coinBalance: number
  isUnlocked: (itemId: string) => boolean
  unlockCosmetic: (itemId: string) => { success: boolean; reason?: string }
  equipCosmetic: (itemId: string) => boolean
  unequipCategory: (category: CosmeticCategory) => void
  getEquippedItem: (category: CosmeticCategory) => AvatarCosmetic | null
}

export function useCosmeticStore(): CosmeticStoreView {
  const [, setTick] = useState(0)

  const sync = useCallback(() => {
    setTick((t) => t + 1)
  }, [])

  useEffect(() => {
    void loadFromStorage()
    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [sync])

  return {
    equipState,
    coinBalance,
    isUnlocked,
    unlockCosmetic,
    equipCosmetic,
    unequipCategory,
    getEquippedItem
  }
}
