import type { ImageSourcePropType } from "react-native"

const image = (asset: ImageSourcePropType): ImageSourcePropType => asset

export const miniRoomAssets = {
  rooms: {
    cozyPinkBedroom: image(require("../assets/runtime/rooms/cozy_pink_bedroom/room_bg.png"))
  },
  avatars: {
    localGirl: image(require("../assets/runtime/avatars/avatar_girl_fullbody.png")),
    partnerBoy: image(require("../assets/runtime/avatars/avatar_boy_fullbody.png"))
  },
  props: {
    pinkBed: image(require("../assets/runtime/props/prop_pink_bed.png")),
    pinkSofa: image(require("../assets/runtime/props/prop_pink_sofa.png")),
    pinkChairRound: image(require("../assets/runtime/props/prop_pink_chair_round.png")),
    pinkChairThree: image(require("../assets/runtime/props/prop_pink_chair_3.png")),
    miniTable: image(require("../assets/runtime/props/prop_mini_table.png")),
    notebookTable: image(require("../assets/runtime/props/prop_notebook_table.png")),
    heartLamp: image(require("../assets/runtime/props/prop_heart_lamp.png")),
    hangingPlant: image(require("../assets/runtime/props/prop_hanging_plant.png"))
  },
  ui: {
    speechEmoteSheet: image(require("../assets/runtime/ui/speech_emote_sheet.png")),
    generatedAvatarSheetReference: image(require("../assets/runtime/ui/generated_avatar_sheet_reference.png"))
  }
} as const
