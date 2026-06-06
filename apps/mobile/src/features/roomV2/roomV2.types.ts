import type { ImageSourcePropType } from "react-native"

export type RoomLayer =
  | "background"
  | "wall"
  | "floor"
  | "furniture"
  | "foreground"
  | "overlay"

export const ROOM_LAYER_ORDER: Record<RoomLayer, number> = {
  background: 0,
  wall: 10,
  floor: 20,
  furniture: 30,
  foreground: 40,
  overlay: 50
}

export type RoomFurnitureRotation = "front" | "back" | "left" | "right"

export type FurnitureCategory =
  | "seating"
  | "table"
  | "rug"
  | "plant"
  | "lighting"
  | "wallDecor"
  | "misc"

export type FurnitureInteractionType = "none" | "decor" | "seat"

export interface RoomV2AssetRef {
  key: string
  source: ImageSourcePropType
}

export interface RoomCanvasSize {
  width: number
  height: number
}

export interface RoomBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface RoomAnchor {
  x: number
  y: number
}

export interface RoomFootprint {
  width: number
  height: number
}

export interface RoomSeatPoint {
  id: string
  x: number
  y: number
  facing?: RoomFurnitureRotation
}

export interface RoomShell {
  id: string
  name: string
  asset: RoomV2AssetRef
  canvasSize: RoomCanvasSize
  placeableArea?: RoomBounds
}

export interface FurnitureItem {
  id: string
  name: string
  asset: RoomV2AssetRef
  assetsByRotation?: Partial<Record<RoomFurnitureRotation, RoomV2AssetRef>>
  category: FurnitureCategory
  layer: RoomLayer
  width: number
  height: number
  anchor?: RoomAnchor
  footprint?: RoomFootprint
  blocksMovement?: boolean
  interactionType?: FurnitureInteractionType
  seatPoints?: RoomSeatPoint[]
  ownedByDefault?: boolean
  locked?: boolean
}

export interface PlacedRoomItem {
  instanceId: string
  itemId: string
  x: number
  y: number
  rotation: RoomFurnitureRotation
  depth?: number
  width?: number
  height?: number
}

export interface UserRoomDecor {
  roomShellId: string
  placedItems: PlacedRoomItem[]
}

export interface RoomV2RenderItemBase {
  renderId: string
  kind: "furniture" | "avatar"
  layer: RoomLayer
  depth: number
  x: number
  y: number
  width: number
  height: number
  anchor: RoomAnchor
}

export interface RoomV2FurnitureRenderItem extends RoomV2RenderItemBase {
  kind: "furniture"
  itemId: string
  name: string
  category: FurnitureCategory
  asset: RoomV2AssetRef
  rotation: RoomFurnitureRotation
  footprint?: RoomFootprint
  blocksMovement: boolean
  interactionType: FurnitureInteractionType
  seatPoints?: RoomSeatPoint[]
}

export interface RoomV2AvatarRenderLayer {
  id: string
  type: string
  layerOrder: number
  asset: RoomV2AssetRef
}

export interface RoomV2AvatarRenderItem extends RoomV2RenderItemBase {
  kind: "avatar"
  avatarId: string
  name?: string
  layers: RoomV2AvatarRenderLayer[]
  direction?: RoomFurnitureRotation
  state?: "idle"
  // Future metadata only: chat/reaction rendering is intentionally out of
  // scope for the first room-world proof.
  chatBubbleAnchor?: RoomAnchor
  reactionAnchor?: RoomAnchor
}

export type RoomV2RenderItem =
  | RoomV2FurnitureRenderItem
  | RoomV2AvatarRenderItem

export interface ResolvedRoomV2Scene {
  shell: RoomShell | null
  renderItems: RoomV2RenderItem[]
}
