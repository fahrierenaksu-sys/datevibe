import type { RoomV2AssetRef } from "./roomV2.types"

const image = (
  key: string,
  source: RoomV2AssetRef["source"]
): RoomV2AssetRef => ({
  key,
  source
})

// DateVibe Room World Kit v1 contract: close mobile 2D/2.5D room stage,
// warm pastel palette, medium-soft outlines, shared contact shadows, and
// bottom-center anchors for floor furniture/avatar placement. These are
// coherent foundation placeholders for world-feel validation, not final
// production art. Future production shells should separate purchasable decor
// from architecture.
// RoomV2 runtime furniture assets should be tight-bound transparent PNGs so
// anchor/width/height placement stays honest. MiniRoom full-canvas prop reuse
// is legacy/temporary only and should not be used for editor/drag work.
export const roomV2Assets = {
  shells: {
    datevibeWorldShellV1: image(
      "room_v2_shell_datevibe_world_v1",
      require("./assets/runtime/room_shell_datevibe_world_v1.png")
    ),
    datevibeEmptyFoundationV4: image(
      "room_v2_shell_datevibe_empty_foundation_v4",
      require("./assets/runtime/room_shell_datevibe_empty_foundation_v4.png")
    ),
    datevibeEmptyFoundationV3: image(
      "room_v2_shell_datevibe_empty_foundation_v3",
      require("./assets/runtime/room_shell_datevibe_empty_foundation_v3.png")
    ),
    datevibeEmptyFoundationV2: image(
      "room_v2_shell_datevibe_empty_foundation_v2",
      require("./assets/runtime/room_shell_datevibe_empty_foundation_v2.png")
    ),
    datevibeEmptyFoundationV1: image(
      "room_v2_shell_datevibe_empty_foundation_v1",
      require("./assets/runtime/room_shell_datevibe_empty_foundation_v1.png")
    ),
    emptyBlushFoundationPlaceholder: image(
      "room_v2_shell_empty_blush_foundation_placeholder",
      require("./assets/runtime/room_shell_empty_blush_foundation_placeholder.png")
    )
  },
  furniture: {
    datevibeWorldChairV1: image(
      "room_v2_furniture_world_chair_v1",
      require("./assets/runtime/furniture_world_chair_v1.png")
    ),
    datevibeWorldTableV1: image(
      "room_v2_furniture_world_table_v1",
      require("./assets/runtime/furniture_world_table_v1.png")
    ),
    datevibeWorldDecorV1: image(
      "room_v2_furniture_world_decor_v1",
      require("./assets/runtime/furniture_world_decor_v1.png")
    ),
    datevibeCozyBedV1: image(
      "room_v2_furniture_cozy_bed_v1",
      require("./assets/runtime/furniture_cozy_bed_v1.png")
    ),
    datevibeBookshelfV1: image(
      "room_v2_furniture_bookshelf_v1",
      require("./assets/runtime/furniture_bookshelf_v1.png")
    ),
    datevibeHeartRugV1: image(
      "room_v2_furniture_heart_rug_v1",
      require("./assets/runtime/furniture_heart_rug_v1.png")
    ),
    datevibeSideTableV1: image(
      "room_v2_furniture_side_table_v1",
      require("./assets/runtime/furniture_side_table_v1.png")
    ),
    blushChair: image(
      "room_v2_furniture_blush_chair",
      require("./assets/runtime/furniture_chair_blush.png")
    ),
    roundTable: image(
      "room_v2_furniture_round_table",
      require("./assets/runtime/furniture_table_round.png")
    ),
    heartLamp: image(
      "room_v2_furniture_heart_lamp",
      require("./assets/runtime/furniture_lamp_heart.png")
    )
  },
  avatars: {
    datevibeRoomAvatarV1: image(
      "room_v2_avatar_datevibe_room_v1",
      require("./assets/runtime/avatar_room_datevibe_v1.png")
    )
  }
} as const
