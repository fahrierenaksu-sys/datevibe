import {
  DEFAULT_ROOM_AVATAR_FEMALE,
  DEFAULT_ROOM_AVATAR_MALE,
  ROOM_AVATAR_CATALOG
} from "./avatarRoom.mock"
import type {
  CreateRoomAvatarRenderItemInput,
  ResolvedRoomAvatarLayer,
  RoomAvatarAppearance,
  RoomAvatarBodyPreset,
  RoomAvatarCatalogItem,
  RoomAvatarLayerType
} from "./avatarRoom.types"
import { DEFAULT_ROOM_V2_ANCHOR } from "../../roomV2/roomV2Selectors"
import type { RoomV2AvatarRenderItem } from "../../roomV2/roomV2.types"

type RequiredRoomAvatarLayerType =
  Exclude<RoomAvatarLayerType, "accessory">

const REQUIRED_LAYER_TYPES: RequiredRoomAvatarLayerType[] = [
  "hairBack",
  "base",
  "face",
  "hair",
  "bottom",
  "shoes",
  "topInner",
  "top",
  "topOuter",
  "hairFront"
]

const OPTIONAL_LAYER_TYPES = new Set<RequiredRoomAvatarLayerType>([
  "hairBack",
  "hair",
  "topInner",
  "top",
  "topOuter",
  "bottom",
  "shoes",
  "hairFront"
])

export function resolveRoomAvatarAppearance(
  appearance: Partial<RoomAvatarAppearance> | undefined,
  catalog: RoomAvatarCatalogItem[] = ROOM_AVATAR_CATALOG
): RoomAvatarAppearance {
  const bodyPreset = appearance?.bodyPreset ?? "female"
  const defaults = getDefaultAppearanceForPreset(bodyPreset)

  return {
    bodyPreset,
    // For hair layers, distinguish "not provided" (fall back to default)
    // from "explicitly cleared" (e.g. hairBackId: "" for short styles).
    // This prevents re-resolve from restoring a stale default behind
    // a short hairstyle that intentionally omits hairBack.
    hairBackId: resolveOptionalRoomAvatarItem(
      "hairBack",
      appearance && "hairBackId" in appearance
        ? appearance.hairBackId
        : defaults.hairBackId,
      bodyPreset,
      catalog
    )?.id,
    hairFrontId: resolveOptionalRoomAvatarItem(
      "hairFront",
      appearance && "hairFrontId" in appearance
        ? appearance.hairFrontId
        : defaults.hairFrontId,
      bodyPreset,
      catalog
    )?.id,
    baseId: resolveRequiredRoomAvatarItem(
      "base",
      appearance?.baseId ?? defaults.baseId,
      bodyPreset,
      catalog
    )?.id ?? defaults.baseId,
    faceId: resolveRequiredRoomAvatarItem(
      "face",
      appearance?.faceId ?? defaults.faceId,
      bodyPreset,
      catalog
    )?.id ?? defaults.faceId,
    hairId: resolveRequiredRoomAvatarItem(
      "hair",
      appearance?.hairId ?? defaults.hairId,
      bodyPreset,
      catalog
    )?.id ?? defaults.hairId,
    topInnerId: resolveOptionalRoomAvatarItem(
      "topInner",
      appearance?.topInnerId ?? defaults.topInnerId,
      bodyPreset,
      catalog
    )?.id,
    topId: resolveOptionalRoomAvatarItem(
      "top",
      appearance && "topId" in appearance
        ? appearance.topId
        : defaults.topId,
      bodyPreset,
      catalog
    )?.id,
    topOuterId: resolveOptionalRoomAvatarItem(
      "topOuter",
      appearance?.topOuterId ?? defaults.topOuterId,
      bodyPreset,
      catalog
    )?.id,
    bottomId: resolveOptionalRoomAvatarItem(
      "bottom",
      appearance && "bottomId" in appearance
        ? appearance.bottomId
        : defaults.bottomId,
      bodyPreset,
      catalog
    )?.id ?? defaults.bottomId,
    shoesId: resolveOptionalRoomAvatarItem(
      "shoes",
      appearance && "shoesId" in appearance
        ? appearance.shoesId
        : defaults.shoesId,
      bodyPreset,
      catalog
    )?.id ?? defaults.shoesId,
    accessoryIds: (appearance?.accessoryIds ?? []).filter((id) =>
      catalog.some((item) => item.id === id && item.type === "accessory")
    )
  }
}

