import {
  AVATAR_V2_CATALOG
} from "../avatarV2.mock"
import { resolveAvatarV2 } from "../avatarV2Selectors"
import type {
  AvatarCatalogItem,
  UserAvatar
} from "../avatarV2.types"
import {
  DEFAULT_ROOM_AVATAR_FEMALE,
  ROOM_AVATAR_CATALOG
} from "./avatarRoom.mock"
import { resolveRoomAvatarAppearance } from "./avatarRoomSelectors"
import type {
  RoomAvatarAppearance,
  RoomAvatarCatalogItem
} from "./avatarRoom.types"

export type AvatarRoomProjectionMap = Record<
  string,
  Partial<RoomAvatarAppearance>
>

export interface ProjectAvatarV2ToRoomAvatarAppearanceInput {
  avatar?: Partial<UserAvatar>
  avatarCatalog?: AvatarCatalogItem[]
  roomAvatarCatalog?: RoomAvatarCatalogItem[]
  projectionMap?: AvatarRoomProjectionMap
}

export interface ProjectedRoomAvatarAppearance {
  appearance: RoomAvatarAppearance
  unmappedItemIds: string[]
}

// Keep this deliberately conservative. Only map profile-scale AvatarV2 items
// when the current room-scale layer is a believable visual equivalent.
export const DEFAULT_AVATAR_ROOM_PROJECTION_MAP: AvatarRoomProjectionMap = {
  avatar_v2_body_default: {
    bodyPreset: "female"
  },
  avatar_v2_face_default: {
    faceId: DEFAULT_ROOM_AVATAR_FEMALE.faceId
  },
  avatar_v2_top_blush: {
    topId: DEFAULT_ROOM_AVATAR_FEMALE.topId
  },
  avatar_v2_bottom_lilac: {
    bottomId: DEFAULT_ROOM_AVATAR_FEMALE.bottomId
  },
  avatar_v2_shoes_rose: {
    shoesId: DEFAULT_ROOM_AVATAR_FEMALE.shoesId
  },
  // Mapping Coverage v1 — default wardrobe items
  avatar_v2_hair_default: {
    hairFrontId: "room_avatar_hair_female_plum_crop_front_v2",
    hairBackId: ""
  },
  avatar_v2_hair_wave: {
    hairFrontId: "room_avatar_hair_female_cocoa_wave_front_v2",
    hairBackId: "room_avatar_hair_female_cocoa_wave_back_v2"
  },
  avatar_v2_top_default: {
    topId: "room_avatar_top_female_cream_knit_v2"
  },
  avatar_v2_bottom_default: {
    bottomId: "room_avatar_bottom_female_denim_straight_v2"
  },
  avatar_v2_shoes_default: {
    shoesId: "room_avatar_shoes_female_cream_sneakers_v2"
  }
}

export function projectAvatarV2ToRoomAvatarAppearance(
  input: ProjectAvatarV2ToRoomAvatarAppearanceInput
): ProjectedRoomAvatarAppearance {
  const avatarCatalog = input.avatarCatalog ?? AVATAR_V2_CATALOG
  const roomAvatarCatalog = input.roomAvatarCatalog ?? ROOM_AVATAR_CATALOG
  const projectionMap = input.projectionMap ?? DEFAULT_AVATAR_ROOM_PROJECTION_MAP
  const avatar = resolveAvatarV2(input.avatar, avatarCatalog)

  const appearancePatch: Partial<RoomAvatarAppearance> = {
    bodyPreset: "female",
    accessoryIds: []
  }
  const unmappedItemIds = new Set<string>()

  for (const itemId of getEquippedAvatarV2ItemIds(avatar)) {
    if (itemId === "") continue // Skip mapping empty strings, handle them explicitly below
    const projection = projectionMap[itemId]
    if (!projection) {
      unmappedItemIds.add(itemId)
      continue
    }
    mergeRoomAvatarAppearancePatch(appearancePatch, projection)
  }

  // Explicitly propagate unequipped slots as empty strings
  if (avatar.topId === "") appearancePatch.topId = ""
  if (avatar.bottomId === "") appearancePatch.bottomId = ""
  if (avatar.shoesId === "") appearancePatch.shoesId = ""
  if (avatar.hairId === "") {
    appearancePatch.hairFrontId = ""
    appearancePatch.hairBackId = ""
  }

  return {
    appearance: resolveRoomAvatarAppearance(appearancePatch, roomAvatarCatalog),
    unmappedItemIds: [...unmappedItemIds].sort()
  }
}

function getEquippedAvatarV2ItemIds(avatar: UserAvatar): string[] {
  return [
    avatar.bodyId,
    avatar.faceId,
    avatar.hairId,
    avatar.topId,
    avatar.bottomId,
    avatar.shoesId,
    ...avatar.accessoryIds
  ].filter(Boolean) // Filter out empty strings from the mapping phase
}

function mergeRoomAvatarAppearancePatch(
  target: Partial<RoomAvatarAppearance>,
  patch: Partial<RoomAvatarAppearance>
): void {
  if (patch.bodyPreset) target.bodyPreset = patch.bodyPreset
  // Use `in` instead of truthiness so that explicit empty strings ("clear layer") propagate
  if ("hairBackId" in patch) target.hairBackId = patch.hairBackId
  if ("hairFrontId" in patch) target.hairFrontId = patch.hairFrontId
  if ("baseId" in patch) target.baseId = patch.baseId
  if ("faceId" in patch) target.faceId = patch.faceId
  if ("hairId" in patch) target.hairId = patch.hairId
  if ("topInnerId" in patch) target.topInnerId = patch.topInnerId
  if ("topId" in patch) target.topId = patch.topId
  if ("topOuterId" in patch) target.topOuterId = patch.topOuterId
  if ("bottomId" in patch) target.bottomId = patch.bottomId
  if ("shoesId" in patch) target.shoesId = patch.shoesId
  if (patch.accessoryIds) {
    target.accessoryIds = [
      ...(target.accessoryIds ?? []),
      ...patch.accessoryIds
    ].filter((id, index, ids) => ids.indexOf(id) === index)
  }
}
