import {
  AVATAR_V2_CATALOG
} from "../avatarV2/avatarV2.mock"
import {
  isAvatarV2ItemEquipped,
  isAvatarV2ItemOwned
} from "../avatarV2/avatarV2Selectors"
import type {
  AvatarInventory,
  AvatarCatalogItem,
  UserAvatar
} from "../avatarV2/avatarV2.types"
import type { DateVibeInventorySnapshot } from "../inventory/inventoryStore"
import { ROOM_V2_FURNITURE_CATALOG } from "../roomV2/roomV2.mock"
import type {
  FurnitureItem,
  UserRoomDecor
} from "../roomV2/roomV2.types"

export type ShopCatalogItemKind =
  | "avatarWearable"
  | "roomItem"
  | "roomShell"
  | "roomSurface"
  | "architecturalDecor"
  | "statusItem"

export type ShopPreviewType = "avatar" | "room" | "status"

export type ShopActionType =
  | "avatarUnlock"
  | "avatarEquip"
  | "roomUnlock"
  | "roomPlace"
  | "disabled"

export type ShopSectionId = "avatar" | "room" | "status"

export type StatusCardItemCategory =
  | "frame"
  | "aura"
  | "badge"
  | "pose"
  | "entranceEffect"
  | "chatBubble"
  | "nameplate"

export type StatusCardItemSurface =
  | "discoverCard"
  | "profileCard"
  | "matchCard"
  | "chatIdentity"

export interface StatusCardCatalogItem {
  id: string
  category: StatusCardItemCategory
  name: string
  description: string
  previewLabel: string
  surface: StatusCardItemSurface
  accentColor: string
  accentSoftColor: string
}

export interface ShopCatalogItem {
  id: string
  kind: ShopCatalogItemKind
  title: string
  description: string
  priceCoins: number | null
  owned: boolean
  previewType: ShopPreviewType
  actionType: ShopActionType
  sourceItemId: string
  sectionId: ShopSectionId
  eyebrow: string
  stateLabel: string
  actionLabel: string
  disabledReason?: string
  avatarItem?: AvatarCatalogItem
  roomItem?: FurnitureItem
  statusCardItem?: StatusCardCatalogItem
  placedCount?: number
}

export interface BuildShopCatalogItemsInput {
  inventory: DateVibeInventorySnapshot
  avatar: UserAvatar
  roomDecor: UserRoomDecor
}

export interface BuildAvatarShopCatalogItemInput {
  item: AvatarCatalogItem
  inventory: AvatarInventory
  avatar: UserAvatar
}

const SHOP_AVATAR_TYPES = new Set(["hair", "top", "bottom", "shoes", "accessory"])

const AVATAR_SHOP_PRICES: Record<string, number> = {
  avatar_v2_top_locked_luxe: 280
}

const ROOM_SHOP_PRICES: Record<string, number> = {
  room_v2_cozy_bed: 520,
  room_v2_cute_bookshelf: 360,
  room_v2_side_table: 240
}

export const INITIAL_SHOP_ITEM_ID = "avatar:avatar_v2_top_locked_luxe"

