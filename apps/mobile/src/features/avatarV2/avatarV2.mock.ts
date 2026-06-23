import { avatarV2LayerAssets } from "./avatarV2Assets"
import type {
  AvatarCatalogItem,
  AvatarCategory,
  AvatarInventory,
  AvatarItemType,
  UserAvatar
} from "./avatarV2.types"

export const AVATAR_V2_CATEGORIES: AvatarCategory[] = [
  { type: "body", label: "Body" },
  { type: "face", label: "Face" },
  { type: "hair", label: "Hair" },
  { type: "top", label: "Top" },
  { type: "bottom", label: "Bottom" },
  { type: "shoes", label: "Shoes" },
  { type: "accessory", label: "Accessory" }
]

export const AVATAR_V2_LAYER_ORDER: Record<AvatarItemType, number> = {
  body: 10,
  face: 20,
  hair: 30,
  bottom: 40,
  top: 50,
  shoes: 60,
  accessory: 70
}

export const DEFAULT_AVATAR_V2: UserAvatar = {
  bodyId: "avatar_v2_body_default",
  faceId: "avatar_v2_face_default",
  hairId: "avatar_v2_hair_default",
  topId: "avatar_v2_top_default",
  bottomId: "avatar_v2_bottom_default",
  shoesId: "avatar_v2_shoes_default",
  accessoryIds: []
}

export const AVATAR_V2_CATALOG: AvatarCatalogItem[] = [
  {
    id: DEFAULT_AVATAR_V2.bodyId,
    type: "body",
    name: "Warm Base",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.body,
    assets: { idle_front: avatarV2LayerAssets.bodyDefault },
    isDefault: true,
    ownedByDefault: true
  },
  {
    id: DEFAULT_AVATAR_V2.faceId,
    type: "face",
    name: "Soft Smile",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.face,
    assets: { idle_front: avatarV2LayerAssets.faceDefault },
    isDefault: true,
    ownedByDefault: true
  },
  {
    id: DEFAULT_AVATAR_V2.hairId,
    type: "hair",
    name: "Blonde Waves",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.hair,
    assets: { idle_front: avatarV2LayerAssets.hairDefault },
    isDefault: true,
    ownedByDefault: true
  },
  {
    id: "avatar_v2_hair_wave",
    type: "hair",
    name: "Wavy Curls",
    sortOrder: 20,
    layerOrder: AVATAR_V2_LAYER_ORDER.hair,
    assets: { idle_front: avatarV2LayerAssets.hair01 },
    ownedByDefault: true
  },
  {
    id: DEFAULT_AVATAR_V2.topId,
    type: "top",
    name: "Basic Tee",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.topDefault },
    isDefault: true,
    ownedByDefault: true
  },
  {
    id: "avatar_v2_top_blush",
    type: "top",
    name: "Blush Hoodie",
    sortOrder: 20,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.top01 },
    ownedByDefault: true
  },
  {
    id: DEFAULT_AVATAR_V2.bottomId,
    type: "bottom",
    name: "Classic Shorts",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottomDefault },
    isDefault: true,
    ownedByDefault: true
  },
  {
    id: "avatar_v2_bottom_lilac",
    type: "bottom",
    name: "Lilac Skirt",
    sortOrder: 20,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottom01 },
    ownedByDefault: true
  },
  {
    id: DEFAULT_AVATAR_V2.shoesId,
    type: "shoes",
    name: "Everyday Sneakers",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.shoes,
    assets: { idle_front: avatarV2LayerAssets.shoesDefault },
    isDefault: true,
    ownedByDefault: true
  },
  {
    id: "avatar_v2_shoes_rose",
    type: "shoes",
    name: "Rose Runners",
    sortOrder: 20,
    layerOrder: AVATAR_V2_LAYER_ORDER.shoes,
    assets: { idle_front: avatarV2LayerAssets.shoes01 },
    ownedByDefault: true
  },
  {
    id: "avatar_v2_accessory_mint_glasses",
    type: "accessory",
    name: "Mint Glasses",
    sortOrder: 10,
    layerOrder: AVATAR_V2_LAYER_ORDER.accessory,
    assets: { idle_front: avatarV2LayerAssets.accessory01 },
    ownedByDefault: true
  },
  {
    id: "avatar_v2_top_lilac_offshoulder_bow_blouse",
    type: "top",
    name: "Lilac Bow Blouse",
    sortOrder: 30,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.top01 }
  },
  {
    id: "avatar_v2_bottom_floral_embroidered_skort_shorts",
    type: "bottom",
    name: "Floral Skort",
    sortOrder: 30,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottom01 }
  },
  {
    id: "avatar_v2_shoes_white_sneakers",
    type: "shoes",
    name: "White Sneakers",
    sortOrder: 30,
    layerOrder: AVATAR_V2_LAYER_ORDER.shoes,
    assets: { idle_front: avatarV2LayerAssets.shoes01 },
    ownedByDefault: true
  },
  {
    id: "avatar_v2_top_silver_sequin_halter_top",
    type: "top",
    name: "Silver Halter",
    sortOrder: 40,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.top01 }
  },
  {
    id: "avatar_v2_bottom_pink_embellished_wide_pants",
    type: "bottom",
    name: "Pink Wide Pants",
    sortOrder: 40,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottom01 }
  },
  {
    id: "avatar_v2_bottom_patchwork_bow_mini_skirt",
    type: "bottom",
    name: "Patchwork Mini Skirt",
    sortOrder: 50,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottom01 }
  },
  {
    id: "avatar_v2_top_silver_lace_ruffle_dress_top",
    type: "top",
    name: "Silver Ruffle Dress Top",
    sortOrder: 50,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.top01 }
  },
  {
    id: "avatar_v2_bottom_silver_lace_ruffle_dress_bottom",
    type: "bottom",
    name: "Silver Ruffle Dress Bottom",
    sortOrder: 60,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottom01 }
  },
  {
    id: "avatar_v2_top_red_floral_bikini_top",
    type: "top",
    name: "Red Floral Bikini",
    sortOrder: 60,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.top01 }
  },
  {
    id: "avatar_v2_bottom_white_embellished_wide_pants",
    type: "bottom",
    name: "White Wide Pants",
    sortOrder: 70,
    layerOrder: AVATAR_V2_LAYER_ORDER.bottom,
    assets: { idle_front: avatarV2LayerAssets.bottom01 }
  },
  {
    id: "avatar_v2_top_locked_luxe",
    type: "top",
    name: "Velvet Date Jacket",
    sortOrder: 90,
    layerOrder: AVATAR_V2_LAYER_ORDER.top,
    assets: { idle_front: avatarV2LayerAssets.top01 },
    locked: true
  }
]

export const AVATAR_V2_INVENTORY: AvatarInventory = {
  ownedItemIds: AVATAR_V2_CATALOG
    .filter((item) => item.ownedByDefault)
    .map((item) => item.id)
}
