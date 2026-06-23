import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useMemo, useState } from "react"
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AVATAR_V2_CATALOG } from "../features/avatarV2/avatarV2.mock"
import {
  equipAvatarV2Item,
} from "../features/avatarV2/avatarV2Selectors"
import { AvatarPreview2D } from "../features/avatarV2/components/AvatarPreview2D"
import { useAvatarV2 } from "../features/avatarV2/state/AvatarV2Provider"
import { useInventoryStore } from "../features/inventory/inventoryStore"
import { RoomRenderer2D } from "../features/roomV2/components/RoomRenderer2D"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import { resolveRoomV2Scene } from "../features/roomV2/roomV2Selectors"
import { useRoomV2 } from "../features/roomV2/state/RoomV2Provider"
import type {
  FurnitureItem,
  RoomFurnitureRotation,
  UserRoomDecor
} from "../features/roomV2/roomV2.types"
import {
  buildShopCatalogItems,
  type ShopCatalogItem,
  type StatusCardCatalogItem
} from "../features/shop/shopCatalog"
import { roomAvatarLayerAssets } from "../features/avatarV2/room/avatarRoomAssets"
import { getAvatarAutomationSlug } from "../features/avatarV2/qa/avatarQaInventory"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { hapticError, hapticLight, hapticSuccess } from "../ui/haptics"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { showToast } from "../ui/toast"

type CosmeticShopScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CosmeticShop"
>

const PRODUCT_REFERENCE_AVATAR_ITEM_IDS = new Set([
  "avatar_v2_top_lilac_offshoulder_bow_blouse",
  "avatar_v2_bottom_floral_embroidered_skort_shorts",
  "avatar_v2_top_silver_sequin_halter_top",
  "avatar_v2_bottom_pink_embellished_wide_pants",
  "avatar_v2_bottom_patchwork_bow_mini_skirt",
  "avatar_v2_top_silver_lace_ruffle_dress_top",
  "avatar_v2_bottom_silver_lace_ruffle_dress_bottom",
  "avatar_v2_top_red_floral_bikini_top",
  "avatar_v2_bottom_white_embellished_wide_pants",
  "avatar_v2_shoes_white_sneakers"
])
const INITIAL_PRODUCT_REFERENCE_SHOP_ITEM_ID =
  "avatar:avatar_v2_top_lilac_offshoulder_bow_blouse"
const AVATAR_ITEM_PREVIEW_SOURCES: Partial<Record<string, ImageSourcePropType>> = {
  avatar_v2_top_default: roomAvatarLayerAssets.topFemaleCreamBasicTeeV2.source,
  avatar_v2_bottom_default: roomAvatarLayerAssets.bottomFemaleDenimSkortShortsV2.source,
  avatar_v2_shoes_default: roomAvatarLayerAssets.shoesFemaleDefaultV2.source,
  avatar_v2_top_lilac_offshoulder_bow_blouse:
    roomAvatarLayerAssets.topFemaleLilacOffshoulderBowBlouseV2.source,
  avatar_v2_bottom_floral_embroidered_skort_shorts:
    roomAvatarLayerAssets.bottomFemaleFloralEmbroideredSkortShortsV2.source,
  avatar_v2_shoes_white_sneakers:
    roomAvatarLayerAssets.shoesFemaleWhiteSneakersV2.source,
  avatar_v2_top_silver_sequin_halter_top:
    roomAvatarLayerAssets.topFemaleSilverSequinHalterTopV2.source,
  avatar_v2_bottom_pink_embellished_wide_pants:
    roomAvatarLayerAssets.bottomFemalePinkEmbellishedWidePantsV2.source,
  avatar_v2_bottom_patchwork_bow_mini_skirt:
    roomAvatarLayerAssets.bottomFemalePatchworkBowMiniSkirtV2.source,
  avatar_v2_top_silver_lace_ruffle_dress_top:
    roomAvatarLayerAssets.topFemaleSilverLaceRuffleDressTopV2.source,
  avatar_v2_bottom_silver_lace_ruffle_dress_bottom:
    roomAvatarLayerAssets.bottomFemaleSilverLaceRuffleDressBottomV2.source,
  avatar_v2_top_red_floral_bikini_top:
    roomAvatarLayerAssets.topFemaleRedFloralBikiniTopV2.source,
  avatar_v2_bottom_white_embellished_wide_pants:
    roomAvatarLayerAssets.bottomFemaleWhiteEmbellishedWidePantsV2.source
}

