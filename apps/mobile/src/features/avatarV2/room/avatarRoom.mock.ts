import { roomAvatarLayerAssets } from "./avatarRoomAssets"
import { roomAvatarMotionLayerAssets } from "./avatarRoomMotionAssets"
import type {
  RoomAvatarAppearance,
  RoomAvatarCatalogItem,
  RoomAvatarLayerType
} from "./avatarRoom.types"
import type { RoomV2AvatarMotionAsset } from "../../roomV2/roomV2.types"

export const ROOM_AVATAR_LAYER_ORDER: Record<RoomAvatarLayerType, number> = {
  hairBack: 5,
  base: 10,
  face: 20,
  hair: 30,
  bottom: 40,
  shoes: 50,
  topInner: 55,
  top: 60,
  topOuter: 65,
  accessory: 70,
  hairFront: 80
}

export const DEFAULT_ROOM_AVATAR_FEMALE: RoomAvatarAppearance = {
  bodyPreset: "female",
  hairBackId: "room_avatar_hair_female_blonde_long_back_v2",
  hairFrontId: "room_avatar_hair_female_blonde_long_front_v2",
  baseId: "room_avatar_base_female_v2",
  faceId: "room_avatar_face_female_default_v2",
  hairId: "room_avatar_hair_female_blonde_long_front_v2",
  topId: "room_avatar_top_female_default_v2",
  bottomId: "room_avatar_bottom_female_default_v2",
  shoesId: "room_avatar_shoes_female_default_v2",
  accessoryIds: []
}

export const DEFAULT_ROOM_AVATAR_MALE: RoomAvatarAppearance = {
  bodyPreset: "male",
  baseId: "room_avatar_base_male_v3",
  faceId: "room_avatar_face_male_default_v3",
  hairFrontId: "room_avatar_hair_male_brown_default_v3",
  topInnerId: "room_avatar_top_male_inner_white_tshirt_v3",
  topOuterId: "room_avatar_top_male_outer_blue_shirt_v3",
  bottomId: "room_avatar_bottom_male_beige_pants_v3",
  shoesId: "room_avatar_shoes_male_white_v3",
  accessoryIds: []
}

