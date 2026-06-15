import {
  getRoomWorldBlockerBounds,
  pointInRoomWorldPolygon,
  type RoomWorldBlocker,
  type RoomWorldBounds,
  type RoomWorldPoint
} from "../roomWorld/roomWorldGeometry"
import {
  ROOM_LAYER_ORDER,
  type FurnitureItem,
  type PlacedRoomItem,
  type ResolvedRoomV2Scene,
  type RoomAnchor,
  type RoomFurnitureRotation,
  type RoomLayer,
  type RoomPlacementLane,
  type RoomShell,
  type RoomV2AvatarMotionState,
  type RoomV2AvatarRenderItem,
  type RoomV2AvatarRenderLayer,
  type RoomV2FurnitureRenderItem,
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

export type RoomV2PlacementIssueId =
  | "outside_placeable_area"
  | "overlaps_blocking_furniture"

export interface RoomV2PlacementValidationResult {
  isValid: boolean
  issueIds: RoomV2PlacementIssueId[]
  blockingRenderIds: string[]
}

export interface RoomV2PlacementLaneSnapResult {
  x: number
  y: number
  snappedLaneId?: string
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
  state?: RoomV2AvatarMotionState
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

export function validateRoomV2FurniturePlacement(input: {
  scene: ResolvedRoomV2Scene
  candidate: RoomV2RenderItem
}): RoomV2PlacementValidationResult {
  if (input.candidate.kind !== "furniture") {
    return {
      isValid: true,
      issueIds: [],
      blockingRenderIds: []
    }
  }

  const issueIds: RoomV2PlacementIssueId[] = []
  const candidateFootprint = createRoomV2FurniturePlacementBlocker(input.candidate)
  const candidateBounds = getRoomWorldBlockerBounds(candidateFootprint)
  const walkablePolygon = input.scene.shell?.walkablePolygon
  const placeableArea = input.scene.shell?.placeableArea

  if (walkablePolygon?.length) {
    const floorCheckPoints = getRoomV2PlacementFloorCheckPoints(
      input.candidate,
      candidateBounds
    )
    const insideWalkableFloor = floorCheckPoints.every((point) =>
      pointInRoomWorldPolygon(point, walkablePolygon)
    )
    if (!insideWalkableFloor) {
      issueIds.push("outside_placeable_area")
    }
  } else if (placeableArea) {
    const anchorInside =
      input.candidate.x >= placeableArea.minX &&
      input.candidate.x <= placeableArea.maxX &&
      input.candidate.y >= placeableArea.minY &&
      input.candidate.y <= placeableArea.maxY
    const boundsInside =
      !input.candidate.blocksMovement ||
      candidateBounds.minX >= placeableArea.minX &&
      candidateBounds.maxX <= placeableArea.maxX &&
      candidateBounds.minY >= placeableArea.minY &&
      candidateBounds.maxY <= placeableArea.maxY

    if (!anchorInside || !boundsInside) {
      issueIds.push("outside_placeable_area")
    }
  }

  const blockingRenderIds = input.scene.renderItems
    .filter((item): item is RoomV2FurnitureRenderItem =>
      item.kind === "furniture" &&
      item.renderId !== input.candidate.renderId &&
      item.blocksMovement &&
      input.candidate.kind === "furniture" &&
      input.candidate.blocksMovement
    )
    .filter((item) =>
      doRoomV2PlacementBoundsOverlap(
        candidateBounds,
        getRoomWorldBlockerBounds(createRoomV2FurniturePlacementBlocker(item))
      )
    )
    .map((item) => item.renderId)

  if (blockingRenderIds.length > 0) {
    issueIds.push("overlaps_blocking_furniture")
  }

  return {
    isValid: issueIds.length === 0,
    issueIds,
    blockingRenderIds
  }
}

export function createRoomV2FurniturePlacementPreview(input: {
  item: RoomV2RenderItem
  x: number
  y: number
}): RoomV2RenderItem {
  if (input.item.kind !== "furniture") return input.item
  return {
    ...input.item,
    x: input.x,
    y: input.y,
    depth: input.y
  }
}

export function snapRoomV2PointToPlacementLane(input: {
  shell: RoomShell | null | undefined
  x: number
  y: number
}): RoomV2PlacementLaneSnapResult {
  const lane = findNearestRoomV2PlacementLane({
    lanes: input.shell?.placementLanes,
    x: input.x,
    y: input.y
  })
  if (!lane) {
    return {
      x: input.x,
      y: input.y
    }
  }

  return {
    x: Math.max(lane.minX ?? 0, Math.min(lane.maxX ?? 1, input.x)),
    y: lane.y,
    snappedLaneId: lane.id
  }
}

function createRoomV2FurniturePlacementBlocker(
  item: Extract<RoomV2RenderItem, { kind: "furniture" }>
): RoomWorldBlocker {
  const footprint = item.footprint ?? {
    width: item.width,
    height: item.height
  }
  return {
    id: item.renderId,
    x: item.x,
    y: item.y,
    width: footprint.width,
    height: footprint.height,
    anchor: item.anchor,
    blocksMovement: item.blocksMovement
  }
}

function getRoomV2PlacementFloorCheckPoints(
  item: Extract<RoomV2RenderItem, { kind: "furniture" }>,
  bounds: RoomWorldBounds
): RoomWorldPoint[] {
  const anchorPoint = { x: item.x, y: item.y }
  if (!item.blocksMovement || item.category === "wallDecor") return [anchorPoint]
  return [
    anchorPoint,
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.maxY }
  ]
}

function findNearestRoomV2PlacementLane(input: {
  lanes: RoomPlacementLane[] | undefined
  x: number
  y: number
}): RoomPlacementLane | undefined {
  const candidates = (input.lanes ?? []).filter((lane) =>
    input.x >= (lane.minX ?? 0) &&
    input.x <= (lane.maxX ?? 1) &&
    Math.abs(input.y - lane.y) <= (lane.snapRadius ?? 0.045)
  )
  return candidates
    .sort((a, b) => Math.abs(input.y - a.y) - Math.abs(input.y - b.y))[0]
}

function doRoomV2PlacementBoundsOverlap(
  a: RoomWorldBounds,
  b: RoomWorldBounds
): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY
  )
}