export const STATUS_CARD_FOUNDATION_CATALOG: StatusCardCatalogItem[] = [
  {
    id: "status_card_frame_soft_glow",
    category: "frame",
    name: "Soft Glow Frame",
    description: "Preview-only profile card frame reserved for future status ownership and equip.",
    previewLabel: "Profile frame",
    surface: "profileCard",
    accentColor: "#FF5C9F",
    accentSoftColor: "rgba(255, 92, 159, 0.16)"
  },
  {
    id: "status_card_aura_cozy",
    category: "aura",
    name: "Cozy Aura",
    description: "Preview-only aura treatment for profile and match presence.",
    previewLabel: "Aura",
    surface: "matchCard",
    accentColor: "#D77A2D",
    accentSoftColor: "rgba(215, 122, 45, 0.16)"
  },
  {
    id: "status_card_badge_room_stylist",
    category: "badge",
    name: "Room Stylist Badge",
    description: "Preview-only badge concept for future card identity items.",
    previewLabel: "Badge",
    surface: "discoverCard",
    accentColor: "#3C8F7C",
    accentSoftColor: "rgba(60, 143, 124, 0.16)"
  },
  {
    id: "status_card_pose_wave",
    category: "pose",
    name: "Soft Wave Pose",
    description: "Preview-only avatar pose concept. It is not wired to AvatarV2 yet.",
    previewLabel: "Pose",
    surface: "discoverCard",
    accentColor: "#6E72C9",
    accentSoftColor: "rgba(110, 114, 201, 0.16)"
  },
  {
    id: "status_card_entrance_blush",
    category: "entranceEffect",
    name: "Blush Entrance",
    description: "Preview-only entrance effect concept for future match moments.",
    previewLabel: "Entrance",
    surface: "matchCard",
    accentColor: "#E06482",
    accentSoftColor: "rgba(224, 100, 130, 0.16)"
  },
  {
    id: "status_card_bubble_soft",
    category: "chatBubble",
    name: "Soft Chat Bubble",
    description: "Preview-only chat bubble style. It is not wired to chat or MiniRoom.",
    previewLabel: "Chat bubble",
    surface: "chatIdentity",
    accentColor: "#A55BDE",
    accentSoftColor: "rgba(165, 91, 222, 0.16)"
  },
  {
    id: "status_card_nameplate_new_here",
    category: "nameplate",
    name: "New Here Nameplate",
    description: "Preview-only nameplate concept for future profile and chat identity.",
    previewLabel: "Nameplate",
    surface: "profileCard",
    accentColor: "#B9891F",
    accentSoftColor: "rgba(185, 137, 31, 0.16)"
  }
]

export function buildShopCatalogItems(
  input: BuildShopCatalogItemsInput
): ShopCatalogItem[] {
  return [
    ...buildAvatarShopItems(input),
    ...buildRoomShopItems(input),
    ...buildStatusShopItems()
  ]
}

function buildAvatarShopItems(input: BuildShopCatalogItemsInput): ShopCatalogItem[] {
  const avatarInventory = {
    ownedItemIds: input.inventory.ownedAvatarItemIds
  }

  return AVATAR_V2_CATALOG
    .filter((item) => SHOP_AVATAR_TYPES.has(item.type))
    .map((item) =>
      buildAvatarShopCatalogItem({
        item,
        inventory: avatarInventory,
        avatar: input.avatar
      })
    )
}

export function buildAvatarShopCatalogItem(
  input: BuildAvatarShopCatalogItemInput
): ShopCatalogItem {
  const { item } = input
  const owned = isAvatarV2ItemOwned(input.inventory, item)
  const equipped = isAvatarV2ItemEquipped(input.avatar, item)
  const priceCoins = getAvatarShopPrice(item)
  const actionType = getAvatarActionType({ owned, equipped, priceCoins })
  return {
    id: `avatar:${item.id}`,
    kind: "avatarWearable",
    title: item.name,
    description: getAvatarDescription(item, priceCoins),
    priceCoins,
    owned,
    previewType: "avatar",
    actionType,
    sourceItemId: item.id,
    sectionId: "avatar",
    eyebrow: getAvatarEyebrow(item),
    stateLabel: getAvatarStateLabel({ owned, equipped, priceCoins }),
    actionLabel: getAvatarActionLabel({ actionType, equipped, priceCoins }),
    disabledReason: actionType === "disabled"
      ? equipped
        ? undefined
        : "This wearable needs catalog pricing before it can be unlocked."
      : undefined,
    avatarItem: item
  }
}

function buildRoomShopItems(input: BuildShopCatalogItemsInput): ShopCatalogItem[] {
  return ROOM_V2_FURNITURE_CATALOG.map((item) => {
    const owned = input.inventory.ownedRoomItemIds.includes(item.id)
    const priceCoins = getRoomShopPrice(item)
    const placedCount = input.roomDecor.placedItems.filter(
      (placedItem) => placedItem.itemId === item.id
    ).length
    const actionType: ShopActionType = owned
      ? "roomPlace"
      : priceCoins !== null
        ? "roomUnlock"
        : "disabled"
    return {
      id: `room:${item.id}`,
      kind: "roomItem",
      title: item.name,
      description: getRoomDescription(item),
      priceCoins,
      owned,
      previewType: "room",
      actionType,
      sourceItemId: item.id,
      sectionId: "room",
      eyebrow: getRoomEyebrow(item),
      stateLabel: owned
        ? placedCount > 0
          ? `${placedCount} placed`
          : "Owned"
        : priceCoins !== null
          ? `${priceCoins.toLocaleString()} coins`
          : "Preview only",
      actionLabel: getShopActionLabel(actionType, priceCoins),
      disabledReason: actionType === "disabled"
        ? "This room item is preview-only until local unlock pricing is ready."
        : undefined,
      roomItem: item,
      placedCount
    } satisfies ShopCatalogItem
  })
}

