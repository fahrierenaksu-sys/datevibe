import AsyncStorage from "@react-native-async-storage/async-storage"
import type { SessionActor } from "./sessionApi"

const SESSION_ACTOR_STORAGE_KEY = "datevibe.mobile.session_actor.v1"

export async function loadSessionActor(): Promise<SessionActor | null> {
  const rawValue = await AsyncStorage.getItem(SESSION_ACTOR_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as SessionActor
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
