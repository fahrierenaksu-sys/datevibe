import {
  normalizeStoredSessionActor,
  type SessionActor
} from "./sessionModel"

export const SESSION_ACTOR_STORAGE_KEY = "datevibe.mobile.session_actor.v1"

export interface SessionKeyValueStore {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

export interface SessionPersistenceDependencies {
  platform: "native" | "web"
  asyncStore: SessionKeyValueStore
  secureStore?: SessionKeyValueStore
  now?: () => number
}

export interface SessionPersistence {
  load: () => Promise<SessionActor | null>
  save: (actor: SessionActor) => Promise<void>
  clear: () => Promise<void>
}

export function createSessionPersistence(
  dependencies: SessionPersistenceDependencies
): SessionPersistence {
  const now = dependencies.now ?? Date.now

  return {
    load: async () => {
      if (dependencies.platform === "native") {
        const secureStore = requireSecureStore(dependencies.secureStore)
        const secureValue = await secureStore.getItem(SESSION_ACTOR_STORAGE_KEY)
        if (secureValue) {
          const secureActor = await parseStoredActor(
            secureValue,
            now,
            secureStore
          )
          if (secureActor) return secureActor
        }

        const legacyValue = await dependencies.asyncStore.getItem(
          SESSION_ACTOR_STORAGE_KEY
        )
        if (!legacyValue) return null

        const actor = await parseStoredActor(
          legacyValue,
          now,
          dependencies.asyncStore
        )
        if (!actor) return null

        await secureStore.setItem(
          SESSION_ACTOR_STORAGE_KEY,
          JSON.stringify(actor)
        )
        await dependencies.asyncStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
        return actor
      }

      const webValue = await dependencies.asyncStore.getItem(
        SESSION_ACTOR_STORAGE_KEY
      )
      if (!webValue) return null

      const actor = await parseStoredActor(
        webValue,
        now,
        dependencies.asyncStore
      )
      if (!actor) return null

      if (actor.session.mode === "production") {
        await dependencies.asyncStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
        return null
      }

      return actor
    },
    save: async (actor) => {
      if (dependencies.platform === "native") {
        const secureStore = requireSecureStore(dependencies.secureStore)
        await secureStore.setItem(
          SESSION_ACTOR_STORAGE_KEY,
          JSON.stringify(actor)
        )
        await dependencies.asyncStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
        return
      }

      if (actor.session.mode === "demo") {
        await dependencies.asyncStore.setItem(
          SESSION_ACTOR_STORAGE_KEY,
          JSON.stringify(actor)
        )
      } else {
        await dependencies.asyncStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
      }
    },
    clear: async () => {
      if (dependencies.platform === "native") {
        await requireSecureStore(dependencies.secureStore).removeItem(
          SESSION_ACTOR_STORAGE_KEY
        )
      }
      await dependencies.asyncStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
    }
  }
}

async function parseStoredActor(
  rawValue: string,
  now: () => number,
  sourceStore: SessionKeyValueStore
): Promise<SessionActor | null> {
  try {
    const parsed: unknown = JSON.parse(rawValue)
    const actor = normalizeStoredSessionActor(parsed)
    if (!actor || isExpired(actor, now())) {
      await sourceStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
      return null
    }
    return actor
  } catch (error) {
    if (error instanceof SyntaxError) {
      await sourceStore.removeItem(SESSION_ACTOR_STORAGE_KEY)
      return null
    }
    throw error
  }
}

function isExpired(actor: SessionActor, now: number): boolean {
  const expiresAtMs = new Date(actor.session.expiresAt).getTime()
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= now
}

function requireSecureStore(
  secureStore: SessionKeyValueStore | undefined
): SessionKeyValueStore {
  if (!secureStore) {
    throw new Error("Secure session storage is unavailable")
  }
  return secureStore
}
