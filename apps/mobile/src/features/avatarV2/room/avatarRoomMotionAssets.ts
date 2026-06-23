import {
  roomAvatarAsset,
  roomAvatarAssetSequence
} from "./avatarRoomAssets"

const walkingFrontSequence = (
  prefix: string,
  f01: number,
  f02: number,
  f03: number,
  f04: number
) =>
  roomAvatarAssetSequence([
    roomAvatarAsset(`${prefix}_walking_front_f01`, f01),
    roomAvatarAsset(`${prefix}_walking_front_f02`, f02),
    roomAvatarAsset(`${prefix}_walking_front_f03`, f03),
    roomAvatarAsset(`${prefix}_walking_front_f04`, f04)
  ])

const sittingFrontFrame = (
  prefix: string,
  f01: number
) => roomAvatarAsset(`${prefix}_sitting_front_f01`, f01)

export const roomAvatarMotionLayerAssets = {
  baseFemaleV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_base_female_v2",
      require("../assets/room/motion/room_avatar_base_female_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_base_female_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_base_female_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_base_female_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_base_female_v2",
      require("../assets/room/motion/room_avatar_base_female_v2_sitting_front_f01.png")
    )
  },
  faceFemaleDefaultV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_face_female_default_v2",
      require("../assets/room/motion/room_avatar_face_female_default_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_face_female_default_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_face_female_default_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_face_female_default_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_face_female_default_v2",
      require("../assets/room/motion/room_avatar_face_female_default_v2_sitting_front_f01.png")
    )
  },
  hairFemaleBlondeLongBackV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_hair_female_blonde_long_back_v2",
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_back_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_back_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_back_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_back_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_hair_female_blonde_long_back_v2",
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_back_v2_sitting_front_f01.png")
    )
  },
  hairFemaleBlondeLongFrontV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_hair_female_blonde_long_front_v2",
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_front_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_front_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_front_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_front_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_hair_female_blonde_long_front_v2",
      require("../assets/room/motion/room_avatar_hair_female_blonde_long_front_v2_sitting_front_f01.png")
    )
  },
  topFemaleDefaultV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_top_female_default_v2",
      require("../assets/room/motion/room_avatar_top_female_default_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_top_female_default_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_top_female_default_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_top_female_default_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_top_female_default_v2",
      require("../assets/room/motion/room_avatar_top_female_default_v2_sitting_front_f01.png")
    )
  },
  bottomFemaleDefaultV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_default_v2",
      require("../assets/room/motion/room_avatar_bottom_female_default_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_default_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_default_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_default_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_default_v2",
      require("../assets/room/motion/room_avatar_bottom_female_default_v2_sitting_front_f01.png")
    )
  },
  shoesFemaleDefaultV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_shoes_female_default_v2",
      require("../assets/room/motion/room_avatar_shoes_female_default_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_shoes_female_default_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_shoes_female_default_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_shoes_female_default_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_shoes_female_default_v2",
      require("../assets/room/motion/room_avatar_shoes_female_default_v2_sitting_front_f01.png")
    )
  },
  topFemaleCreamBasicTeeV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_top_female_cream_basic_tee_v2",
      require("../assets/room/motion/room_avatar_top_female_cream_basic_tee_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_top_female_cream_basic_tee_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_top_female_cream_basic_tee_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_top_female_cream_basic_tee_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_top_female_cream_basic_tee_v2",
      require("../assets/room/motion/room_avatar_top_female_cream_basic_tee_v2_sitting_front_f01.png")
    )
  },
  bottomFemaleDenimSkortShortsV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_denim_skort_shorts_v2",
      require("../assets/room/motion/room_avatar_bottom_female_denim_skort_shorts_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_denim_skort_shorts_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_denim_skort_shorts_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_denim_skort_shorts_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_denim_skort_shorts_v2",
      require("../assets/room/motion/room_avatar_bottom_female_denim_skort_shorts_v2_sitting_front_f01.png")
    )
  },
  shoesFemaleWhiteSneakersV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_shoes_female_white_sneakers_v2",
      require("../assets/room/motion/room_avatar_shoes_female_white_sneakers_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_shoes_female_white_sneakers_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_shoes_female_white_sneakers_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_shoes_female_white_sneakers_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_shoes_female_white_sneakers_v2",
      require("../assets/room/motion/room_avatar_shoes_female_white_sneakers_v2_sitting_front_f01.png")
    )
  },
  topFemaleLilacOffshoulderBowBlouseV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_top_female_lilac_offshoulder_bow_blouse_v2",
      require("../assets/room/motion/room_avatar_top_female_lilac_offshoulder_bow_blouse_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_top_female_lilac_offshoulder_bow_blouse_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_top_female_lilac_offshoulder_bow_blouse_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_top_female_lilac_offshoulder_bow_blouse_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_top_female_lilac_offshoulder_bow_blouse_v2",
      require("../assets/room/motion/room_avatar_top_female_lilac_offshoulder_bow_blouse_v2_sitting_front_f01.png")
    )
  },
  bottomFemaleFloralEmbroideredSkortShortsV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_floral_embroidered_skort_shorts_v2",
      require("../assets/room/motion/room_avatar_bottom_female_floral_embroidered_skort_shorts_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_floral_embroidered_skort_shorts_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_floral_embroidered_skort_shorts_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_floral_embroidered_skort_shorts_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_floral_embroidered_skort_shorts_v2",
      require("../assets/room/motion/room_avatar_bottom_female_floral_embroidered_skort_shorts_v2_sitting_front_f01.png")
    )
  },
  topFemaleSilverSequinHalterTopV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_top_female_silver_sequin_halter_top_v2",
      require("../assets/room/motion/room_avatar_top_female_silver_sequin_halter_top_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_top_female_silver_sequin_halter_top_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_top_female_silver_sequin_halter_top_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_top_female_silver_sequin_halter_top_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_top_female_silver_sequin_halter_top_v2",
      require("../assets/room/motion/room_avatar_top_female_silver_sequin_halter_top_v2_sitting_front_f01.png")
    )
  },
  bottomFemalePinkEmbellishedWidePantsV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_pink_embellished_wide_pants_v2",
      require("../assets/room/motion/room_avatar_bottom_female_pink_embellished_wide_pants_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_pink_embellished_wide_pants_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_pink_embellished_wide_pants_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_pink_embellished_wide_pants_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_pink_embellished_wide_pants_v2",
      require("../assets/room/motion/room_avatar_bottom_female_pink_embellished_wide_pants_v2_sitting_front_f01.png")
    )
  },
  bottomFemalePatchworkBowMiniSkirtV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_patchwork_bow_mini_skirt_v2",
      require("../assets/room/motion/room_avatar_bottom_female_patchwork_bow_mini_skirt_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_patchwork_bow_mini_skirt_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_patchwork_bow_mini_skirt_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_patchwork_bow_mini_skirt_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_patchwork_bow_mini_skirt_v2",
      require("../assets/room/motion/room_avatar_bottom_female_patchwork_bow_mini_skirt_v2_sitting_front_f01.png")
    )
  },
  topFemaleSilverLaceRuffleDressTopV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_top_female_silver_lace_ruffle_dress_top_v2",
      require("../assets/room/motion/room_avatar_top_female_silver_lace_ruffle_dress_top_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_top_female_silver_lace_ruffle_dress_top_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_top_female_silver_lace_ruffle_dress_top_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_top_female_silver_lace_ruffle_dress_top_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_top_female_silver_lace_ruffle_dress_top_v2",
      require("../assets/room/motion/room_avatar_top_female_silver_lace_ruffle_dress_top_v2_sitting_front_f01.png")
    )
  },
  bottomFemaleSilverLaceRuffleDressBottomV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2",
      require("../assets/room/motion/room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2",
      require("../assets/room/motion/room_avatar_bottom_female_silver_lace_ruffle_dress_bottom_v2_sitting_front_f01.png")
    )
  },
  topFemaleRedFloralBikiniTopV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_top_female_red_floral_bikini_top_v2",
      require("../assets/room/motion/room_avatar_top_female_red_floral_bikini_top_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_top_female_red_floral_bikini_top_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_top_female_red_floral_bikini_top_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_top_female_red_floral_bikini_top_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_top_female_red_floral_bikini_top_v2",
      require("../assets/room/motion/room_avatar_top_female_red_floral_bikini_top_v2_sitting_front_f01.png")
    )
  },
  bottomFemaleWhiteEmbellishedWidePantsV2: {
    walkingFront: walkingFrontSequence(
      "room_avatar_bottom_female_white_embellished_wide_pants_v2",
      require("../assets/room/motion/room_avatar_bottom_female_white_embellished_wide_pants_v2_walking_front_f01.png"),
      require("../assets/room/motion/room_avatar_bottom_female_white_embellished_wide_pants_v2_walking_front_f02.png"),
      require("../assets/room/motion/room_avatar_bottom_female_white_embellished_wide_pants_v2_walking_front_f03.png"),
      require("../assets/room/motion/room_avatar_bottom_female_white_embellished_wide_pants_v2_walking_front_f04.png")
    ),
    sittingFront: sittingFrontFrame(
      "room_avatar_bottom_female_white_embellished_wide_pants_v2",
      require("../assets/room/motion/room_avatar_bottom_female_white_embellished_wide_pants_v2_sitting_front_f01.png")
    )
  }
} as const
