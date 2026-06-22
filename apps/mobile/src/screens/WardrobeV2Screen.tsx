import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useMemo, useState } from "react"
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
import { AVATAR_V2_CATEGORIES } from "../features/avatarV2/avatarV2.mock"
import {
  getAvatarV2ItemsByType,
  isAvatarV2ItemEquipped
} from "../features/avatarV2/avatarV2Selectors"
import { AvatarPreview2D } from "../features/avatarV2/components/AvatarPreview2D"
import { roomAvatarLayerAssets } from "../features/avatarV2/room/avatarRoomAssets"
import { ROOM_AVATAR_CATALOG } from "../features/avatarV2/room/avatarRoom.mock"
import {
  DEFAULT_AVATAR_ROOM_PROJECTION_MAP,
  projectAvatarV2ToRoomAvatarAppearance
} from "../features/avatarV2/room/avatarRoomProjection"
import { getRoomAvatarMotionReadinessSummary } from "../features/avatarV2/room/avatarRoomSelectors"
import type {
  AvatarAnimationState,
  AvatarCatalogItem,
  AvatarItemType
} from "../features/avatarV2/avatarV2.types"
import type { RoomAvatarMotionReadinessLevel } from "../features/avatarV2/room/avatarRoom.types"
import { useAvatarV2 } from "../features/avatarV2/state/AvatarV2Provider"
import { buildAvatarShopCatalogItem } from "../features/shop/shopCatalog"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { hapticError, hapticLight, hapticSuccess } from "../ui/haptics"
import { uiTheme } from "../ui/theme"

type WardrobeV2ScreenProps = NativeStackScreenProps<RootStackParamList, "WardrobeV2">

/** Set to true to show debug indicators (Mock pill). */
const SHOW_DEBUG_UI = false

const CATEGORY_ICONS: Record<AvatarItemType, keyof typeof Ionicons.glyphMap> = {
  body: "body",
  face: "happy",
  hair: "sparkles",
  top: "shirt",
  bottom: "layers",
  shoes: "walk",
  accessory: "glasses"
}

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

const PREVIEW_MOTION_MODES: Array<{
  state: AvatarAnimationState
  label: string
  icon: keyof typeof Ionicons.glyphMap
}> = [
  { state: "idle_front", label: "Idle", icon: "accessibility" },
  { state: "walk_front", label: "Walk", icon: "walk" },
  { state: "sit_front", label: "Sit", icon: "body" }
]

