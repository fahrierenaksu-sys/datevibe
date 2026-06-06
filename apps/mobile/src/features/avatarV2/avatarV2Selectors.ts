import {
  AVATAR_V2_CATALOG,
  AVATAR_V2_LAYER_ORDER,
  DEFAULT_AVATAR_V2
} from "./avatarV2.mock"
import type {
  AvatarAnimationState,
  AvatarCatalogItem,
  AvatarInventory,
  AvatarItemType,
  ResolvedAvatarLayer,
  UserAvatar
} from "./avatarV2.types"

type RequiredAvatarItemType = Exclude<AvatarItemType, "accessory">

const REQUIRED_TYPES: RequiredAvatarItemType[] = [
  "body",
  "face",
  "hair",
  "top",
  "bottom",
  "shoes"
]

export function getAvatarV2ItemsByType(
  catalog: AvatarCatalogItem[],
  type: AvatarItemType
): AvatarCatalogItem[] {
  return catalog
    .filter((item) => item.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function isAvatarV2ItemOwned(
  inventory: AvatarInventory,
  item: AvatarCatalogItem
): boolean {
  return item.ownedByDefault === true || inventory.ownedItemIds.includes(item.id)
}

export function canEquipAvatarV2Item(
  inventory: AvatarInventory,
  item: AvatarCatalogItem
): boolean {
  // Inventory is the ownership source-of-truth. Items can be merchandised as
  // locked in the catalog, but become equipable once inventory owns them.
  return isAvatarV2ItemOwned(inventory, item)
}

export function isAvatarV2ItemEquipped(
  avatar: UserAvatar,
  item: AvatarCatalogItem
): boolean {
  if (item.type === "accessory") return avatar.accessoryIds.includes(item.id)
  return getEquippedIdForType(avatar, item.type) === item.id
}

export function equipAvatarV2Item(
  avatar: UserAvatar,
  item: AvatarCatalogItem
): UserAvatar {
  if (item.type === "accessory") {
    // First slice behavior is single accessory toggle. The model remains an
    // array so future multi-accessory stacking does not need a shape change.
    const accessoryIds = avatar.accessoryIds.includes(item.id)
      ? avatar.accessoryIds.filter((id) => id !== item.id)
      : [item.id]
    return { ...avatar, accessoryIds }
  }
  return setEquippedIdForType(avatar, item.type, item.id)
}

export function resolveAvatarV2(
  avatar: Partial<UserAvatar> | undefined,
  catalog: AvatarCatalogItem[] = AVATAR_V2_CATALOG
): UserAvatar {
  const input = avatar ?? {}
  return {
    bodyId: resolveRequiredItem("body", input.bodyId, catalog)?.id ?? getDefaultIdForType("body"),
    faceId: resolveRequiredItem("face", input.faceId, catalog)?.id ?? getDefaultIdForType("face"),
    hairId: resolveRequiredItem("hair", input.hairId, catalog)?.id ?? getDefaultIdForType("hair"),
    topId: resolveRequiredItem("top", input.topId, catalog)?.id ?? getDefaultIdForType("top"),
    bottomId: resolveRequiredItem("bottom", input.bottomId, catalog)?.id ?? getDefaultIdForType("bottom"),
    shoesId: resolveRequiredItem("shoes", input.shoesId, catalog)?.id ?? getDefaultIdForType("shoes"),
    accessoryIds: (input.accessoryIds ?? []).filter((id) =>
      catalog.some((item) => item.id === id && item.type === "accessory")
    )
  }
}

export function getAvatarV2RenderLayers(input: {
  avatar: Partial<UserAvatar> | undefined
  catalog?: AvatarCatalogItem[]
  animationState?: AvatarAnimationState
}): ResolvedAvatarLayer[] {
  const catalog = input.catalog ?? AVATAR_V2_CATALOG
  const animationState = input.animationState ?? "idle_front"
  const avatar = resolveAvatarV2(input.avatar, catalog)
  const requiredLayers = REQUIRED_TYPES.flatMap((type): ResolvedAvatarLayer[] => {
    const item = resolveRequiredItemWithAsset(
      type,
      getEquippedIdForType(avatar, type),
      catalog,
      animationState
    )
    if (!item) return []
    return [item]
  })

  const accessoryLayers = avatar.accessoryIds.flatMap((id): ResolvedAvatarLayer[] => {
    const item = catalog.find((entry) => entry.id === id && entry.type === "accessory")
    const asset = item?.assets[animationState] ?? item?.assets.idle_front
    if (!item || !asset) return []
    return [{
      id: item.id,
      type: item.type,
      layerOrder: item.layerOrder,
      asset
    }]
  })

  return [...requiredLayers, ...accessoryLayers]
    .sort((a, b) => a.layerOrder - b.layerOrder)
}

function resolveRequiredItem(
  type: RequiredAvatarItemType,
  id: string | undefined,
  catalog: AvatarCatalogItem[]
): AvatarCatalogItem | undefined {
  const providedSelected = id
    ? catalog.find((item) => item.id === id && item.type === type)
    : undefined
  if (providedSelected) return providedSelected

  const providedDefault = getDefaultItemForType(catalog, type)
  if (providedDefault) return providedDefault

  const builtInSelected = id
    ? AVATAR_V2_CATALOG.find((item) => item.id === id && item.type === type)
    : undefined
  return builtInSelected ?? getDefaultItemForType(AVATAR_V2_CATALOG, type)
}

function resolveRequiredItemWithAsset(
  type: RequiredAvatarItemType,
  id: string | undefined,
  catalog: AvatarCatalogItem[],
  animationState: AvatarAnimationState
): ResolvedAvatarLayer | undefined {
  const selectedItem = resolveRequiredItem(type, id, catalog)
  const selectedAsset = selectedItem?.assets[animationState] ?? selectedItem?.assets.idle_front
  if (selectedItem && selectedAsset) {
    return {
      id: selectedItem.id,
      type: selectedItem.type,
      layerOrder: selectedItem.layerOrder,
      asset: selectedAsset
    }
  }

  const defaultItem = getDefaultItemForType(catalog, type)
    ?? getDefaultItemForType(AVATAR_V2_CATALOG, type)
  const defaultAsset = defaultItem?.assets[animationState] ?? defaultItem?.assets.idle_front
  if (!defaultItem || !defaultAsset) return undefined
  return {
    id: defaultItem.id,
    type: defaultItem.type,
    layerOrder: defaultItem.layerOrder,
    asset: defaultAsset
  }
}

function getDefaultItemForType(
  catalog: AvatarCatalogItem[],
  type: RequiredAvatarItemType
): AvatarCatalogItem | undefined {
  return catalog.find((item) => item.type === type && item.isDefault)
    ?? catalog.find((item) => item.type === type)
}

function getEquippedIdForType(
  avatar: UserAvatar,
  type: AvatarItemType
): string | undefined {
  switch (type) {
    case "body":
      return avatar.bodyId
    case "face":
      return avatar.faceId
    case "hair":
      return avatar.hairId
    case "top":
      return avatar.topId
    case "bottom":
      return avatar.bottomId
    case "shoes":
      return avatar.shoesId
    case "accessory":
      return avatar.accessoryIds[0]
  }
}

function setEquippedIdForType(
  avatar: UserAvatar,
  type: AvatarItemType,
  id: string
): UserAvatar {
  switch (type) {
    case "body":
      return { ...avatar, bodyId: id }
    case "face":
      return { ...avatar, faceId: id }
    case "hair":
      return { ...avatar, hairId: id }
    case "top":
      return { ...avatar, topId: id }
    case "bottom":
      return { ...avatar, bottomId: id }
    case "shoes":
      return { ...avatar, shoesId: id }
    case "accessory":
      return avatar
  }
}

function getDefaultIdForType(
  type: RequiredAvatarItemType
): string {
  switch (type) {
    case "body":
      return DEFAULT_AVATAR_V2.bodyId
    case "face":
      return DEFAULT_AVATAR_V2.faceId
    case "hair":
      return DEFAULT_AVATAR_V2.hairId
    case "top":
      return DEFAULT_AVATAR_V2.topId
    case "bottom":
      return DEFAULT_AVATAR_V2.bottomId
    case "shoes":
      return DEFAULT_AVATAR_V2.shoesId
  }
}

export function getAvatarV2LayerOrder(type: AvatarItemType): number {
  return AVATAR_V2_LAYER_ORDER[type]
}

export function getRequiredAvatarV2Types(): AvatarItemType[] {
  return [...REQUIRED_TYPES]
}
