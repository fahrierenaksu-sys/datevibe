import type { AvatarLayerAssetRef } from "./avatarV2.types"

// Asset contract: every avatar layer must be a 512x768 RGBA transparent PNG
// with the same canvas, character centerline, and feet baseline. Avoid per-item
// offset hacks; future animation states should reuse this alignment contract.
const layerAsset = (
  key: string,
  source: AvatarLayerAssetRef["source"]
): AvatarLayerAssetRef => ({
  key,
  source
})

export const avatarV2LayerAssets = {
  bodyDefault: layerAsset(
    "avatar_body_default",
    require("./assets/layers/avatar_body_default.png")
  ),
  faceDefault: layerAsset(
    "avatar_face_default",
    require("./assets/layers/avatar_face_default.png")
  ),
  hairDefault: layerAsset(
    "avatar_hair_default",
    require("./assets/layers/avatar_hair_default.png")
  ),
  hair01: layerAsset(
    "avatar_hair_01",
    require("./assets/layers/avatar_hair_01.png")
  ),
  topDefault: layerAsset(
    "avatar_top_default",
    require("./assets/layers/avatar_top_default.png")
  ),
  top01: layerAsset(
    "avatar_top_01",
    require("./assets/layers/avatar_top_01.png")
  ),
  bottomDefault: layerAsset(
    "avatar_bottom_default",
    require("./assets/layers/avatar_bottom_default.png")
  ),
  bottom01: layerAsset(
    "avatar_bottom_01",
    require("./assets/layers/avatar_bottom_01.png")
  ),
  shoesDefault: layerAsset(
    "avatar_shoes_default",
    require("./assets/layers/avatar_shoes_default.png")
  ),
  shoes01: layerAsset(
    "avatar_shoes_01",
    require("./assets/layers/avatar_shoes_01.png")
  ),
  accessory01: layerAsset(
    "avatar_accessory_01",
    require("./assets/layers/avatar_accessory_01.png")
  )
} as const
