import type { SessionActor } from "./sessionModel"

export type SessionEntryRoute =
  | "Splash"
  | "Welcome"
  | "AuthEntry"
  | "ProfileSetup"
  | "AvatarSetup"
  | "RoomSetup"
  | "Main"

export interface SelectSessionEntryRouteInput {
  isHydrating: boolean
  hasSeenIntro: boolean
  sessionActor: SessionActor | null
}

export function selectSessionEntryRoute(
  input: SelectSessionEntryRouteInput
): SessionEntryRoute {
  if (input.isHydrating) return "Splash"
  if (!input.sessionActor) {
    return input.hasSeenIntro ? "AuthEntry" : "Welcome"
  }

  const { onboarding } = input.sessionActor.session
  if (onboarding.profile !== "complete") return "ProfileSetup"
  if (onboarding.avatar !== "complete") return "AvatarSetup"
  if (onboarding.room !== "complete") return "RoomSetup"
  return "Main"
}
