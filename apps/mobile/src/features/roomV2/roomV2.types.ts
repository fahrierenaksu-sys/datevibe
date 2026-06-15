import type { DimensionValue, ImageSourcePropType } from "react-native"

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

export type RoomV2AvatarMotionState =
  | "idle"
  | "walking"
  | "sitting"
  | "waving"
  | "dancing"

export type RoomV2AvatarAssetResolutionKind =
  | "exact"
  | "sameStateFront"
  | "idleSameDirection"
  | "idleFront"
  | "baseAsset"

export type RoomV2AvatarMotionTreatment =
  | "animatedMotionAssets"
  | "exactMotionAssets"
  | "runtimeLocomotion"
  | "runtimeGesture"
  | "idleBaseAsset"
  | "idleFallback"

export type RoomV2AvatarMotionAssetIssueId =
  | "missing_exact_layers"
  | "missing_animation_frames"
  | "insufficient_animation_frames"
  | "mixed_frame_counts"
  | "mixed_frame_durations"
  | "mixed_rigs"
  | "mixed_fit_profiles"

export interface RoomV2AvatarMotionAssetDiagnostics {
  requestedState: RoomV2AvatarMotionState
  requestedDirection: RoomFurnitureRotation
  layerCount: number
  exactLayerCount: number
  animatedLayerCount: number
  frameCounts: number[]
  frameDurationMsValues: number[]
  minimumFrameCount: number
  rigIds: string[]
  fitProfileIds: string[]
  issueIds: RoomV2AvatarMotionAssetIssueId[]
  supportsExactMotion: boolean
  supportsAnimatedMotion: boolean
  isProductionReady: boolean
}

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

export interface RoomV2AvatarAssetSequence {
  frames: [RoomV2AssetRef, ...RoomV2AssetRef[]]
  frameDurationMs: number
  loop?: boolean
}

export type RoomV2AvatarMotionAsset =
  | RoomV2AssetRef
  | RoomV2AvatarAssetSequence

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

export interface RoomWalkablePolygonPoint {
  x: number
  y: number
}

export interface RoomPlacementLane {
  id: string
  y: number
  label?: string
  minX?: number
  maxX?: number
  snapRadius?: number
}

export interface RoomShellMyRoomCamera {
  compactRendererWidth: DimensionValue
  regularRendererWidth: DimensionValue
  rendererTranslateY: number
  stageHeightRatio: number
  minStageHeight: number
  maxStageHeight: number
}

export interface RoomShellMiniRoomCamera {
  rendererWidth: DimensionValue
  rendererTranslateY: number
  backgroundColor: string
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
  myRoomCamera?: RoomShellMyRoomCamera
  miniRoomCamera?: RoomShellMiniRoomCamera
  placeableArea?: RoomBounds
  walkablePolygon?: RoomWalkablePolygonPoint[]
  placementLanes?: RoomPlacementLane[]
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
  animation?: RoomV2AvatarAssetSequence
  requestedState?: RoomV2AvatarMotionState
  requestedDirection?: RoomFurnitureRotation
  resolvedState?: RoomV2AvatarMotionState
  resolvedDirection?: RoomFurnitureRotation
  usingFallbackAsset?: boolean
  assetResolutionKind?: RoomV2AvatarAssetResolutionKind
  rigId?: string
  fitProfileId?: string
}

export interface RoomV2AvatarRenderItem extends RoomV2RenderItemBase {
  kind: "avatar"
  avatarId: string
  name?: string
  layers: RoomV2AvatarRenderLayer[]
  direction?: RoomFurnitureRotation
  state?: RoomV2AvatarMotionState
  motionTreatment?: RoomV2AvatarMotionTreatment
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
