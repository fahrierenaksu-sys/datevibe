/**
 * Haptic feedback helpers — wraps Platform-safe vibration patterns
 * for key interaction moments.
 */

import { Platform, Vibration } from "react-native"

/** Light tap for button presses, tab switches */
export function hapticLight(): void {
  if (Platform.OS === "web") return
  Vibration.vibrate(10)
}

/** Medium tap for card transitions, filter apply */
export function hapticMedium(): void {
  if (Platform.OS === "web") return
  Vibration.vibrate(25)
}

/** Strong pulse for important actions — invite sent, save */
export function hapticStrong(): void {
  if (Platform.OS === "web") return
  Vibration.vibrate(40)
}

/** Success burst for matches, unlocks */
export function hapticSuccess(): void {
  if (Platform.OS === "web") return
  Vibration.vibrate([0, 30, 50, 30])
}

/** Error buzz for failed actions */
export function hapticError(): void {
  if (Platform.OS === "web") return
  Vibration.vibrate([0, 50, 30, 80])
}
