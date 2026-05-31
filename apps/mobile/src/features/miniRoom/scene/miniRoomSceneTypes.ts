import type { ImageSourcePropType } from "react-native"

export interface RoomPoint {
  x: number
  y: number
}

export type AvatarFacing = "front" | "back" | "left" | "right"

export interface WalkableArea {
  id: string
  points: RoomPoint[]
}

export interface SpawnPoint {
  id: string
  role: "local" | "partner"
  x: number
  y: number
  facing: AvatarFacing
}

export interface RoomMap {
  mapId: string
  backgroundAsset: ImageSourcePropType
  width: number
  height: number
  walkableAreas: WalkableArea[]
  safeInsets: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface RoomHotspot {
  id: string
  kind: "seat" | "stand" | "decor" | "activity"
  x: number
  y: number
  label?: string
  approachPoint?: RoomPoint
  facingOnArrival?: AvatarFacing
  padWidth?: number
  padHeight?: number
}

export interface FurniturePlacement {
  id: string
  asset: ImageSourcePropType
  x: number
  y: number
  width: number
  height: number
  depthY: number
  blocksMovement: boolean
}

export interface RoomScene {
  sceneId: string
  map: RoomMap
  furniture: FurniturePlacement[]
  spawnPoints: SpawnPoint[]
  hotspots: RoomHotspot[]
}

export interface AvatarAppearance {
  base: "female_base_01" | "male_base_01"
  fullBodyAsset: ImageSourcePropType
  skinTone?: string
  hair?: string
  eyes?: string
  brows?: string
  mouth?: string
  top?: string
  bottom?: string
  shoes?: string
  accessory?: string
}

export interface AvatarState {
  userId: string
  displayName: string
  x: number
  y: number
  targetX?: number
  targetY?: number
  facing: AvatarFacing
  motion: "idle" | "walking" | "speaking" | "emoting" | "sitting"
  appearance: AvatarAppearance
  seatedHotspotId?: string
}

export type SpeechBubbleTone = "greeting" | "react" | "chat"

export interface SpeechBubble {
  id: string
  speakerUserId: string
  body: string
  tone: SpeechBubbleTone
  createdAt: number
  expiresAt: number
}

export interface RoomPhrase {
  id: string
  body: string
  tone: SpeechBubbleTone
}

export interface RoomEmote {
  id: string
  userId: string
  reaction: "wave" | "heart" | "laugh" | "fire"
  createdAt: number
  expiresAt: number
}

export interface InteractionState {
  selectedHotspotId?: string
  pressedPoint?: RoomPoint
  proximityClose: boolean
}

export interface MiniRoomStore {
  scene: RoomScene
  avatars: Record<string, AvatarState>
  bubbles: SpeechBubble[]
  emotes: RoomEmote[]
  interaction: InteractionState
  moveLocalAvatar: (point: RoomPoint) => boolean
  moveLocalAvatarToHotspot: (hotspotId: string) => boolean
  addSpeechBubble: (bubble: Omit<SpeechBubble, "id" | "createdAt" | "expiresAt">) => void
  sayPhrase: (userId: string, body: string, tone?: SpeechBubbleTone) => void
  addEmote: (userId: string, reaction: RoomEmote["reaction"]) => void
}