const ROOM_AVATAR_CATALOG_ITEMS: RoomAvatarCatalogItem[] = [
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.hairBackId!,
    type: "hairBack",
    bodyPreset: "female",
    name: "Blonde Waves Back",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.hairBack,
    asset: roomAvatarLayerAssets.hairFemaleBlondeLongBackV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.hairFemaleBlondeLongBackV2.walkingFront,
      roomAvatarMotionLayerAssets.hairFemaleBlondeLongBackV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.baseId,
    type: "base",
    bodyPreset: "female",
    name: "Female Room Base",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.base,
    asset: roomAvatarLayerAssets.baseFemaleV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.baseFemaleV2.walkingFront,
      roomAvatarMotionLayerAssets.baseFemaleV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.baseId,
    type: "base",
    bodyPreset: "male",
    name: "Male Room Base",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.base,
    asset: roomAvatarLayerAssets.baseMaleV3,
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.faceId,
    type: "face",
    bodyPreset: "female",
    name: "Soft Smile",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.face,
    asset: roomAvatarLayerAssets.faceFemaleDefaultV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.faceFemaleDefaultV2.walkingFront,
      roomAvatarMotionLayerAssets.faceFemaleDefaultV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.faceId,
    type: "face",
    bodyPreset: "male",
    name: "Soft Smile",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.face,
    asset: roomAvatarLayerAssets.faceMaleDefaultV3,
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.hairFrontId!,
    type: "hairFront",
    bodyPreset: "female",
    name: "Blonde Waves Front",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.hairFront,
    asset: roomAvatarLayerAssets.hairFemaleBlondeLongFrontV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.hairFemaleBlondeLongFrontV2.walkingFront,
      roomAvatarMotionLayerAssets.hairFemaleBlondeLongFrontV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.hairFrontId!,
    type: "hairFront",
    bodyPreset: "male",
    name: "Cocoa Crop",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.hairFront,
    asset: roomAvatarLayerAssets.hairMaleBrownDefaultV3,
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.bottomId,
    type: "bottom",
    bodyPreset: "female",
    name: "Rose Skirt",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemaleDefaultV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemaleDefaultV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemaleDefaultV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.bottomId,
    type: "bottom",
    bodyPreset: "male",
    name: "Beige Pants",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomMaleBeigePantsV3,
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.shoesId,
    type: "shoes",
    bodyPreset: "female",
    name: "Cream Flats",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.shoes,
    asset: roomAvatarLayerAssets.shoesFemaleDefaultV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.shoesFemaleDefaultV2.walkingFront,
      roomAvatarMotionLayerAssets.shoesFemaleDefaultV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.shoesId,
    type: "shoes",
    bodyPreset: "male",
    name: "White Sneakers",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.shoes,
    asset: roomAvatarLayerAssets.shoesMaleWhiteV3,
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_FEMALE.topId!,
    type: "top",
    bodyPreset: "female",
    name: "Blush Date Dress",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleDefaultV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.topFemaleDefaultV2.walkingFront,
      roomAvatarMotionLayerAssets.topFemaleDefaultV2.sittingFront
    ),
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.topInnerId!,
    type: "topInner",
    bodyPreset: "male",
    name: "White Tee",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.topInner,
    asset: roomAvatarLayerAssets.topMaleInnerWhiteTshirtV3,
    isDefault: true
  },
  {
    id: DEFAULT_ROOM_AVATAR_MALE.topOuterId!,
    type: "topOuter",
    bodyPreset: "male",
    name: "Blue Overshirt",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.topOuter,
    asset: roomAvatarLayerAssets.topMaleOuterBlueShirtV3,
    isDefault: true
  },
  {
    id: "room_avatar_accessory_heart_pin_v1",
    type: "accessory",
    name: "Heart Pin",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.accessory,
    asset: roomAvatarLayerAssets.accessoryDefaultV1
  },
  // Mapping Coverage v1 — new female wardrobe layers
  {
    id: "room_avatar_hair_female_plum_crop_front_v2",
    type: "hairFront",
    bodyPreset: "female",
    name: "Plum Crop",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.hairFront,
    asset: roomAvatarLayerAssets.hairFemalePlumCropFrontV2
  },
  {
    id: "room_avatar_hair_female_cocoa_wave_front_v2",
    type: "hairFront",
    bodyPreset: "female",
    name: "Cocoa Wave Front",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.hairFront,
    asset: roomAvatarLayerAssets.hairFemaleCocoaWaveFrontV2
  },
  {
    id: "room_avatar_hair_female_cocoa_wave_back_v2",
    type: "hairBack",
    bodyPreset: "female",
    name: "Cocoa Wave Back",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.hairBack,
    asset: roomAvatarLayerAssets.hairFemaleCocoaWaveBackV2
  },
  {
    id: "room_avatar_top_female_cream_knit_v2",
    type: "top",
    bodyPreset: "female",
    name: "Cream Knit",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleCreamKnitV2
  },
  {
    id: "room_avatar_bottom_female_denim_straight_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "Denim Straight",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemaleDenimStraightV2
  },
  {
    id: "room_avatar_shoes_female_cream_sneakers_v2",
    type: "shoes",
    bodyPreset: "female",
    name: "Cream Sneakers",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.shoes,
    asset: roomAvatarLayerAssets.shoesFemalesCreamSneakersV2
  },
  // Motion v1 integration — approved female wardrobe/runtime items
  {
    id: "room_avatar_top_female_cream_basic_tee_v2",
    type: "top",
    bodyPreset: "female",
    name: "Cream Basic Tee",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleCreamBasicTeeV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.topFemaleCreamBasicTeeV2.walkingFront,
      roomAvatarMotionLayerAssets.topFemaleCreamBasicTeeV2.sittingFront
    )
  },
  {
    id: "room_avatar_bottom_female_denim_skort_shorts_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "Denim Skort Shorts",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemaleDenimSkortShortsV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemaleDenimSkortShortsV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemaleDenimSkortShortsV2.sittingFront
    )
  },
  {
    id: "room_avatar_shoes_female_white_sneakers_v2",
    type: "shoes",
    bodyPreset: "female",
    name: "White Sneakers",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.shoes,
    asset: roomAvatarLayerAssets.shoesFemaleWhiteSneakersV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.shoesFemaleWhiteSneakersV2.walkingFront,
      roomAvatarMotionLayerAssets.shoesFemaleWhiteSneakersV2.sittingFront
    )
  },
  {
    id: "room_avatar_top_female_lilac_offshoulder_bow_blouse_v2",
    type: "top",
    bodyPreset: "female",
    name: "Lilac Bow Blouse",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleLilacOffshoulderBowBlouseV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.topFemaleLilacOffshoulderBowBlouseV2.walkingFront,
      roomAvatarMotionLayerAssets.topFemaleLilacOffshoulderBowBlouseV2.sittingFront
    )
  },
  {
    id: "room_avatar_bottom_female_floral_embroidered_skort_shorts_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "Floral Embroidered Skort",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemaleFloralEmbroideredSkortShortsV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemaleFloralEmbroideredSkortShortsV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemaleFloralEmbroideredSkortShortsV2.sittingFront
    )
  },
  {
    id: "room_avatar_top_female_silver_sequin_halter_top_v2",
    type: "top",
    bodyPreset: "female",
    name: "Silver Sequin Halter",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleSilverSequinHalterTopV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.topFemaleSilverSequinHalterTopV2.walkingFront,
      roomAvatarMotionLayerAssets.topFemaleSilverSequinHalterTopV2.sittingFront
    )
  },
  {
    id: "room_avatar_bottom_female_pink_embellished_wide_pants_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "Pink Embellished Wide Pants",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemalePinkEmbellishedWidePantsV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemalePinkEmbellishedWidePantsV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemalePinkEmbellishedWidePantsV2.sittingFront
    )
  },
  {
    id: "room_avatar_bottom_female_patchwork_bow_mini_skirt_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "Patchwork Bow Mini Skirt",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemalePatchworkBowMiniSkirtV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemalePatchworkBowMiniSkirtV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemalePatchworkBowMiniSkirtV2.sittingFront
    )
  },
  {
    id: "room_avatar_top_female_silver_lace_ruffle_dress_top_v2",
    type: "top",
    bodyPreset: "female",
    name: "Silver Lace Ruffle Dress Top",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleSilverLaceRuffleDressTopV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.topFemaleSilverLaceRuffleDressTopV2.walkingFront,
      roomAvatarMotionLayerAssets.topFemaleSilverLaceRuffleDressTopV2.sittingFront
    )
  },
  {
    id: "room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "Silver Lace Ruffle Dress Bottom",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemaleSilverLaceRuffleDressBottomV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemaleSilverLaceRuffleDressBottomV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemaleSilverLaceRuffleDressBottomV2.sittingFront
    )
  },
  {
    id: "room_avatar_top_female_red_floral_bikini_top_v2",
    type: "top",
    bodyPreset: "female",
    name: "Red Floral Bikini Top",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.top,
    asset: roomAvatarLayerAssets.topFemaleRedFloralBikiniTopV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.topFemaleRedFloralBikiniTopV2.walkingFront,
      roomAvatarMotionLayerAssets.topFemaleRedFloralBikiniTopV2.sittingFront
    )
  },
  {
    id: "room_avatar_bottom_female_white_embellished_wide_pants_v2",
    type: "bottom",
    bodyPreset: "female",
    name: "White Embellished Wide Pants",
    layerOrder: ROOM_AVATAR_LAYER_ORDER.bottom,
    asset: roomAvatarLayerAssets.bottomFemaleWhiteEmbellishedWidePantsV2,
    assetsByMotion: createExactMotionVariants(
      roomAvatarMotionLayerAssets.bottomFemaleWhiteEmbellishedWidePantsV2.walkingFront,
      roomAvatarMotionLayerAssets.bottomFemaleWhiteEmbellishedWidePantsV2.sittingFront
    )
  }
]

export const ROOM_AVATAR_CATALOG: RoomAvatarCatalogItem[] =
  ROOM_AVATAR_CATALOG_ITEMS.map(withIdleFrontMotionAsset)

function withIdleFrontMotionAsset(
  item: RoomAvatarCatalogItem
): RoomAvatarCatalogItem {
  return {
    ...item,
    assetsByMotion: {
      ...item.assetsByMotion,
      idle: {
        ...item.assetsByMotion?.idle,
        front: item.assetsByMotion?.idle?.front ?? item.asset
      }
    }
  }
}

function createExactMotionVariants(
  walkingFront: RoomV2AvatarMotionAsset,
  sittingFront: RoomV2AvatarMotionAsset
) {
  return {
    walking: {
      front: walkingFront
    },
    sitting: {
      front: sittingFront
    }
  }
}
