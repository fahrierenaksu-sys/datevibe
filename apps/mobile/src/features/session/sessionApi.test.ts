import assert from "node:assert/strict"
import test from "node:test"
import {
  createDemoSessionActor,
  updateSessionActorProfile
} from "./sessionApi"

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
