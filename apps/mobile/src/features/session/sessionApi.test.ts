import assert from "node:assert/strict"
import test from "node:test"
import {
  registerAccount,
  updateSessionActorProfile
} from "./sessionApi"
import { createDemoSessionActor } from "./sessionModel"

test("profile updates create a new session actor without mutating the source", () => {
  const actor = createDemoSessionActor({
    displayName: "Ece",
    age: 24,
    avatarPresetId: "sunset"
  })

  const updated = updateSessionActorProfile(actor, {
    displayName: "Ece Deniz",
    age: 25
  })

  assert.notEqual(updated, actor)
  assert.notEqual(updated.profile, actor.profile)
  assert.equal(actor.profile.displayName, "Ece")
  assert.equal(actor.profile.age, 24)
  assert.equal(updated.profile.displayName, "Ece Deniz")
  assert.equal(updated.profile.age, 25)
  assert.deepEqual(updated.profile.avatar, actor.profile.avatar)
})

test("register creates an incomplete production session from the API boundary", async () => {
  const fetchCalls: Array<{ url: string; init?: RequestInit }> = []
  const actor = await registerAccount(
    "https://api.datevibe.test",
    {
      phoneNumber: "+905551112233",
      verificationCode: "482931"
    },
    async (url, init) => {
      fetchCalls.push({ url: String(url), init })
      return new Response(JSON.stringify({
        session: {
          accountId: "account-1",
          sessionId: "session-1",
          mode: "production",
          userId: "user-1",
          sessionToken: "production-token",
          expiresAt: "2999-01-01T00:00:00.000Z"
        },
        profile: {
          userId: "user-1",
          displayName: "",
          avatar: { presetId: "dusk" }
        }
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    }
  )

  assert.equal(fetchCalls[0]?.url, "https://api.datevibe.test/v1/accounts/register")
  assert.deepEqual(JSON.parse(String(fetchCalls[0]?.init?.body)), {
    phoneNumber: "+905551112233",
    verificationCode: "482931"
  })
  assert.equal(actor.session.mode, "production")
  assert.equal(actor.session.onboarding.profile, "incomplete")
  assert.equal(actor.session.onboarding.avatar, "incomplete")
  assert.equal(actor.session.onboarding.room, "incomplete")
})

test("production registration rejects missing account or session identifiers", async () => {
  await assert.rejects(
    registerAccount(
      "https://api.datevibe.test",
      {
        phoneNumber: "+905551112233",
        verificationCode: "482931"
      },
      async () => new Response(JSON.stringify({
        session: {
          mode: "production",
          userId: "user-1",
          sessionToken: "production-token",
          expiresAt: "2999-01-01T00:00:00.000Z"
        },
        profile: {
          userId: "user-1",
          displayName: "",
          avatar: { presetId: "dusk" }
        }
      }), { status: 200 })
    ),
    /production session/i
  )
})

test("production registration rejects a response without an explicit mode", async () => {
  await assert.rejects(
    registerAccount(
      "https://api.datevibe.test",
      {
        phoneNumber: "+905551112233",
        verificationCode: "482931"
      },
      async () => new Response(JSON.stringify({
        session: {
          accountId: "account-1",
          sessionId: "session-1",
          userId: "user-1",
          sessionToken: "production-token",
          expiresAt: "2999-01-01T00:00:00.000Z"
        },
        profile: {
          userId: "user-1",
          displayName: "",
          avatar: { presetId: "dusk" }
        }
      }), { status: 200 })
    ),
    /production session/i
  )
})

test("production registration rejects an explicit demo identity", async () => {
  await assert.rejects(
    registerAccount(
      "https://api.datevibe.test",
      {
        phoneNumber: "+905551112233",
        verificationCode: "482931"
      },
      async () => new Response(JSON.stringify({
        session: {
          userId: "demo-user",
          sessionToken: "demo-session-token",
          expiresAt: "2999-01-01T00:00:00.000Z",
          accountId: "demo-user",
          sessionId: "demo-session",
          mode: "demo",
          onboarding: {
            profile: "complete",
            avatar: "complete",
            room: "complete"
          }
        },
        profile: {
          userId: "demo-user",
          displayName: "Demo Guest",
          avatar: { presetId: "sunset" }
        }
      }), { status: 200 })
    ),
    /production session/i
  )
})

test("new production registration always begins with incomplete setup", async () => {
  const actor = await registerAccount(
    "https://api.datevibe.test",
    {
      phoneNumber: "+905551112233",
      verificationCode: "482931"
    },
    async () => new Response(JSON.stringify({
      session: {
        accountId: "account-1",
        sessionId: "session-1",
        mode: "production",
        userId: "user-1",
        sessionToken: "production-token",
        expiresAt: "2999-01-01T00:00:00.000Z",
        onboarding: {
          profile: "complete",
          avatar: "complete",
          room: "complete"
        }
      },
      profile: {
        userId: "user-1",
        displayName: "",
        avatar: { presetId: "dusk" }
      }
    }), { status: 200 })
  )

  assert.equal(actor.session.onboarding.profile, "incomplete")
  assert.equal(actor.session.onboarding.avatar, "incomplete")
  assert.equal(actor.session.onboarding.room, "incomplete")
})
