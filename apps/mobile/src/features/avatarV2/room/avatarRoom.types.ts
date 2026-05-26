import type {
  RoomAnchor,
  RoomFurnitureRotation,
  RoomLayer,
  RoomV2AssetRef
} from "../../roomV2/roomV2.types"

export type RoomAvatarBodyPreset = "female" | "male"

export type RoomAvatarLayerType =
  | "hairBack"
  | "base"
  | "face"
  | "hair"
  | "bottom"
  | "shoes"
  | "topInner"
  | "top"
  | "topOuter"
  | "accessory"
  | "hairFront"

export interface RoomAvatarCatalogItem {
  id: string
  type: RoomAvatarLayerType
  name: string
  layerOrder: number
  asset: RoomV2AssetRef
  bodyPreset?: RoomAvatarBodyPreset
  isDefault?: boolean
}

export interface RoomAvatarAppearance {
  bodyPreset: RoomAvatarBodyPreset
  hairBackId?: string
  hairFrontId?: string
  baseId: string
  faceId: string
  hairId?: string
  topInnerId?: string
  topId?: string
  topOuterId?: string
  bottomId: string
  shoesId: string
  accessoryIds: string[]
}

export interface ResolvedRoomAvatarLayer {
  id: string
  type: RoomAvatarLayerType
  layerOrder: number
  asset: RoomV2AssetRef
}

export interface CreateRoomAvatarRenderItemInput {
  avatarId: string
  appearance?: Partial<RoomAvatarAppearance>
  catalog?: RoomAvatarCatalogItem[]
  renderId?: string
  name?: string
  x: number
  y: number
  width: number
  height: number
  layer?: RoomLayer
  depth?: number
  anchor?: RoomAnchor
  direction?: RoomFurnitureRotation
  state?: "idle"
  chatBubbleAnchor?: RoomAnchor
  reactionAnchor?: RoomAnchor
}
