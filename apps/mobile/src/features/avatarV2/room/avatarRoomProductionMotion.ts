import {
  DEFAULT_ROOM_AVATAR_FEMALE,
  ROOM_AVATAR_CATALOG
} from "./avatarRoom.mock"
import { getRoomAvatarAssetCoverage } from "./avatarRoomSelectors"
import type {
  RoomAvatarAppearance,
  RoomAvatarBodyPreset,
  RoomAvatarCatalogItem,
  RoomAvatarLayerType
} from "./avatarRoom.types"
import type {
  RoomFurnitureRotation,
  RoomV2AvatarMotionState
} from "../../roomV2/roomV2.types"
export const ROOM_AVATAR_PRODUCTION_CANVAS = {
  width: 256,
  height: 384,
  centerlineX: 128,
  feetBaselineY: 360
} as const

export const ROOM_AVATAR_PRODUCTION_RIG_ID =
  "datevibe_2_5d_layered_v1" as const

export const ROOM_AVATAR_PRODUCTION_FRAME_DURATION_MS = 120

export type RoomAvatarProductionMotionSliceId = "motion_v1_female_walk_sit"

const MOTION_V1_REQUIREMENTS: ReadonlyArray<{
  label: string
  state: RoomV2AvatarMotionState
  direction: RoomFurnitureRotation
  minimumFrameCount: number
  frameDurationMs: typeof ROOM_AVATAR_PRODUCTION_FRAME_DURATION_MS
  loop: boolean
  requiresAnimation: boolean
}> = [
  {
    label: "Walk front",
    state: "walking",
    direction: "front",
    minimumFrameCount: 4,
    frameDurationMs: ROOM_AVATAR_PRODUCTION_FRAME_DURATION_MS,
    loop: true,
    requiresAnimation: true
  },
  {
    label: "Sit front",
    state: "sitting",
    direction: "front",
    minimumFrameCount: 1,
    frameDurationMs: ROOM_AVATAR_PRODUCTION_FRAME_DURATION_MS,
    loop: false,
    requiresAnimation: false
  }
]

export interface RoomAvatarProductionMotionRequirementAudit {
  sliceId: RoomAvatarProductionMotionSliceId
  label: string
  state: RoomV2AvatarMotionState
  direction: RoomFurnitureRotation
  minimumFrameCount: number
  frameDurationMs: number
  loop: boolean
  requiresAnimation: boolean
  isReady: boolean
  missingLayerLabels: string[]
  missingAssetPlans: RoomAvatarProductionMissingAssetPlan[]
}

export interface RoomAvatarProductionMissingAssetPlan {
  bodyPreset: RoomAvatarBodyPreset
  layerType: RoomAvatarLayerType
  layerId: string
  layerName: string
  seedAssetKey: string
  seedFileName: string
  state: RoomV2AvatarMotionState
  direction: RoomFurnitureRotation
  minimumFrameCount: number
  frameDurationMs: number
  loop: boolean
  expectedAssetKeyPrefix: string
  expectedStripKey: string
  expectedStripFileName: string
  expectedFrameKeys: string[]
  expectedFileNames: string[]
  catalogMotionSlot: string
}

export interface RoomAvatarProductionPresetAudit {
  bodyPreset: RoomAvatarBodyPreset
  readyRequirementCount: number
  totalRequirementCount: number
  requirements: RoomAvatarProductionMotionRequirementAudit[]
}

export interface RoomAvatarProductionMotionAudit {
  rigId: typeof ROOM_AVATAR_PRODUCTION_RIG_ID
  canvas: typeof ROOM_AVATAR_PRODUCTION_CANVAS
  readyRequirementCount: number
  totalRequirementCount: number
  presetAudits: RoomAvatarProductionPresetAudit[]
  firstMissingRequirementLabel?: string
  firstMissingAssetPlan?: RoomAvatarProductionMissingAssetPlan
  isMotionV1ReadyForDefaultFemale: boolean
  excludedFromMotionV1: string[]
}

const DEFAULT_PRESET_APPEARANCES: Array<{
  bodyPreset: RoomAvatarBodyPreset
  appearance: RoomAvatarAppearance
}> = [
  {
    bodyPreset: "female",
    appearance: DEFAULT_ROOM_AVATAR_FEMALE
  }
]

