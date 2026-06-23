import assert from "node:assert/strict"
import test from "node:test"
import {
  createSessionPersistence,
  SESSION_ACTOR_STORAGE_KEY,
  type SessionKeyValueStore
} from "./sessionPersistence"
import {
  createDemoSessionActor,
  createProductionSessionActor
} from "./sessionModel"

function createMemoryStore(
  initial: Record<string, string> = {}
): SessionKeyValueStore & { values: Map<string, string> } {
  const values = new Map(Object.entries(initial))
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value)
    },
    removeItem: async (key) => {
      values.delete(key)
    }
  }
}

function createProductionActor() {
  return createProductionSessionActor({
    accountId: "account-1",
    sessionId: "session-1",
    userId: "user-1",
    sessionToken: "production-token",
    expiresAt: "2999-01-01T00:00:00.000Z",
    profile: {
      userId: "user-1",
      displayName: "Ece",
      avatar: { presetId: "sunset" }
    }
  })
}

test("native persistence stores sessions securely and removes legacy storage", async () => {
  const secureStore = createMemoryStore()
  const asyncStore = createMemoryStore()
  const persistence = createSessionPersistence({
    platform: "native",
    secureStore,
    asyncStore
  })

  await persistence.save(createProductionActor())

  assert.ok(secureStore.values.has(SESSION_ACTOR_STORAGE_KEY))
  assert.equal(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})

test("native persistence imports one valid legacy session into secure storage", async () => {
  const legacyActor = createDemoSessionActor({
    displayName: "Legacy Demo",
    age: 24
  })
  const secureStore = createMemoryStore()
  const asyncStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: JSON.stringify(legacyActor)
  })
  const persistence = createSessionPersistence({
    platform: "native",
    secureStore,
    asyncStore
  })

  const loaded = await persistence.load()

  assert.equal(loaded?.profile.displayName, "Legacy Demo")
  assert.ok(secureStore.values.has(SESSION_ACTOR_STORAGE_KEY))
  assert.equal(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})

test("native persistence falls back to a valid legacy session after clearing malformed secure data", async () => {
  const legacyActor = createDemoSessionActor({
    displayName: "Recovered Demo",
    age: 24
  })
  const secureStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: "{not-json"
  })
  const asyncStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: JSON.stringify(legacyActor)
  })
  const persistence = createSessionPersistence({
    platform: "native",
    secureStore,
    asyncStore
  })

  const loaded = await persistence.load()

  assert.equal(loaded?.profile.displayName, "Recovered Demo")
  assert.equal(
    JSON.parse(secureStore.values.get(SESSION_ACTOR_STORAGE_KEY) ?? "{}")
      .profile?.displayName,
    "Recovered Demo"
  )
  assert.equal(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})

test("web persistence stores demo sessions but never production sessions", async () => {
  const asyncStore = createMemoryStore()
  const persistence = createSessionPersistence({
    platform: "web",
    asyncStore
  })

  await persistence.save(createDemoSessionActor({ displayName: "Demo" }))
  assert.ok(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY))

  await persistence.save(createProductionActor())
  assert.equal(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})

test("web persistence removes a legacy production token instead of restoring it", async () => {
  const asyncStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: JSON.stringify(createProductionActor())
  })
  const persistence = createSessionPersistence({
    platform: "web",
    asyncStore
  })

  assert.equal(await persistence.load(), null)
  assert.equal(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})

test("malformed and expired sessions are removed", async () => {
  const malformedStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: "{not-json"
  })
  const malformedPersistence = createSessionPersistence({
    platform: "web",
    asyncStore: malformedStore
  })
  assert.equal(await malformedPersistence.load(), null)
  assert.equal(malformedStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)

  const currentActor = createDemoSessionActor({ displayName: "Expired" })
  const expiredActor = {
    ...currentActor,
    session: {
      ...currentActor.session,
      expiresAt: "2020-01-01T00:00:00.000Z"
    }
  }
  const expiredStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: JSON.stringify(expiredActor)
  })
  const expiredPersistence = createSessionPersistence({
    platform: "web",
    asyncStore: expiredStore,
    now: () => Date.parse("2026-06-23T00:00:00.000Z")
  })
  assert.equal(await expiredPersistence.load(), null)
  assert.equal(expiredStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})

test("storage failures remain actionable instead of silently creating a session", async () => {
  const failingStore: SessionKeyValueStore = {
    getItem: async () => {
      throw new Error("Storage unavailable")
    },
    setItem: async () => {
      throw new Error("Storage unavailable")
    },
    removeItem: async () => {
      throw new Error("Storage unavailable")
    }
  }
  const persistence = createSessionPersistence({
    platform: "web",
    asyncStore: failingStore
  })

  await assert.rejects(persistence.load(), /Storage unavailable/)
  await assert.rejects(
    persistence.save(createDemoSessionActor({ displayName: "Demo" })),
    /Storage unavailable/
  )
})

test("native logout clears secure and legacy session values", async () => {
  const actor = createDemoSessionActor({ displayName: "Demo" })
  const secureStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: JSON.stringify(actor)
  })
  const asyncStore = createMemoryStore({
    [SESSION_ACTOR_STORAGE_KEY]: JSON.stringify(actor)
  })
  const persistence = createSessionPersistence({
    platform: "native",
    secureStore,
    asyncStore
  })

  await persistence.clear()

  assert.equal(secureStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
  assert.equal(asyncStore.values.has(SESSION_ACTOR_STORAGE_KEY), false)
})