export function WardrobeV2Screen(props: WardrobeV2ScreenProps) {
  const { navigation } = props
  const [activeType, setActiveType] = useState<AvatarItemType>("top")
  const [previewMotionState, setPreviewMotionState] =
    useState<AvatarAnimationState>("idle_front")
  const { avatar, catalog, inventory, canEquipItem, equipItem } = useAvatarV2()

  const activeItems = useMemo(
    () => getAvatarV2ItemsByType(catalog, activeType),
    [activeType, catalog]
  )
  const roomAvatarAppearance = useMemo(
    () => projectAvatarV2ToRoomAvatarAppearance({
      avatar,
      avatarCatalog: catalog,
      roomAvatarCatalog: ROOM_AVATAR_CATALOG
    }).appearance,
    [avatar, catalog]
  )
  const roomMotionReadiness = useMemo(
    () => getRoomAvatarMotionReadinessSummary({
      appearance: roomAvatarAppearance,
      catalog: ROOM_AVATAR_CATALOG
    }),
    [roomAvatarAppearance]
  )
  const readinessTone = getReadinessTone(roomMotionReadiness.level)
  const readinessCopy = getWardrobeReadinessCopy(roomMotionReadiness.level)
  const motionRequirementPreview = roomMotionReadiness.requirementSummaries.slice(0, 3)

  const equippedLabel = useMemo(() => {
    const equipped = activeItems.find((item) =>
      isAvatarV2ItemEquipped(avatar, item)
    )
    if (!equipped) return `${activeType} ready`
    if (!isAvatarItemRoomPreviewSupported(equipped)) {
      return `${equipped.name} room art pending`
    }
    return `${equipped.name} equipped`
  }, [activeItems, activeType, avatar])
  const visibleActiveItems = useMemo(
    () =>
      [...activeItems].sort((left, right) => {
        const leftEquipped = isAvatarV2ItemEquipped(avatar, left)
        const rightEquipped = isAvatarV2ItemEquipped(avatar, right)
        if (leftEquipped === rightEquipped) return 0
        return leftEquipped ? -1 : 1
      }),
    [activeItems, avatar]
  )

  const handleEquip = (item: AvatarCatalogItem): void => {
    hapticLight()
    if (!equipItem(item)) {
      hapticError()
      return
    }
    hapticSuccess()
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed ? styles.iconButtonPressed : null
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={uiTheme.colors.textPrimary} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Wardrobe</Text>
            <Text style={styles.subtitle}>Try on your favorite look</Text>
          </View>
          {SHOW_DEBUG_UI ? (
            <View style={styles.statusPill}>
              <Ionicons name="flash" size={13} color={uiTheme.colors.primary} />
              <Text style={styles.statusPillText}>Mock</Text>
            </View>
          ) : null}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <AvatarPreview2D
            avatar={avatar}
            catalog={catalog}
            animationState={previewMotionState}
            selectedType={activeType}
            label={equippedLabel}
            metaTone="light"
            size={238}
            stageHeight={356}
          />

          <View style={styles.motionPreviewRow}>
            {PREVIEW_MOTION_MODES.map((mode) => {
              const active = mode.state === previewMotionState
              return (
                <Pressable
                  key={mode.state}
                  testID={`wardrobe-motion-preview-${mode.state}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Preview ${mode.label} room motion`}
                  accessibilityState={{ selected: active }}
                  hitSlop={6}
                  onPressIn={() => {
                    hapticLight()
                    setPreviewMotionState(mode.state)
                  }}
                  style={[
                    styles.motionPreviewButton,
                    active ? styles.motionPreviewButtonActive : null
                  ]}
                >
                  <Ionicons
                    name={mode.icon}
                    size={14}
                    color={active ? "#FFFFFF" : uiTheme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.motionPreviewButtonText,
                      active ? styles.motionPreviewButtonTextActive : null
                    ]}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.motionStatusStrip}>
            <View style={styles.motionStatusLead}>
              <View
                style={[
                  styles.motionStatusIcon,
                  { backgroundColor: readinessTone.backgroundColor }
                ]}
              >
                <Ionicons
                  name={readinessTone.icon}
                  size={15}
                  color={readinessTone.color}
                />
              </View>
              <Text style={styles.motionStatusTitle} numberOfLines={1}>
                {readinessCopy.title}
              </Text>
            </View>
            <View style={styles.motionStatusChips}>
              {motionRequirementPreview.map((requirement) => (
                <View
                  key={requirement.label}
                  style={[
                    styles.motionStatusChip,
                    requirement.isReady ? styles.motionStatusChipReady : null
                  ]}
                >
                  <Text
                    style={[
                      styles.motionStatusChipText,
                      requirement.isReady ? styles.motionStatusChipTextReady : null
                    ]}
                  >
                    {getMotionRequirementShortLabel(requirement.label)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {AVATAR_V2_CATEGORIES.map((category) => {
              const active = category.type === activeType
              return (
                <Pressable
                  key={category.type}
                  onPress={() => {
                    hapticLight()
                    setActiveType(category.type)
                  }}
                  style={[
                    styles.categoryTab,
                    active ? styles.categoryTabActive : null
                  ]}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[category.type]}
                    size={17}
                    color={active ? "#FFFFFF" : uiTheme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryTabText,
                      active ? styles.categoryTabTextActive : null
                    ]}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={styles.selectedLookBar}>
            <Ionicons
              name={CATEGORY_ICONS[activeType]}
              size={16}
              color={uiTheme.colors.chipText}
            />
            <Text style={styles.selectedLookText} numberOfLines={1}>
              {equippedLabel}
            </Text>
          </View>

          <View style={styles.grid}>
            {visibleActiveItems.map((item) => {
              const catalogItem = buildAvatarShopCatalogItem({
                item,
                avatar,
                inventory
              })
              const canEquip = canEquipItem(item)
              const roomPreviewSupported = isAvatarItemRoomPreviewSupported(item)
              const locked = !canEquip || !roomPreviewSupported
              const equipped = isAvatarV2ItemEquipped(avatar, item) && roomPreviewSupported
              const previewSource = getAvatarItemPreviewSource(item)
              const itemStateLabel = !roomPreviewSupported
                ? "Room art pending"
                : locked
                  ? catalogItem.stateLabel
                  : "Try on"
              return (
                <Pressable
                  key={item.id}
                  disabled={locked}
                  onPress={() => handleEquip(item)}
                  style={({ pressed }) => [
                    styles.itemCard,
                    equipped ? styles.itemCardEquipped : null,
                    locked ? styles.itemCardLocked : null,
                    pressed ? styles.itemCardPressed : null
                  ]}
                >
                  <View style={styles.itemPreviewStage}>
                    <View style={styles.itemPreviewHalo} />
                    {previewSource ? (
                      <Image
                        source={previewSource}
                        resizeMode="contain"
                        style={[
                          styles.itemPreviewImage,
                          getAvatarItemPreviewImageStyle(item)
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.itemIconShell,
                          equipped ? styles.itemIconShellEquipped : null
                        ]}
                      >
                        <Ionicons
                          name={locked ? "lock-closed" : CATEGORY_ICONS[item.type]}
                          size={20}
                          color={equipped ? "#FFFFFF" : uiTheme.colors.primary}
                        />
                      </View>
                    )}
                    {equipped ? (
                      <View style={styles.itemCheckBadge}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View
                    style={[
                      styles.itemMetaPill,
                      equipped ? styles.itemMetaPillEquipped : null,
                      locked ? styles.itemMetaLocked : null
                    ]}
                  >
                    <Text style={styles.itemMeta} numberOfLines={1}>
                      {equipped ? "Wearing" : itemStateLabel}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

function getReadinessTone(level: RoomAvatarMotionReadinessLevel): {
  icon: keyof typeof Ionicons.glyphMap
  color: string
  backgroundColor: string
} {
  switch (level) {
    case "motionReady":
      return {
        icon: "checkmark-circle",
        color: "#8FFFD1",
        backgroundColor: "rgba(143,255,209,0.16)"
      }
    case "idleReady":
      return {
        icon: "sparkles",
        color: "#FFD1E3",
        backgroundColor: "rgba(255,79,152,0.18)"
      }
    case "notReady":
      return {
        icon: "alert-circle",
        color: "#FFE1A8",
        backgroundColor: "rgba(255,225,168,0.16)"
      }
  }
}

function getWardrobeReadinessCopy(level: RoomAvatarMotionReadinessLevel): {
  title: string
  body: string
} {
  switch (level) {
    case "motionReady":
      return {
        title: "Room motion ready",
        body: "This look has dedicated room art for idle, walking, and sitting."
      }
    case "idleReady":
      return {
        title: "Room look ready",
        body: "Your avatar appears in rooms now. Walk and sit still need dedicated motion art."
      }
    case "notReady":
      return {
        title: "Room art incomplete",
        body: "Some equipped pieces need room-ready artwork before this look can be trusted in rooms."
      }
  }
}

function formatWardrobeMotionRequirementLabel(label: string): string {
  return label.replace(" front", "")
}

function getMotionRequirementShortLabel(label: string): string {
  const normalized = label.toLowerCase()
  if (normalized.includes("idle")) return "Idle"
  if (normalized.includes("walk")) return "Walk"
  if (normalized.includes("sit")) return "Sit"
  return formatWardrobeMotionRequirementLabel(label)
}

function getAvatarItemPreviewSource(
  item: AvatarCatalogItem
): ImageSourcePropType | undefined {
  return AVATAR_ITEM_PREVIEW_SOURCES[item.id]
}

function isAvatarItemRoomPreviewSupported(item: AvatarCatalogItem): boolean {
  return item.id in DEFAULT_AVATAR_ROOM_PROJECTION_MAP
}

function getAvatarItemPreviewImageStyle(item: AvatarCatalogItem): {
  width: number
  height: number
  transform: Array<{ translateY: number }>
} {
  if (item.type === "top") {
    if (item.id === "avatar_v2_top_default" || item.id === "avatar_v2_top_cream_basic_tee") {
      return { width: 170, height: 255, transform: [{ translateY: -24 }] }
    }
    return { width: 178, height: 267, transform: [{ translateY: -60 }] }
  }
  if (item.type === "bottom") {
    return { width: 196, height: 294, transform: [{ translateY: -116 }] }
  }
  if (item.type === "shoes") {
    return { width: 196, height: 294, transform: [{ translateY: -130 }] }
  }
  return { width: 142, height: 213, transform: [{ translateY: -32 }] }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.md,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  iconButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }],
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
  },
  subtitle: {
    ...uiTheme.font.caption,
    marginTop: 2,
    color: uiTheme.colors.textSecondary,
  },
  statusPill: {
    minWidth: 70,
    height: 34,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  statusPillText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xxxl,
  },
  motionPreviewRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: uiTheme.spacing.sm,
    padding: 5,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  motionPreviewButton: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 14,
    backgroundColor: "#FFF7FB",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  motionPreviewButtonActive: {
    backgroundColor: "rgba(255,79,152,0.7)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  motionPreviewButtonText: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textSecondary,
    fontWeight: "900",
  },
  motionPreviewButtonTextActive: {
    color: "#FFFFFF",
  },
  motionStatusStrip: {
    marginTop: uiTheme.spacing.sm,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  motionStatusLead: {
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  motionStatusIcon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  motionStatusTitle: {
    ...uiTheme.font.captionBold,
    flex: 1,
    minWidth: 0,
    color: uiTheme.colors.textPrimary,
  },
  motionStatusChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  motionStatusChip: {
    minHeight: 24,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FFF3FA",
    borderWidth: 1,
    borderColor: "#F5D7E8",
  },
  motionStatusChipReady: {
    backgroundColor: "#EFFFF7",
    borderColor: "#BFEEDB",
  },
  motionStatusChipText: {
    ...uiTheme.font.micro,
    color: "#FFB4D4",
    fontWeight: "900",
  },
  motionStatusChipTextReady: {
    color: "#33825F",
  },
  motionStatusNext: {
    ...uiTheme.font.micro,
    width: "100%",
    color: uiTheme.colors.textSecondary,
    fontWeight: "800",
  },
  roomReadinessCard: {
    marginTop: uiTheme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    padding: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.075)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  roomReadinessIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roomReadinessCopy: {
    flex: 1,
    minWidth: 0,
  },
  roomReadinessTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.sm,
  },
  roomReadinessSlice: {
    ...uiTheme.font.overline,
    marginBottom: 3,
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
  },
  roomReadinessTitle: {
    ...uiTheme.font.bodySmall,
    flex: 1,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  roomReadinessCount: {
    ...uiTheme.font.captionBold,
    color: "#FFFFFF",
  },
  roomReadinessStatePill: {
    minWidth: 50,
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  roomReadinessStateDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  roomReadinessBody: {
    ...uiTheme.font.caption,
    marginTop: 2,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 18,
  },
  motionCoverageRail: {
    flexDirection: "row",
    gap: 6,
    marginTop: 9,
  },
  motionCoverageChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,180,212,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,180,212,0.2)",
  },
  motionCoverageChipReady: {
    backgroundColor: "rgba(143,255,209,0.1)",
    borderColor: "rgba(143,255,209,0.22)",
  },
  motionCoverageChipText: {
    ...uiTheme.font.micro,
    minWidth: 0,
    color: "#FFB4D4",
    fontSize: 10,
  },
  motionCoverageChipTextReady: {
    color: "#C9FFE9",
  },
  motionGestureRow: {
    marginTop: 8,
    gap: 6,
  },
  motionGestureLabel: {
    ...uiTheme.font.overline,
    color: "rgba(255,255,255,0.46)",
    fontSize: 9,
  },
  motionGestureRail: {
    flexDirection: "row",
    gap: 6,
  },
  motionGestureChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: "rgba(255,180,212,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,180,212,0.16)",
  },
  motionGestureChipReady: {
    backgroundColor: "rgba(143,255,209,0.09)",
    borderColor: "rgba(143,255,209,0.2)",
  },
  motionGestureChipText: {
    ...uiTheme.font.micro,
    minWidth: 0,
    color: "#FFB4D4",
    fontSize: 10,
  },
  motionGestureChipTextReady: {
    color: "#C9FFE9",
  },
  motionProductionGate: {
    marginTop: 8,
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  motionProductionGateText: {
    ...uiTheme.font.micro,
    flex: 1,
    minWidth: 0,
    color: "rgba(255,255,255,0.66)",
    fontSize: 10,
  },
  roomReadinessNext: {
    ...uiTheme.font.captionBold,
    marginTop: 4,
    color: "#FFB4D4",
  },
  roomReadinessLayer: {
    ...uiTheme.font.caption,
    marginTop: 3,
    color: "rgba(255,255,255,0.52)",
    fontWeight: "800",
  },
  categoryRow: {
    gap: 8,
    paddingTop: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.sm,
  },
  categoryTab: {
    minWidth: 86,
    height: 44,
    borderRadius: uiTheme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  categoryTabActive: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: "rgba(255,255,255,0.2)",
  },
  selectedLookBar: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: uiTheme.spacing.md,
    marginBottom: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FFF0F8",
    borderWidth: 1,
    borderColor: "#F4CFE4",
  },
  selectedLookText: {
    ...uiTheme.font.captionBold,
    flex: 1,
    minWidth: 0,
    color: uiTheme.colors.chipText,
  },
  categoryTabText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.textSecondary,
  },
  categoryTabTextActive: {
    color: "#FFFFFF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm,
  },
  itemCard: {
    width: "48%",
    minHeight: 172,
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 9,
    padding: 10,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
    overflow: "hidden",
    ...uiTheme.shadow.float,
  },
  itemCardEquipped: {
    backgroundColor: "#FFF3FA",
    borderColor: uiTheme.colors.primary,
    shadowColor: "#FF4F98",
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  itemCardLocked: {
    opacity: 0.48,
  },
  itemCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  itemPreviewStage: {
    position: "relative",
    width: "100%",
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#FFF2F8",
    overflow: "hidden",
  },
  itemPreviewHalo: {
    position: "absolute",
    bottom: 16,
    width: 88,
    height: 50,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#EAC3D9",
    opacity: 0.7,
  },
  itemPreviewImage: {
    alignSelf: "center",
  },
  itemTopRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemIconShell: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7FB",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  itemIconShellEquipped: {
    backgroundColor: uiTheme.colors.primary,
  },
  itemCheckBadge: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#31B67A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  itemName: {
    ...uiTheme.font.bodySmall,
    maxWidth: "100%",
    color: uiTheme.colors.textPrimary,
    fontWeight: "900",
    textAlign: "left",
  },
  itemMetaPill: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: "#F4DDEB",
  },
  itemMetaPillEquipped: {
    backgroundColor: "#EFFFF7",
    borderColor: "#BFEEDB",
  },
  itemMeta: {
    ...uiTheme.font.captionBold,
    maxWidth: "100%",
    color: uiTheme.colors.chipText,
    textAlign: "center",
  },
  itemMetaLocked: {
    opacity: 0.78,
  },
})
