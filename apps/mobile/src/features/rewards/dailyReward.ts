/**
 * Daily login reward — awards coins on first launch each calendar day.
 *
 * Uses AsyncStorage to track last reward date.
 * Award: 25 coins per day, scaling with streak (up to 100).
 */

import AsyncStorage from "@react-native-async-storage/async-storage"
import { addCoins } from "../cosmetics/cosmeticStore"
import { showToast } from "../../ui/toast"

const STORAGE_KEY = "@datevibe/daily_reward"

interface DailyRewardState {
  lastRewardDate: string // YYYY-MM-DD
  streak: number
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function yesterdayKey(): string {
  const d = new Date(Date.now() - 86_400_000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function streakBonus(streak: number): number {
  // Base: 25 coins, +5 per streak day, capped at 100
  return Math.min(100, 25 + (streak - 1) * 5)
}

/**
 * Check and award daily login reward. Call once on app launch.
 * Returns the coins awarded (0 if already claimed today).
 */
export async function checkDailyReward(): Promise<number> {
  const today = todayKey()

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    let state: DailyRewardState = { lastRewardDate: "", streak: 0 }

    if (raw) {
      state = JSON.parse(raw) as DailyRewardState
    }

    // Already claimed today
    if (state.lastRewardDate === today) {
      return 0
    }

    // Calculate streak
    const isConsecutive = state.lastRewardDate === yesterdayKey()
    const newStreak = isConsecutive ? state.streak + 1 : 1

    // Award coins
    const coins = streakBonus(newStreak)
    addCoins(coins)

    // Persist
    const newState: DailyRewardState = {
      lastRewardDate: today,
      streak: newStreak
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState))

    // Show toast
    const streakLabel = newStreak > 1 ? ` (${newStreak}-day streak!)` : ""
    showToast({
      title: `Daily reward: +${coins} coins${streakLabel}`,
      body: "Welcome back to DateVibe!",
      type: "success",
      durationMs: 4000
    })

    return coins
  } catch {
    return 0
  }
}
