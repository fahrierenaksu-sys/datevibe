import assert from "node:assert/strict"
import test from "node:test"
import {
  DATEVIBE_QA_AVATAR_ITEM_IDS,
  createAvatarQaInventory,
  getAvatarAutomationSlug,
  isAvatarQaUnlockEnabled
} from "./avatarQaInventory"

test("QA unlock requires both development mode and the explicit env flag", () => {
  assert.equal(isAvatarQaUnlockEnabled(false, "1"), false)
  assert.equal(isAvatarQaUnlockEnabled(true, undefined), false)
  assert.equal(isAvatarQaUnlockEnabled(true, "0"), false)
  assert.equal(isAvatarQaUnlockEnabled(true, "1"), true)
})

test("clean mode preserves the real inventory without mutation", () => {
  const ownedItemIds = ["avatar_v2_top_default"]
  const inventory = createAvatarQaInventory(ownedItemIds, false)

  assert.deepEqual(inventory.ownedItemIds, ownedItemIds)
  assert.notEqual(inventory.ownedItemIds, ownedItemIds)
})

test("QA mode adds the regression matrix items without changing the source", () => {
  const ownedItemIds = ["avatar_v2_top_default"]
  const inventory = createAvatarQaInventory(ownedItemIds, true)

  assert.deepEqual(ownedItemIds, ["avatar_v2_top_default"])
  assert.equal(
    new Set(inventory.ownedItemIds).size,
    inventory.ownedItemIds.length
  )
  for (const itemId of DATEVIBE_QA_AVATAR_ITEM_IDS) {
    assert.equal(inventory.ownedItemIds.includes(itemId), true, itemId)
  }
})

test("automation slugs are stable across avatar item categories", () => {
  assert.equal(
    getAvatarAutomationSlug(
      "avatar_v2_top_lilac_offshoulder_bow_blouse"
    ),
    "lilac_offshoulder_bow_blouse"
  )
  assert.equal(
    getAvatarAutomationSlug(
      "avatar_v2_bottom_floral_embroidered_skort_shorts"
    ),
    "floral_embroidered_skort_shorts"
  )
})
