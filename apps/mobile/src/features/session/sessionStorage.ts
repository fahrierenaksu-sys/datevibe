import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
import type { SessionActor } from "./sessionModel"
import {
  createSessionPersistence,
  type SessionKeyValueStore
} from "./sessionPersistence"

const INTRO_SEEN_STORAGE_KEY = "@datevibe/welcome_seen"

const asyncStore: SessionKeyValueStore = {
  getItem: AsyncStorage.getItem,
  setItem: AsyncStorage.setItem,
  removeItem: AsyncStorage.removeItem
}

const secureStore: SessionKeyValueStore = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync
}

const sessionPersistence = createSessionPersistence({
  platform: Platform.OS === "web" ? "web" : "native",
  asyncStore,
  secureStore
})

export const loadSessionActor = sessionPersistence.load
export const saveSessionActor = sessionPersistence.save
export const clearSessionActor = sessionPersistence.clear

export async function loadHasSeenIntro(): Promise<boolean> {
  return (await AsyncStorage.getItem(INTRO_SEEN_STORAGE_KEY)) === "true"
}

export async function saveHasSeenIntro(): Promise<void> {
  await AsyncStorage.setItem(INTRO_SEEN_STORAGE_KEY, "true")
}