export function getRoomAvatarRenderLayers(input: {
  appearance?: Partial<RoomAvatarAppearance>
  catalog?: RoomAvatarCatalogItem[]
}): ResolvedRoomAvatarLayer[] {
  const catalog = input.catalog ?? ROOM_AVATAR_CATALOG
  const appearance = resolveRoomAvatarAppearance(input.appearance, catalog)
  const requiredLayers = REQUIRED_LAYER_TYPES.flatMap((type): ResolvedRoomAvatarLayer[] => {
    const id = getEquippedRoomAvatarIdForType(appearance, type)
    if (!id && OPTIONAL_LAYER_TYPES.has(type)) return []
    const item = resolveRequiredRoomAvatarItem(
      type,
      id,
      appearance.bodyPreset,
      catalog
    )
    if (!item) return []
    return [toResolvedLayer(item)]
  })

  const accessoryLayers = appearance.accessoryIds.flatMap((id): ResolvedRoomAvatarLayer[] => {
    const item = catalog.find((entry) => entry.id === id && entry.type === "accessory")
    return item ? [toResolvedLayer(item)] : []
  })

  return [...requiredLayers, ...accessoryLayers]
    .sort((a, b) => a.layerOrder - b.layerOrder)
}

export function createRoomAvatarRenderItem(
  input: CreateRoomAvatarRenderItemInput
): RoomV2AvatarRenderItem {
  const layers = getRoomAvatarRenderLayers({
    appearance: input.appearance,
    catalog: input.catalog
  })

  return {
    renderId: input.renderId ?? `room_v2_avatar_${input.avatarId}`,
    kind: "avatar",
    avatarId: input.avatarId,
    name: input.name,
    layers,
    layer: input.layer ?? "furniture",
    x: input.x,
    y: input.y,
    width: input.width,
    height: input.height,
    anchor: input.anchor ?? DEFAULT_ROOM_V2_ANCHOR,
    depth: input.depth ?? input.y,
    direction: input.direction ?? "front",
    state: input.state ?? "idle",
    chatBubbleAnchor: input.chatBubbleAnchor,
    reactionAnchor: input.reactionAnchor
  }
}

function resolveRequiredRoomAvatarItem(
  type: RequiredRoomAvatarLayerType,
  id: string | undefined,
  bodyPreset: RoomAvatarBodyPreset,
  catalog: RoomAvatarCatalogItem[]
): RoomAvatarCatalogItem | undefined {
  const exact = id
    ? catalog.find((item) =>
      item.id === id &&
      item.type === type &&
      isRoomAvatarItemCompatibleWithPreset(item, bodyPreset)
    )
    : undefined
  if (exact) return exact

  return catalog.find((item) =>
    item.type === type &&
    item.isDefault &&
    isRoomAvatarItemCompatibleWithPreset(item, bodyPreset)
  )
}

function resolveOptionalRoomAvatarItem(
  type: RequiredRoomAvatarLayerType,
  id: string | undefined,
  bodyPreset: RoomAvatarBodyPreset,
  catalog: RoomAvatarCatalogItem[]
): RoomAvatarCatalogItem | undefined {
  if (!id) return undefined
  return catalog.find((item) =>
    item.id === id &&
    item.type === type &&
    isRoomAvatarItemCompatibleWithPreset(item, bodyPreset)
  )
}

function isRoomAvatarItemCompatibleWithPreset(
  item: RoomAvatarCatalogItem,
  bodyPreset: RoomAvatarBodyPreset
): boolean {
  return !item.bodyPreset || item.bodyPreset === bodyPreset
}

function toResolvedLayer(item: RoomAvatarCatalogItem): ResolvedRoomAvatarLayer {
  return {
    id: item.id,
    type: item.type,
    layerOrder: item.layerOrder,
    asset: item.asset
  }
}

function getDefaultAppearanceForPreset(
  bodyPreset: RoomAvatarBodyPreset
): RoomAvatarAppearance {
  return bodyPreset === "male"
    ? DEFAULT_ROOM_AVATAR_MALE
    : DEFAULT_ROOM_AVATAR_FEMALE
}

function getEquippedRoomAvatarIdForType(
  appearance: RoomAvatarAppearance,
  type: RequiredRoomAvatarLayerType
): string | undefined {
  switch (type) {
    case "base":
      return appearance.baseId
    case "hairBack":
      return appearance.hairBackId
    case "face":
      return appearance.faceId
    case "hair":
      return appearance.hairId
    case "hairFront":
      return appearance.hairFrontId
    case "top":
      return appearance.topId
    case "topInner":
      return appearance.topInnerId
    case "topOuter":
      return appearance.topOuterId
    case "bottom":
      return appearance.bottomId
    case "shoes":
      return appearance.shoesId
  }
}
