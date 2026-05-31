import type { RoomV2AssetRef } from "../../roomV2/roomV2.types"

// Room avatar v1 assets use one 256x384 transparent canvas, one centerline,
// and one shared feet baseline so clothing layers can stack without offsets.
const roomAvatarAsset = (
  key: string,
  source: RoomV2AssetRef["source"]
): RoomV2AssetRef => ({
  key,
  source
})

export const roomAvatarLayerAssets = {
  baseFemaleV2: roomAvatarAsset(
    "avatar_room_base_female_v2",
    require("../assets/room/avatar_room_base_female_v2.png")
  ),
  baseMaleV2: roomAvatarAsset(
    "avatar_room_base_male_v2",
    require("../assets/room/avatar_room_base_male_v2.png")
  ),
  faceFemaleDefaultV2: roomAvatarAsset(
    "avatar_room_face_female_default_v2",
    require("../assets/room/avatar_room_face_female_default_v2.png")
  ),
  faceMaleDefaultV2: roomAvatarAsset(
    "avatar_room_face_male_default_v2",
    require("../assets/room/avatar_room_face_male_default_v2.png")
  ),
  hairFemaleBlondeLongBackV2: roomAvatarAsset(
    "avatar_room_hair_female_blonde_long_back_v2",
    require("../assets/room/avatar_room_hair_female_blonde_long_back_v2.png")
  ),
  hairFemaleBlondeLongFrontV2: roomAvatarAsset(
    "avatar_room_hair_female_blonde_long_front_v2",
    require("../assets/room/avatar_room_hair_female_blonde_long_front_v2.png")
  ),
  hairMaleDefaultV2: roomAvatarAsset(
    "avatar_room_hair_male_default_v2",
    require("../assets/room/avatar_room_hair_male_default_v2.png")
  ),
  baseMaleV3: roomAvatarAsset(
    "avatar_room_base_male_v3",
    require("../assets/room/avatar_room_base_male_v3.png")
  ),
  faceMaleDefaultV3: roomAvatarAsset(
    "avatar_room_face_male_default_v3",
    require("../assets/room/avatar_room_face_male_default_v3.png")
  ),
  hairMaleBrownDefaultV3: roomAvatarAsset(
    "avatar_room_hair_male_brown_default_v3",
    require("../assets/room/avatar_room_hair_male_brown_default_v3.png")
  ),
  topMaleInnerWhiteTshirtV3: roomAvatarAsset(
    "avatar_room_top_male_inner_white_tshirt_v3",
    require("../assets/room/avatar_room_top_male_inner_white_tshirt_v3.png")
  ),
  topMaleOuterBlueShirtV3: roomAvatarAsset(
    "avatar_room_top_male_outer_blue_shirt_v3",
    require("../assets/room/avatar_room_top_male_outer_blue_shirt_v3.png")
  ),
  bottomMaleBeigePantsV3: roomAvatarAsset(
    "avatar_room_bottom_male_beige_pants_v3",
    require("../assets/room/avatar_room_bottom_male_beige_pants_v3.png")
  ),
  shoesMaleWhiteV3: roomAvatarAsset(
    "avatar_room_shoes_male_white_v3",
    require("../assets/room/avatar_room_shoes_male_white_v3.png")
  ),
  topFemaleDefaultV2: roomAvatarAsset(
    "avatar_room_top_female_default_v2",
    require("../assets/room/avatar_room_top_female_default_v2.png")
  ),
  topMaleDefaultV2: roomAvatarAsset(
    "avatar_room_top_male_default_v2",
    require("../assets/room/avatar_room_top_male_default_v2.png")
  ),
  bottomFemaleDefaultV2: roomAvatarAsset(
    "avatar_room_bottom_female_default_v2",
    require("../assets/room/avatar_room_bottom_female_default_v2.png")
  ),
  bottomMaleDefaultV2: roomAvatarAsset(
    "avatar_room_bottom_male_default_v2",
    require("../assets/room/avatar_room_bottom_male_default_v2.png")
  ),
  shoesFemaleDefaultV2: roomAvatarAsset(
    "avatar_room_shoes_female_default_v2",
    require("../assets/room/avatar_room_shoes_female_default_v2.png")
  ),
  shoesMaleDefaultV2: roomAvatarAsset(
    "avatar_room_shoes_male_default_v2",
    require("../assets/room/avatar_room_shoes_male_default_v2.png")
  ),
  baseFemaleV1: roomAvatarAsset(
    "avatar_room_base_female_v1",
    require("../assets/room/avatar_room_base_female_v1.png")
  ),
  baseMaleV1: roomAvatarAsset(
    "avatar_room_base_male_v1",
    require("../assets/room/avatar_room_base_male_v1.png")
  ),
  faceDefaultV1: roomAvatarAsset(
    "avatar_room_face_default_v1",
    require("../assets/room/avatar_room_face_default_v1.png")
  ),
  faceMaleDefaultV1: roomAvatarAsset(
    "avatar_room_face_male_default_v1",
    require("../assets/room/avatar_room_face_male_default_v1.png")
  ),
  hairFemaleDefaultV1: roomAvatarAsset(
    "avatar_room_hair_female_default_v1",
    require("../assets/room/avatar_room_hair_female_default_v1.png")
  ),
  hairMaleDefaultV1: roomAvatarAsset(
    "avatar_room_hair_male_default_v1",
    require("../assets/room/avatar_room_hair_male_default_v1.png")
  ),
  topFemaleDefaultV1: roomAvatarAsset(
    "avatar_room_top_female_default_v1",
    require("../assets/room/avatar_room_top_female_default_v1.png")
  ),
  topMaleDefaultV1: roomAvatarAsset(
    "avatar_room_top_male_default_v1",
    require("../assets/room/avatar_room_top_male_default_v1.png")
  ),
  bottomFemaleDefaultV1: roomAvatarAsset(
    "avatar_room_bottom_female_default_v1",
    require("../assets/room/avatar_room_bottom_female_default_v1.png")
  ),
  bottomMaleDefaultV1: roomAvatarAsset(
    "avatar_room_bottom_male_default_v1",
    require("../assets/room/avatar_room_bottom_male_default_v1.png")
  ),
  shoesFemaleDefaultV1: roomAvatarAsset(
    "avatar_room_shoes_female_default_v1",
    require("../assets/room/avatar_room_shoes_female_default_v1.png")
  ),
  shoesMaleDefaultV1: roomAvatarAsset(
    "avatar_room_shoes_male_default_v1",
    require("../assets/room/avatar_room_shoes_male_default_v1.png")
  ),
  accessoryDefaultV1: roomAvatarAsset(
    "avatar_room_accessory_default_v1",
    require("../assets/room/avatar_room_accessory_default_v1.png")
  ),
  // Mapping Coverage v1 — new female hair/clothing layers
  hairFemalePlumCropFrontV2: roomAvatarAsset(
    "avatar_room_hair_female_plum_crop_front_v2",
    require("../assets/room/avatar_room_hair_female_plum_crop_front_v2.png")
  ),
  hairFemaleCocoaWaveFrontV2: roomAvatarAsset(
    "avatar_room_hair_female_cocoa_wave_front_v2",
    require("../assets/room/avatar_room_hair_female_cocoa_wave_front_v2.png")
  ),
  hairFemaleCocoaWaveBackV2: roomAvatarAsset(
    "avatar_room_hair_female_cocoa_wave_back_v2",
    require("../assets/room/avatar_room_hair_female_cocoa_wave_back_v2.png")
  ),
  topFemaleCreamKnitV2: roomAvatarAsset(
    "avatar_room_top_female_cream_knit_v2",
    require("../assets/room/avatar_room_top_female_cream_knit_v2.png")
  ),
  bottomFemaleDenimStraightV2: roomAvatarAsset(
    "avatar_room_bottom_female_denim_straight_v2",
    require("../assets/room/avatar_room_bottom_female_denim_straight_v2.png")
  ),
  shoesFemalesCreamSneakersV2: roomAvatarAsset(
    "avatar_room_shoes_female_cream_sneakers_v2",
    require("../assets/room/avatar_room_shoes_female_cream_sneakers_v2.png")
  )
} as const
