import type { AvatarInventory } from "../avatarV2.types"

export const DATEVIBE_QA_AVATAR_ITEM_IDS = [
  "avatar_v2_top_default",
  "avatar_v2_bottom_default",
  "avatar_v2_shoes_default",
  "avatar_v2_top_lilac_offshoulder_bow_blouse",
  "avatar_v2_bottom_floral_embroidered_skort_shorts",
  "avatar_v2_shoes_white_sneakers",
  "avatar_v2_top_silver_sequin_halter_top",
  "avatar_v2_bottom_pink_embellished_wide_pants",
  "avatar_v2_bottom_patchwork_bow_mini_skirt",
  "avatar_v2_top_silver_lace_ruffle_dress_top",
  "avatar_v2_bottom_silver_lace_ruffle_dress_bottom",
  "avatar_v2_top_red_floral_bikini_top",
  "avatar_v2_bottom_white_embellished_wide_pants"
] as const

export function isAvatarQaUnlockEnabled(
  isDevelopment: boolean,
  rawFlag: string | undefined
): boolean {
  return isDevelopment && rawFlag?.trim() === "1"
}

export function createAvatarQaInventory(
  ownedItemIds: string[],
  enabled: boolean
): AvatarInventory {
  return {
    ownedItemIds: enabled
      ? [...new Set([...ownedItemIds, ...DATEVIBE_QA_AVATAR_ITEM_IDS])]
      : [...ownedItemIds]
  }
}

export function getAvatarAutomationSlug(itemId: string): string {
  return itemId.replace(
    /^avatar_v2_(body|face|hair|top|bottom|shoes|accessory)_/,
    ""
  )
}