function buildStatusShopItems(): ShopCatalogItem[] {
  return STATUS_CARD_FOUNDATION_CATALOG.map((item) => ({
    id: `status:${item.id}`,
    kind: "statusItem",
    title: item.name,
    description: item.description,
    priceCoins: null,
    owned: false,
    previewType: "status",
    actionType: "disabled",
    sourceItemId: item.id,
    sectionId: "status",
    eyebrow: getStatusEyebrow(item),
    stateLabel: "Preview only",
    actionLabel: "Preview only",
    disabledReason: "Status/card ownership, unlock, and equip are intentionally not wired yet.",
    statusCardItem: item
  }))
}

function getAvatarShopPrice(item: AvatarCatalogItem): number | null {
  if (item.ownedByDefault === true) return 0
  return AVATAR_SHOP_PRICES[item.id] ?? null
}

function getRoomShopPrice(item: FurnitureItem): number | null {
  if (item.ownedByDefault === true) return 0
  return ROOM_SHOP_PRICES[item.id] ?? null
}

function getAvatarActionType(input: {
  owned: boolean
  equipped: boolean
  priceCoins: number | null
}): ShopActionType {
  if (input.equipped) return "disabled"
  if (input.owned) return "avatarEquip"
  if (input.priceCoins !== null) return "avatarUnlock"
  return "disabled"
}

function getAvatarStateLabel(input: {
  owned: boolean
  equipped: boolean
  priceCoins: number | null
}): string {
  if (input.equipped) return "Equipped"
  if (input.owned) return "Owned"
  if (input.priceCoins !== null) return `${input.priceCoins.toLocaleString()} coins`
  return "Preview only"
}

function getAvatarActionLabel(input: {
  actionType: ShopActionType
  equipped: boolean
  priceCoins: number | null
}): string {
  if (input.equipped) return "Equipped"
  return getShopActionLabel(input.actionType, input.priceCoins)
}

function getShopActionLabel(
  actionType: ShopActionType,
  priceCoins: number | null
): string {
  if (actionType === "avatarUnlock" && priceCoins !== null) {
    return `Unlock for ${priceCoins.toLocaleString()} coins`
  }
  if (actionType === "roomUnlock" && priceCoins !== null) {
    return `Unlock for ${priceCoins.toLocaleString()} coins`
  }
  if (actionType === "avatarEquip") return "Equip"
  if (actionType === "roomPlace") return "Place in Room"
  return "Preview only"
}

function getAvatarEyebrow(item: AvatarCatalogItem): string {
  if (item.type === "accessory") return "Avatar accessory"
  return `Avatar ${item.type}`
}

function getAvatarDescription(
  item: AvatarCatalogItem,
  priceCoins: number | null
): string {
  if (priceCoins !== null && priceCoins > 0) {
    return "A premium wearable for the cozy avatar world. Preview it before spending coins."
  }
  return "A wardrobe item that updates your saved AvatarV2 look when equipped."
}

function getRoomEyebrow(item: FurnitureItem): string {
  if (item.category === "wallDecor") return "Room wall decor"
  return `Room ${item.category}`
}

function getRoomDescription(item: FurnitureItem): string {
  if (item.interactionType === "seat") {
    return "A grounded room piece that can be placed into your saved My Room layout."
  }
  return "A cozy decor piece that can be placed into your saved My Room layout."
}

function getStatusEyebrow(item: StatusCardCatalogItem): string {
  if (item.category === "chatBubble") return "Chat identity"
  if (item.category === "entranceEffect") return "Match identity"
  return `Status ${item.previewLabel.toLowerCase()}`
}