export function CosmeticShopScreen(props: CosmeticShopScreenProps) {
  const { navigation } = props
  const avatarV2 = useAvatarV2()
  const inventoryStore = useInventoryStore()
  const roomV2 = useRoomV2()
  const [selectedId, setSelectedId] = useState(INITIAL_PRODUCT_REFERENCE_SHOP_ITEM_ID)

  const shopItems = useMemo(
    () =>
      buildShopCatalogItems({
        inventory: inventoryStore.inventory,
        avatar: avatarV2.avatar,
        roomDecor: roomV2.userRoomDecor
      }),
    [avatarV2.avatar, inventoryStore.inventory, roomV2.userRoomDecor]
  )

  const avatarProducts = useMemo(
    () => sortAvatarShopProducts(
      shopItems.filter((item) => item.sectionId === "avatar")
    ),
    [shopItems]
  )
  const roomProducts = useMemo(
    () => shopItems.filter((item) => item.sectionId === "room"),
    [shopItems]
  )
  const statusProducts = useMemo(
    () => shopItems.filter((item) => item.sectionId === "status"),
    [shopItems]
  )
  const myItems = useMemo(
    () =>
      shopItems.filter((item) =>
        item.owned &&
        (item.previewType === "avatar" || item.previewType === "room")
      ),
    [shopItems]
  )

  const selectedProduct = useMemo(
    () =>
      shopItems.find((product) => product.id === selectedId)
        ?? avatarProducts[0]
        ?? roomProducts[0]
        ?? statusProducts[0],
    [avatarProducts, roomProducts, selectedId, shopItems, statusProducts]
  )

  const previewAvatar = useMemo(() => {
    if (selectedProduct?.previewType !== "avatar" || !selectedProduct.avatarItem) {
      return avatarV2.avatar
    }
    return equipAvatarV2Item(avatarV2.avatar, selectedProduct.avatarItem)
  }, [avatarV2.avatar, selectedProduct])

  const roomPreviewScene = useMemo(() => {
    const selectedRoomItem =
      selectedProduct?.previewType === "room"
        ? selectedProduct.roomItem
        : roomProducts[0]?.roomItem
    if (!selectedRoomItem) {
      return resolveRoomV2Scene({
        roomShellCatalog: ROOM_V2_SHELL_CATALOG,
        furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
        decor: { roomShellId: DEFAULT_ROOM_V2_SHELL_ID, placedItems: [] },
        defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
      })
    }
    return resolveRoomV2Scene({
      roomShellCatalog: ROOM_V2_SHELL_CATALOG,
      furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
      decor: createRoomPreviewDecor(selectedRoomItem),
      defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
    })
  }, [roomProducts, selectedProduct])

  const handleSelectProduct = useCallback((product: ShopCatalogItem): void => {
    hapticLight()
    setSelectedId(product.id)
  }, [])

  const handlePrimaryAction = useCallback((): void => {
    if (!selectedProduct) return

    if (selectedProduct.actionType === "avatarUnlock") {
      if (selectedProduct.priceCoins === null) {
        hapticError()
        showToast({
          title: "Preview only",
          body: selectedProduct.disabledReason,
          type: "warning"
        })
        return
      }
      const result = inventoryStore.unlockAvatarItem(
        selectedProduct.sourceItemId,
        selectedProduct.priceCoins
      )
      if (!result.success) {
        hapticError()
        showToast({
          title: getUnlockFailureTitle(result.reason),
          type: "warning"
        })
        return
      }
      hapticSuccess()
      showToast({
        title: `${selectedProduct.title} unlocked`,
        body: "Tap Equip to make it visible on your avatar.",
        type: "success"
      })
      return
    }

    if (selectedProduct.actionType === "avatarEquip") {
      if (!selectedProduct.avatarItem || !avatarV2.equipItem(selectedProduct.avatarItem)) {
        hapticError()
        showToast({
          title: "Unlock before equipping",
          type: "warning"
        })
        return
      }
      hapticSuccess()
      showToast({
        title: `${selectedProduct.title} equipped`,
        body: "Your saved avatar updates across DateVibe.",
        type: "success"
      })
      return
    }

    if (selectedProduct.actionType === "roomUnlock") {
      if (!selectedProduct.roomItem || selectedProduct.priceCoins === null) {
        hapticError()
        showToast({
          title: "Preview only",
          body: selectedProduct.disabledReason,
          type: "warning"
        })
        return
      }
      const result = inventoryStore.unlockRoomItem(
        selectedProduct.sourceItemId,
        selectedProduct.priceCoins
      )
      if (!result.success) {
        hapticError()
        showToast({
          title: getUnlockFailureTitle(result.reason),
          type: "warning"
        })
        return
      }
      hapticSuccess()
      showToast({
        title: `${selectedProduct.title} unlocked`,
        body: "Place it in Edit Room, then save your room.",
        type: "success"
      })
      navigation.navigate("MyRoomV2Preview", {
        placementItemId: selectedProduct.sourceItemId
      })
      return
    }

    if (selectedProduct.actionType === "roomPlace") {
      if (!selectedProduct.roomItem) {
        hapticError()
        showToast({
          title: "Room item unavailable",
          type: "warning"
        })
        return
      }
      hapticSuccess()
      showToast({
        title: `${selectedProduct.title} ready to place`,
        body: "Position it in Edit Room, then save your room.",
        type: "success"
      })
      navigation.navigate("MyRoomV2Preview", {
        placementItemId: selectedProduct.sourceItemId
      })
      return
    }

    if (selectedProduct.actionType === "disabled") {
      if (selectedProduct.disabledReason) {
        hapticError()
        showToast({
          title: selectedProduct.actionLabel,
          body: selectedProduct.disabledReason,
          type: "warning"
        })
      }
      return
    }
  }, [avatarV2, inventoryStore, navigation, roomV2, selectedProduct])

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <TopBar
          title="Shop"
          subtitle="Curated drops for your avatar"
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              <Ionicons name="chevron-back" size={20} color={uiTheme.colors.textPrimary} />
            </ActionButtonCircle>
          }
          rightSlot={
            <View style={styles.coinPill}>
              <Ionicons name="diamond" size={14} color="#B9820D" />
              <Text style={styles.coinText}>
                {inventoryStore.inventory.coins.toLocaleString()}
              </Text>
            </View>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <SelectedProductPreview
            product={selectedProduct}
            previewAvatar={previewAvatar}
            roomPreviewScene={roomPreviewScene}
            onPrimaryAction={handlePrimaryAction}
          />

          <ShopSection
            title="My Items"
            subtitle="Owned looks and room pieces."
            products={myItems}
            selectedId={selectedProduct?.id}
            onSelect={handleSelectProduct}
            getMetaLabel={getMyItemStateLabel}
          />

          <ShopSection
            title="Avatar Wearables"
            subtitle="Preview the drop, then unlock."
            products={avatarProducts}
            selectedId={selectedProduct?.id}
            onSelect={handleSelectProduct}
          />

          <ShopSection
            title="Room Pieces"
            subtitle="Cozy pieces for your space."
            products={roomProducts}
            selectedId={selectedProduct?.id}
            onSelect={handleSelectProduct}
          />

          <ShopSection
            title="Status Styles"
            subtitle="Profile polish for later."
            products={statusProducts}
            selectedId={selectedProduct?.id}
            onSelect={handleSelectProduct}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function sortAvatarShopProducts(products: ShopCatalogItem[]): ShopCatalogItem[] {
  return [...products].sort((left, right) => {
    const priorityDelta =
      getAvatarShopProductPriority(left) - getAvatarShopProductPriority(right)
    if (priorityDelta !== 0) return priorityDelta
    return left.title.localeCompare(right.title)
  })
}

function getAvatarShopProductPriority(product: ShopCatalogItem): number {
  if (PRODUCT_REFERENCE_AVATAR_ITEM_IDS.has(product.sourceItemId)) return 0
  if (product.priceCoins !== null) return 1
  return 2
}

function SelectedProductPreview(props: {
  product: ShopCatalogItem | undefined
  previewAvatar: ReturnType<typeof equipAvatarV2Item>
  roomPreviewScene: ReturnType<typeof resolveRoomV2Scene>
  onPrimaryAction: () => void
}) {
  const { product, previewAvatar, roomPreviewScene, onPrimaryAction } = props
  if (!product) return null

  const disabled = product.actionType === "disabled"

  return (
    <View
      testID="shop-selected-product-preview"
      accessibilityLabel={`${product.title}, ${product.stateLabel}`}
      style={styles.previewCard}
    >
      <View style={styles.previewHeader}>
        <View>
          <Text style={styles.previewEyebrow}>{product.eyebrow}</Text>
          <Text style={styles.previewTitle} numberOfLines={2}>
            {product.title}
          </Text>
        </View>
        <View style={styles.statePill}>
          <Text style={styles.stateText}>{product.stateLabel}</Text>
        </View>
      </View>

      <View
        style={[
          styles.previewStage,
          product.previewType === "avatar"
            ? styles.previewStageAvatar
            : null
        ]}
      >
        {product.previewType === "avatar" ? (
          <AvatarPreview2D
            avatar={previewAvatar}
            catalog={AVATAR_V2_CATALOG}
            size={210}
            stageHeight={282}
            label="Preview on avatar"
            metaTone="light"
          />
        ) : product.previewType === "room" ? (
          <RoomRenderer2D
            shell={roomPreviewScene.shell}
            renderItems={roomPreviewScene.renderItems}
            style={styles.roomPreviewRenderer}
            testID="shop-room-preview"
          />
        ) : (
          <StatusCardPreview item={product.statusCardItem} />
        )}
      </View>

      <Text style={styles.previewDescription}>{product.description}</Text>
      <Pressable
        testID="shop-preview-primary-action"
        accessibilityRole="button"
        accessibilityLabel={product.actionLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPrimaryAction}
        style={({ pressed }) => [
          styles.primaryAction,
          disabled ? styles.primaryActionDisabled : null,
          pressed && !disabled ? styles.primaryActionPressed : null
        ]}
      >
        <Text style={styles.primaryActionText}>{product.actionLabel}</Text>
      </Pressable>
    </View>
  )
}

function ShopSection(props: {
  title: string
  subtitle: string
  products: ShopCatalogItem[]
  selectedId: string | undefined
  onSelect: (product: ShopCatalogItem) => void
  getMetaLabel?: (product: ShopCatalogItem) => string
}) {
  const sectionSlug = props.title.toLowerCase().replaceAll(" ", "-")
  return (
    <View
      testID={`shop-${sectionSlug}-section`}
      accessibilityLabel={`${props.title} section`}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{props.title}</Text>
        <Text style={styles.sectionSubtitle}>{props.subtitle}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productRow}
      >
        {props.products.map((product) => (
          <ShopProductCard
            key={product.id}
            product={product}
            selected={product.id === props.selectedId}
            metaLabel={props.getMetaLabel?.(product)}
            onPress={() => props.onSelect(product)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function ShopProductCard(props: {
  product: ShopCatalogItem
  selected: boolean
  metaLabel?: string
  onPress: () => void
}) {
  const { product, selected, metaLabel, onPress } = props
  const avatarPreviewSource = product.avatarItem
    ? getAvatarItemPreviewSource(product.avatarItem)
    : undefined
  const productReference = PRODUCT_REFERENCE_AVATAR_ITEM_IDS.has(product.sourceItemId)
  const automationSlug = product.avatarItem
    ? getAvatarAutomationSlug(product.sourceItemId)
    : product.sourceItemId.replaceAll("_", "-")
  return (
    <Pressable
      testID={`shop-item-${automationSlug}`}
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${metaLabel ?? product.stateLabel}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.productCard,
        selected ? styles.productCardSelected : null,
        pressed ? styles.productCardPressed : null
      ]}
    >
      <View style={styles.productThumb}>
        {product.previewType === "avatar" ? (
          <View style={styles.productThumbHalo} />
        ) : null}
        {product.previewType === "avatar" && product.avatarItem ? (
          <AvatarProductThumbnail
            item={product.avatarItem}
            source={avatarPreviewSource}
            selected={selected}
          />
        ) : product.previewType === "room" && product.roomItem ? (
          <Image
            source={product.roomItem.asset.source}
            resizeMode="contain"
            style={styles.productImage}
          />
        ) : (
          <View
            style={[
              styles.productIconOrb,
              selected ? styles.productIconOrbSelected : null
            ]}
          >
            <Ionicons
              name={getStatusIcon(product.statusCardItem?.category)}
              size={24}
              color={selected ? "#FFFFFF" : product.statusCardItem?.accentColor ?? uiTheme.colors.primary}
            />
          </View>
        )}
        {productReference ? (
          <View style={styles.productDropBadge}>
            <Text style={styles.productDropBadgeText}>Drop</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.productTitle} numberOfLines={2}>
        {product.title}
      </Text>
      <View
        testID={`shop-item-${automationSlug}-price`}
        style={styles.productMetaPill}
      >
        <Text style={styles.productMeta} numberOfLines={1}>
          {metaLabel ?? product.stateLabel}
        </Text>
      </View>
    </Pressable>
  )
}

function AvatarProductThumbnail(props: {
  item: NonNullable<ShopCatalogItem["avatarItem"]>
  source: ImageSourcePropType | undefined
  selected: boolean
}) {
  const { item, source, selected } = props
  if (!source) {
    return (
      <View
        style={[
          styles.productIconOrb,
          selected ? styles.productIconOrbSelected : null
        ]}
      >
        <Ionicons
          name={getAvatarIcon(item.type)}
          size={24}
          color={selected ? "#FFFFFF" : uiTheme.colors.primary}
        />
      </View>
    )
  }

  return (
    <Image
      source={source}
      resizeMode="contain"
      style={[
        styles.productWearableImage,
        getAvatarItemPreviewImageStyle(item)
      ]}
    />
  )
}

function StatusCardPreview(props: {
  item: StatusCardCatalogItem | undefined
}) {
  const { item } = props
  const accentColor = item?.accentColor ?? uiTheme.colors.primary
  const accentSoftColor = item?.accentSoftColor ?? uiTheme.colors.primarySoft
  const previewLabel = item?.previewLabel ?? "Status"
  const surfaceLabel = getStatusSurfaceLabel(item?.surface)

  return (
    <View style={styles.statusPreview}>
      <View
        style={[
          styles.statusPreviewCard,
          {
            borderColor: accentColor,
            backgroundColor: accentSoftColor
          }
        ]}
      >
        <View style={styles.statusPreviewTopRow}>
          <View
            style={[
              styles.statusPreviewAvatarFrame,
              {
                borderColor: accentColor,
                backgroundColor: accentSoftColor
              }
            ]}
          >
            <Ionicons
              name={getStatusIcon(item?.category)}
              size={26}
              color={accentColor}
            />
          </View>
          <View style={styles.statusPreviewIdentity}>
            <Text style={styles.statusPreviewName} numberOfLines={1}>
              {previewLabel}
            </Text>
            <Text style={styles.statusPreviewSurface} numberOfLines={1}>
              {surfaceLabel}
            </Text>
          </View>
        </View>
        <View style={styles.statusPreviewLine} />
        <View style={styles.statusPreviewChips}>
          <View
            style={[
              styles.statusPreviewChip,
              {
                borderColor: accentColor,
                backgroundColor: accentSoftColor
              }
            ]}
          >
            <Text style={[styles.statusPreviewChipText, { color: accentColor }]}>
              Preview only
            </Text>
          </View>
          <View style={styles.statusPreviewBubble}>
            <Text style={styles.statusPreviewBubbleText} numberOfLines={1}>
              Not for sale yet
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function getMyItemStateLabel(product: ShopCatalogItem): string {
  if (product.previewType === "avatar") {
    return product.stateLabel === "Equipped" ? "Equipped" : "Unused"
  }
  if (product.previewType === "room") {
    return product.placedCount && product.placedCount > 0
      ? `${product.placedCount} placed`
      : "Unused"
  }
  return product.stateLabel
}

function getAvatarIcon(
  type: NonNullable<ShopCatalogItem["avatarItem"]>["type"]
): keyof typeof Ionicons.glyphMap {
  if (type === "hair") return "sparkles"
  if (type === "top") return "shirt"
  if (type === "bottom") return "layers"
  if (type === "shoes") return "walk"
  if (type === "accessory") return "glasses"
  return "person"
}

function getAvatarItemPreviewSource(
  item: NonNullable<ShopCatalogItem["avatarItem"]>
): ImageSourcePropType | undefined {
  return AVATAR_ITEM_PREVIEW_SOURCES[item.id]
}

function getAvatarItemPreviewImageStyle(
  item: NonNullable<ShopCatalogItem["avatarItem"]>
): {
  width: number
  height: number
  transform: Array<{ translateY: number }>
} {
  if (item.type === "top") {
    if (item.id === "avatar_v2_top_default" || item.id === "avatar_v2_top_cream_basic_tee") {
      return { width: 182, height: 273, transform: [{ translateY: -28 }] }
    }
    return { width: 190, height: 285, transform: [{ translateY: -64 }] }
  }
  if (item.type === "bottom") {
    return { width: 210, height: 315, transform: [{ translateY: -124 }] }
  }
  if (item.type === "shoes") {
    return { width: 210, height: 315, transform: [{ translateY: -140 }] }
  }
  return { width: 150, height: 225, transform: [{ translateY: -34 }] }
}

function getStatusIcon(
  category: StatusCardCatalogItem["category"] | undefined
): keyof typeof Ionicons.glyphMap {
  if (category === "frame") return "radio-button-on"
  if (category === "aura") return "sparkles"
  if (category === "badge") return "ribbon"
  if (category === "pose") return "body"
  if (category === "entranceEffect") return "flash"
  if (category === "chatBubble") return "chatbubble-ellipses"
  if (category === "nameplate") return "person"
  return "sparkles"
}

function getStatusSurfaceLabel(
  surface: StatusCardCatalogItem["surface"] | undefined
): string {
  if (surface === "discoverCard") return "Discover card"
  if (surface === "profileCard") return "Profile card"
  if (surface === "matchCard") return "Match card"
  if (surface === "chatIdentity") return "Chat identity"
  return "Card identity"
}

function getUnlockFailureTitle(reason: string | undefined): string {
  if (reason === "already_owned") return "Already owned"
  if (reason === "not_enough_coins") return "Not enough coins"
  if (reason === "invalid_item") return "Item unavailable"
  if (reason === "invalid_price") return "Invalid price"
  return "Unlock unavailable"
}

function createRoomPreviewDecor(item: FurnitureItem): UserRoomDecor {
  return {
    roomShellId: DEFAULT_ROOM_V2_SHELL_ID,
    placedItems: [
      {
        instanceId: "shop-preview-item",
        itemId: item.id,
        x: item.category === "wallDecor" ? 0.28 : 0.54,
        y: item.category === "wallDecor" ? 0.5 : 0.76,
        rotation: getDefaultFurnitureRotation(item)
      }
    ]
  }
}

function getDefaultFurnitureRotation(item: FurnitureItem): RoomFurnitureRotation {
  const rotations = item.assetsByRotation
    ? (Object.keys(item.assetsByRotation) as RoomFurnitureRotation[])
    : []
  if (rotations.length === 0 || rotations.includes("front")) return "front"
  return rotations[0]
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
  },
  scroll: {
    gap: uiTheme.spacing.xl,
    paddingBottom: 136,
  },
  coinPill: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FFF7D8",
    borderWidth: 1,
    borderColor: "#F1DE98",
  },
  coinText: {
    ...uiTheme.font.bodySmall,
    color: "#7B5708",
    fontWeight: "900",
  },
  previewCard: {
    gap: uiTheme.spacing.md,
    padding: uiTheme.spacing.lg,
    borderRadius: 30,
    backgroundColor: "#FFF8FC",
    borderWidth: 1,
    borderColor: "#F5DDEC",
    overflow: "hidden",
    ...uiTheme.shadow.deep,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: uiTheme.spacing.md,
  },
  previewEyebrow: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  previewTitle: {
    ...uiTheme.font.heading,
    marginTop: 2,
    color: uiTheme.colors.textPrimary,
  },
  statePill: {
    maxWidth: 132,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primarySoft,
  },
  stateText: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.chipText,
    textAlign: "center",
  },
  previewStage: {
    minHeight: 292,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: uiTheme.radius.xxl,
    backgroundColor: "#180D21",
    overflow: "hidden",
  },
  previewStageAvatar: {
    backgroundColor: "#FFF0F7",
    borderWidth: 1,
    borderColor: "#F4DCEB",
  },
  roomPreviewRenderer: {
    width: "132%",
    backgroundColor: "#160D1E",
  },
  statusPreview: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: uiTheme.spacing.lg,
  },
  statusPreviewCard: {
    width: "100%",
    maxWidth: 280,
    gap: uiTheme.spacing.md,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
  },
  statusPreviewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
  },
  statusPreviewAvatarFrame: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 2,
  },
  statusPreviewIdentity: {
    flex: 1,
    gap: 4,
  },
  statusPreviewName: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF",
  },
  statusPreviewSurface: {
    ...uiTheme.font.bodySmall,
    color: "rgba(255, 255, 255, 0.72)",
    fontWeight: "800",
  },
  statusPreviewLine: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  statusPreviewChips: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm,
  },
  statusPreviewChip: {
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
  },
  statusPreviewChipText: {
    ...uiTheme.font.micro,
  },
  statusPreviewBubble: {
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  statusPreviewBubbleText: {
    ...uiTheme.font.bodySmall,
    color: "rgba(255, 255, 255, 0.76)",
    fontWeight: "800",
  },
  previewDescription: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    fontWeight: "700",
    lineHeight: 20,
  },
  primaryAction: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    ...uiTheme.shadow.glow,
  },
  primaryActionPressed: {
    backgroundColor: uiTheme.colors.primaryPressed,
    transform: [{ scale: 0.99 }],
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF",
  },
  section: {
    gap: uiTheme.spacing.md,
  },
  sectionHeader: {
    gap: 3,
  },
  sectionTitle: {
    ...uiTheme.font.subheading,
    color: uiTheme.colors.textPrimary,
  },
  sectionSubtitle: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
  },
  productRow: {
    gap: uiTheme.spacing.md,
    paddingRight: uiTheme.spacing.lg,
  },
  productCard: {
    width: 174,
    minHeight: 204,
    gap: uiTheme.spacing.sm,
    padding: 10,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1E4F2",
    ...uiTheme.shadow.float,
  },
  productCardSelected: {
    borderColor: uiTheme.colors.primary,
    backgroundColor: "#FFF5FA",
  },
  productCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  productThumb: {
    position: "relative",
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFF2F8",
    overflow: "hidden",
  },
  productThumbHalo: {
    position: "absolute",
    bottom: 14,
    width: 94,
    height: 54,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#EAC3D9",
    opacity: 0.7,
  },
  productIconOrb: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2D9E9",
  },
  productIconOrbSelected: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: "rgba(255,255,255,0.5)",
  },
  productImage: {
    width: "86%",
    height: "86%",
  },
  productWearableImage: {
    alignSelf: "center",
  },
  productDropBadge: {
    position: "absolute",
    left: 8,
    top: 8,
    minHeight: 22,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "#F2D9E9",
  },
  productDropBadgeText: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.primary,
    fontWeight: "900",
  },
  productTitle: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textPrimary,
    fontWeight: "900",
  },
  productMetaPill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 9,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: "#F4DDEB",
  },
  productMeta: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.chipText,
  },
})
