import assert from "node:assert/strict"
import test from "node:test"
import { logoutCurrentSession } from "./sessionLifecycle"

test("logout clears persisted session and returns a logged-out state", async () => {
  let clearCalls = 0

  const result = await logoutCurrentSession({
    clear: async () => {
      clearCalls += 1
    }
  })

  assert.equal(clearCalls, 1)
  assert.equal(result, null)
})
