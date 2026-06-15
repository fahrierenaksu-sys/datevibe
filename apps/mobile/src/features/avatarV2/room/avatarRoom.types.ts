import type {
  RoomAnchor,
  RoomV2AvatarAssetResolutionKind,
  RoomFurnitureRotation,
  RoomLayer,
  RoomV2AvatarAssetSequence,
  RoomV2AvatarMotionAssetIssueId,
  RoomV2AvatarMotionState,
  RoomV2AvatarMotionTreatment,
  RoomV2AvatarMotionAsset,
  RoomV2AssetRef
} from "../../roomV2/roomV2.types"

export type RoomAvatarBodyPreset = "female" | "male"

export type RoomAvatarRigId = "datevibe_2_5d_layered_v1"

export type RoomAvatarFitProfileId =
  | "datevibe_female_room_avatar_v1"
  | "datevibe_male_room_avatar_v1"

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

export type RoomAvatarAssetVariantMap = Partial<
  Record<
    RoomV2AvatarMotionState,
    Partial<Record<RoomFurnitureRotation, RoomV2AvatarMotionAsset>>
  >
>

export type RoomAvatarAssetResolutionKind = RoomV2AvatarAssetResolutionKind

export interface RoomAvatarCatalogItem {
  id: string
  type: RoomAvatarLayerType
  name: string
  layerOrder: number
  asset: RoomV2AssetRef
  assetsByMotion?: RoomAvatarAssetVariantMap
  rigId?: RoomAvatarRigId
  fitProfileId?: RoomAvatarFitProfileId
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
  name: string
  layerOrder: number
  asset: RoomV2AssetRef
  animation?: RoomV2AvatarAssetSequence
  requestedState: RoomV2AvatarMotionState
  requestedDirection: RoomFurnitureRotation
  resolvedState: RoomV2AvatarMotionState
  resolvedDirection: RoomFurnitureRotation
  usingFallbackAsset: boolean
  assetResolutionKind: RoomAvatarAssetResolutionKind
  rigId: RoomAvatarRigId
  fitProfileId: RoomAvatarFitProfileId
}

export interface RoomAvatarMotionBlockingLayer {
  requirementLabel: string
  requestedState: RoomV2AvatarMotionState
  requestedDirection: RoomFurnitureRotation
  layerId: string
  layerName: string
  layerType: RoomAvatarLayerType
  issueIds: RoomV2AvatarMotionAssetIssueId[]
}

export interface RoomAvatarAssetCoverageSummary {
  requestedState: RoomV2AvatarMotionState
  requestedDirection: RoomFurnitureRotation
  layerCount: number
  dedicatedLayerCount: number
  animatedLayerCount: number
  fallbackLayerCount: number
  fallbackLayerIds: string[]
  supportsRequestedMotionExactly: boolean
  supportsRequestedMotionAnimation: boolean
  motionAssetIssueIds: RoomV2AvatarMotionAssetIssueId[]
  frameCounts: number[]
  frameDurationMsValues: number[]
  minimumFrameCount: number
  blockingLayers: RoomAvatarMotionBlockingLayer[]
  isProductionReady: boolean
  hasDedicatedMotionAssets: boolean
  motionTreatment: RoomV2AvatarMotionTreatment
}

export interface RoomAvatarMotionRequirementReadiness {
  requestedState: RoomV2AvatarMotionState
  requestedDirection: RoomFurnitureRotation
  supportsRequestedMotionExactly: boolean
  supportsRequestedMotionAnimation: boolean
  motionAssetIssueIds: RoomV2AvatarMotionAssetIssueId[]
  isProductionReady: boolean
  motionTreatment: RoomV2AvatarMotionTreatment
  fallbackLayerIds: string[]
  blockingLayers: RoomAvatarMotionBlockingLayer[]
  isReady: boolean
}

export interface RoomAvatarFirstMotionSliceReadiness {
  isReady: boolean
  requirements: RoomAvatarMotionRequirementReadiness[]
  missingRequirements: RoomAvatarMotionRequirementReadiness[]
}

export type RoomAvatarMotionReadinessLevel =
  | "motionReady"
  | "idleReady"
  | "notReady"

export interface RoomAvatarMotionReadinessRequirementSummary {
  label: string
  isReady: boolean
  blockingLayerLabel?: string
}

export interface RoomAvatarMotionReadinessSummary {
  level: RoomAvatarMotionReadinessLevel
  sliceLabel: string
  label: string
  body: string
  readyRequirementCount: number
  totalRequirementCount: number
  requirementSummaries: RoomAvatarMotionReadinessRequirementSummary[]
  gestureReadyRequirementCount: number
  gestureTotalRequirementCount: number
  gestureRequirementSummaries: RoomAvatarMotionReadinessRequirementSummary[]
  missingGestureRequirementLabels: string[]
  missingRequirementLabels: string[]
  blockingLayerLabels: string[]
  isFirstMotionSliceReady: boolean
  isGestureDelightReady: boolean
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
  state?: RoomV2AvatarMotionState
  chatBubbleAnchor?: RoomAnchor
  reactionAnchor?: RoomAnchor
}
