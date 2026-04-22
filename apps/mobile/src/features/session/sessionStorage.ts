import AsyncStorage from "@react-native-async-storage/async-storage"
import type { SessionActor } from "./sessionApi"

const SESSION_ACTOR_STORAGE_KEY = "datevibe.mobile.session_actor.v1"

function isValidSessionActor(value: unknown): value is SessionActor {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const session = candidate.session as Record<string, unknown> | undefined
  const profile = candidate.profile as Record<string, unknown> | undefined

  if (!session || !profile) {
    return false
  }

  const hasValidSessionShape =
    typeof session.userId === "string" &&
    typeof session.sessionToken === "string" &&
    typeof session.expiresAt === "string"

  const avatar = profile.avatar as Record<string, unknown> | undefined
  const hasValidProfileShape =
    typeof profile.userId === "string" &&
    typeof profile.displayName === "string" &&
    typeof avatar === "object" &&
    avatar !== null &&
    typeof avatar.presetId === "string"

  return hasValidSessionShape && hasValidProfileShape
}

export async function loadSessionActor(): Promise<SessionActor | null> {
  const rawValue = await AsyncStorage.getItem(SESSION_ACTOR_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(rawValue)
    if (!isValidSessionActor(parsed)) {
      await AsyncStorage.removeItem(SESSION_ACTOR_STORAGE_KEY)
      return null
    }

    const expiresAtMs = new Date(parsed.session.expiresAt).getTime()
    if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
      await AsyncStorage.removeItem(SESSION_ACTOR_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    await AsyncStorage.removeItem(SESSION_ACTOR_STORAGE_KEY)
    return null
  }
}

export async function saveSessionActor(sessionActor: SessionActor): Promise<void> {
  await AsyncStorage.setItem(SESSION_ACTOR_STORAGE_KEY, JSON.stringify(sessionActor))
}

export async function clearSessionActor(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_ACTOR_STORAGE_KEY)
}
