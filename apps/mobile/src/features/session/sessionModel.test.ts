import assert from "node:assert/strict"
import test from "node:test"
import {
  completeSessionSetupStep,
  createDemoSessionActor,
  normalizeStoredSessionActor
} from "./sessionModel"

test("demo session is explicit and already setup for exploration", () => {
  const actor = createDemoSessionActor({
    displayName: "Demo Guest",
    age: 24,
    avatarPresetId: "sunset"
  })

  assert.equal(actor.session.mode, "demo")
  assert.equal(actor.session.onboarding.profile, "complete")
  assert.equal(actor.session.onboarding.avatar, "complete")
  assert.equal(actor.session.onboarding.room, "complete")
})

test("setup completion is immutable and advances one step", () => {
  const actor = normalizeStoredSessionActor({
    session: {
      userId: "user-1",
      sessionToken: "production-token",
      expiresAt: "2999-01-01T00:00:00.000Z",
      accountId: "account-1",
      sessionId: "session-1",
      mode: "production",
      onboarding: {
        profile: "incomplete",
        avatar: "incomplete",
        room: "incomplete"
      }
    },
    profile: {
      userId: "user-1",
      displayName: "",
      avatar: { presetId: "dusk" }
    }
  })

  assert.ok(actor)
  const updated = completeSessionSetupStep(actor, "profile")

  assert.notEqual(updated, actor)
  assert.notEqual(updated.session, actor.session)
  assert.equal(actor.session.onboarding.profile, "incomplete")
  assert.equal(updated.session.onboarding.profile, "complete")
  assert.equal(updated.session.onboarding.avatar, "incomplete")
})

test("legacy stored sessions normalize without losing returning users", () => {
  const actor = normalizeStoredSessionActor({
    session: {
      userId: "legacy-user",
      sessionToken: "legacy-token",
      expiresAt: "2999-01-01T00:00:00.000Z"
    },
    profile: {
      userId: "legacy-user",
      displayName: "Ece",
      age: 24,
      avatar: { presetId: "sunset" }
    }
  })

  assert.ok(actor)
  assert.equal(actor.session.mode, "production")
  assert.equal(actor.session.accountId, "legacy-user")
  assert.equal(actor.session.onboarding.profile, "complete")
  assert.equal(actor.session.onboarding.avatar, "complete")
  assert.equal(actor.session.onboarding.room, "complete")
})

test("session identity rejects a profile owned by another user", () => {
  const actor = normalizeStoredSessionActor({
    session: {
      userId: "user-1",
      sessionToken: "production-token",
      expiresAt: "2999-01-01T00:00:00.000Z"
    },
    profile: {
      userId: "user-2",
      displayName: "Other User",
      avatar: { presetId: "sunset" }
    }
  })

  assert.equal(actor, null)
})
