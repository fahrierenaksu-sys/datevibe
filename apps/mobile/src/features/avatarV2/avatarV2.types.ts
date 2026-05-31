import type { ImageSourcePropType } from "react-native"

export type AvatarItemType =
  | "body"
  | "face"
  | "hair"
  | "top"
  | "bottom"
  | "shoes"
  | "accessory"

export type AvatarAnimationState =
  | "idle_front"
  | "walk_front"
  | "sit_front"
  | "wave_front"

export interface AvatarLayerAssetRef {
  key: string
  source: ImageSourcePropType
}

export interface AvatarCatalogItem {
  id: string
  type: AvatarItemType
  name: string
  sortOrder: number
  layerOrder: number
  assets: Partial<Record<AvatarAnimationState, AvatarLayerAssetRef>>
  mockPriceCoins?: number
  isDefault?: boolean
  ownedByDefault?: boolean
  locked?: boolean
}

export interface UserAvatar {
  bodyId: string
  faceId: string
  hairId: string
  topId: string
  bottomId: string
  shoesId: string
  accessoryIds: string[]
}

export interface AvatarInventory {
  ownedItemIds: string[]
}

export interface AvatarCategory {
  type: AvatarItemType
  label: string
}

export interface ResolvedAvatarLayer {
  id: string
  type: AvatarItemType
  layerOrder: number
  asset: AvatarLayerAssetRef
}
