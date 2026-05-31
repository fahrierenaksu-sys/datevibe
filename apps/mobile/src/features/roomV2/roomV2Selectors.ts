import {
  ROOM_LAYER_ORDER,
  type FurnitureItem,
  type PlacedRoomItem,
  type ResolvedRoomV2Scene,
  type RoomAnchor,
  type RoomFurnitureRotation,
  type RoomLayer,
  type RoomShell,
  type RoomV2AvatarRenderItem,
  type RoomV2AvatarRenderLayer,
  type RoomV2RenderItem,
  type UserRoomDecor
} from "./roomV2.types"

export const DEFAULT_ROOM_V2_ANCHOR: RoomAnchor = { x: 0.5, y: 1 }

export interface ResolveRoomV2SceneInput {
  roomShellCatalog: RoomShell[]
  furnitureCatalog: FurnitureItem[]
  decor: UserRoomDecor
  defaultRoomShellId?: string
}

export function resolveRoomV2Scene(
  input: ResolveRoomV2SceneInput
): ResolvedRoomV2Scene {
  const shell = resolveRoomV2Shell(
    input.roomShellCatalog,
    input.decor.roomShellId,
    input.defaultRoomShellId
  )
  if (!shell) {
    return {
      shell: null,
      renderItems: []
    }
  }

  const furnitureById = new Map(
    input.furnitureCatalog.map((item) => [item.id, item])
  )
  const renderItems = input.decor.placedItems
    .flatMap((placed): RoomV2RenderItem[] => {
      const item = furnitureById.get(placed.itemId)
      if (!item) return []
      return [resolvePlacedFurnitureRenderItem(placed, item)]
    })
    .sort(compareRoomV2RenderItems)

  return {
    shell,
    renderItems
  }
}

export function resolveRoomV2Shell(
  roomShellCatalog: RoomShell[],
  roomShellId: string,
  defaultRoomShellId?: string
): RoomShell | null {
  const requestedShell = roomShellCatalog.find((shell) => shell.id === roomShellId)
  if (requestedShell) return requestedShell

  const defaultShell = defaultRoomShellId
    ? roomShellCatalog.find((shell) => shell.id === defaultRoomShellId)
    : undefined
  return defaultShell ?? roomShellCatalog[0] ?? null
}

export function resolveFurnitureAssetForRotation(
  item: FurnitureItem,
  rotation: RoomFurnitureRotation
): FurnitureItem["asset"] {
  return item.assetsByRotation?.[rotation]
    ?? item.assetsByRotation?.front
    ?? item.asset
}

export function resolvePlacedFurnitureRenderItem(
  placed: PlacedRoomItem,
  item: FurnitureItem
): RoomV2RenderItem {
  const width = placed.width ?? item.width
  const height = placed.height ?? item.height
  return {
    renderId: placed.instanceId,
    kind: "furniture",
    itemId: item.id,
    name: item.name,
    category: item.category,
    layer: item.layer,
    asset: resolveFurnitureAssetForRotation(item, placed.rotation),
    rotation: placed.rotation,
    x: placed.x,
    y: placed.y,
    width,
    height,
    anchor: item.anchor ?? DEFAULT_ROOM_V2_ANCHOR,
    depth: placed.depth ?? placed.y,
    footprint: item.footprint,
    blocksMovement: item.blocksMovement ?? false,
    interactionType: item.interactionType ?? "none",
    seatPoints: item.seatPoints
  }
}

export interface CreateRoomV2AvatarRenderItemInput {
  avatarId: string
  layers: RoomV2AvatarRenderLayer[]
  x: number
  y: number
  width: number
  height: number
  name?: string
  renderId?: string
  layer?: RoomLayer
  depth?: number
  anchor?: RoomAnchor
  direction?: RoomFurnitureRotation
  state?: "idle"
  chatBubbleAnchor?: RoomAnchor
  reactionAnchor?: RoomAnchor
}

export function createRoomV2AvatarRenderItem(
  input: CreateRoomV2AvatarRenderItemInput
): RoomV2AvatarRenderItem {
  return {
    renderId: input.renderId ?? `room_v2_avatar_${input.avatarId}`,
    kind: "avatar",
    avatarId: input.avatarId,
    name: input.name,
    layers: input.layers,
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

export function compareRoomV2RenderItems(
  a: RoomV2RenderItem,
  b: RoomV2RenderItem
): number {
  const layerDelta = ROOM_LAYER_ORDER[a.layer] - ROOM_LAYER_ORDER[b.layer]
  if (layerDelta !== 0) return layerDelta

  const depthDelta = a.depth - b.depth
  if (depthDelta !== 0) return depthDelta

  return a.renderId.localeCompare(b.renderId)
}