export function getRoomAvatarProductionMotionAudit(input?: {
  catalog?: RoomAvatarCatalogItem[]
}): RoomAvatarProductionMotionAudit {
  const catalog = input?.catalog ?? ROOM_AVATAR_CATALOG
  const presetAudits = DEFAULT_PRESET_APPEARANCES.map((preset) =>
    getRoomAvatarProductionPresetAudit({
      catalog,
      bodyPreset: preset.bodyPreset,
      appearance: preset.appearance
    })
  )
  const readyRequirementCount = presetAudits.reduce(
    (sum, audit) => sum + audit.readyRequirementCount,
    0
  )
  const totalRequirementCount = presetAudits.reduce(
    (sum, audit) => sum + audit.totalRequirementCount,
    0
  )
  const firstMissingRequirement = presetAudits
    .flatMap((audit) => audit.requirements.map((requirement) => ({
      ...requirement,
      bodyPreset: audit.bodyPreset
    })))
    .find((requirement) => !requirement.isReady)
  const firstMissingAssetPlan = presetAudits
    .flatMap((audit) =>
      audit.requirements.flatMap((requirement) =>
        requirement.missingAssetPlans
      )
    )[0]

  return {
    rigId: ROOM_AVATAR_PRODUCTION_RIG_ID,
    canvas: ROOM_AVATAR_PRODUCTION_CANVAS,
    readyRequirementCount,
    totalRequirementCount,
    presetAudits,
    firstMissingRequirementLabel: firstMissingRequirement
      ? `${firstMissingRequirement.bodyPreset} ${firstMissingRequirement.label}`
      : undefined,
    firstMissingAssetPlan,
    isMotionV1ReadyForDefaultFemale: presetAudits.every((audit) =>
      audit.readyRequirementCount === audit.totalRequirementCount
    ),
    excludedFromMotionV1: [
      "male presets",
      "non-default avatar items",
      "gesture delight motions",
      "waving",
      "dancing"
    ]
  }
}

function getRoomAvatarProductionPresetAudit(input: {
  catalog: RoomAvatarCatalogItem[]
  bodyPreset: RoomAvatarBodyPreset
  appearance: RoomAvatarAppearance
}): RoomAvatarProductionPresetAudit {
  const requirements = MOTION_V1_REQUIREMENTS
    .map((requirement) =>
      getRequirementAudit({
        ...input,
        sliceId: "motion_v1_female_walk_sit",
        label: requirement.label,
        state: requirement.state,
        direction: requirement.direction,
        minimumFrameCount: requirement.minimumFrameCount,
        frameDurationMs: requirement.frameDurationMs,
        loop: requirement.loop,
        requiresAnimation: requirement.requiresAnimation
      })
    )

  return {
    bodyPreset: input.bodyPreset,
    readyRequirementCount: requirements.filter((requirement) =>
      requirement.isReady
    ).length,
    totalRequirementCount: requirements.length,
    requirements
  }
}

function getRequirementAudit(input: {
  catalog: RoomAvatarCatalogItem[]
  appearance: RoomAvatarAppearance
  sliceId: RoomAvatarProductionMotionSliceId
  label: string
  state: RoomV2AvatarMotionState
  direction: RoomFurnitureRotation
  minimumFrameCount: number
  frameDurationMs: number
  loop: boolean
  requiresAnimation: boolean
}): RoomAvatarProductionMotionRequirementAudit {
  const coverage = getRoomAvatarAssetCoverage({
    catalog: input.catalog,
    appearance: input.appearance,
    state: input.state,
    direction: input.direction
  })
  const missingAssetPlans = coverage.blockingLayers.map((layer) => ({
    ...getMissingAssetPlan({
      bodyPreset: input.appearance.bodyPreset,
      layerType: layer.layerType,
      layerId: layer.layerId,
      layerName: layer.layerName,
      seedAssetKey: input.catalog.find((item) =>
        item.id === layer.layerId
      )?.asset.key ?? layer.layerId,
      state: input.state,
      direction: input.direction,
      minimumFrameCount: input.minimumFrameCount,
      frameDurationMs: input.frameDurationMs,
      loop: input.loop
    })
  }))

  return {
    sliceId: input.sliceId,
    label: input.label,
    state: input.state,
    direction: input.direction,
    minimumFrameCount: input.minimumFrameCount,
    frameDurationMs: input.frameDurationMs,
    loop: input.loop,
    requiresAnimation: input.requiresAnimation,
    isReady: coverage.isProductionReady,
    missingLayerLabels: coverage.blockingLayers.length
      ? coverage.blockingLayers.map((layer) => layer.layerName)
      : coverage.fallbackLayerIds,
    missingAssetPlans
  }
}

function getMissingAssetPlan(input: {
  bodyPreset: RoomAvatarBodyPreset
  layerType: RoomAvatarLayerType
  layerId: string
  layerName: string
  seedAssetKey: string
  state: RoomV2AvatarMotionState
  direction: RoomFurnitureRotation
  minimumFrameCount: number
  frameDurationMs: number
  loop: boolean
}): RoomAvatarProductionMissingAssetPlan {
  const expectedAssetKeyPrefix = `${input.layerId}_${input.state}_${input.direction}`
  const expectedStripKey = `${expectedAssetKeyPrefix}_strip`
  const expectedFrameKeys = Array.from(
    { length: Math.max(1, input.minimumFrameCount) },
    (_, index) => `${expectedAssetKeyPrefix}_f${String(index + 1).padStart(2, "0")}`
  )

  return {
    ...input,
    seedFileName: `${input.seedAssetKey}.png`,
    expectedAssetKeyPrefix,
    expectedStripKey,
    expectedStripFileName: `${expectedStripKey}.png`,
    expectedFrameKeys,
    expectedFileNames: expectedFrameKeys.map((key) => `${key}.png`),
    catalogMotionSlot: `assetsByMotion.${input.state}.${input.direction}`
  }
}
