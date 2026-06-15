import { Ionicons } from "@expo/vector-icons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useMemo, useState } from "react"
import {
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
import { ROOM_AVATAR_CATALOG } from "../features/avatarV2/room/avatarRoom.mock"
import { getRoomAvatarProductionMotionAudit } from "../features/avatarV2/room/avatarRoomProductionMotion"
import { projectAvatarV2ToRoomAvatarAppearance } from "../features/avatarV2/room/avatarRoomProjection"
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

const PREVIEW_MOTION_MODES: Array<{
  state: AvatarAnimationState
  label: string
  icon: keyof typeof Ionicons.glyphMap
}> = [
  { state: "idle_front", label: "Idle", icon: "accessibility" },
  { state: "walk_front", label: "Walk", icon: "walk" },
  { state: "sit_front", label: "Sit", icon: "body" },
  { state: "wave_front", label: "Wave", icon: "hand-left" }
]

export function WardrobeV2Screen(props: WardrobeV2ScreenProps) {
  const { navigation } = props
  const [activeType, setActiveType] = useState<AvatarItemType>("hair")
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
  const productionMotionAudit = useMemo(
    () => getRoomAvatarProductionMotionAudit({
      catalog: ROOM_AVATAR_CATALOG
    }),
    []
  )
  const readinessTone = getReadinessTone(roomMotionReadiness.level)
  const readinessCopy = getWardrobeReadinessCopy(roomMotionReadiness.level)

  const equippedLabel = useMemo(() => {
    const equipped = activeItems.find((item) =>
      isAvatarV2ItemEquipped(avatar, item)
    )
    return equipped ? `${equipped.name} equipped` : `${activeType} ready`
  }, [activeItems, activeType, avatar])

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
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Wardrobe</Text>
            <Text style={styles.subtitle}>Customize your look</Text>
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
            size={164}
            stageHeight={246}
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
                    color={active ? "#FFFFFF" : "rgba(255,255,255,0.64)"}
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

          <View style={styles.roomReadinessCard}>
            <View
              style={[
                styles.roomReadinessIcon,
                { backgroundColor: readinessTone.backgroundColor }
              ]}
            >
              <Ionicons
                name={readinessTone.icon}
                size={18}
                color={readinessTone.color}
              />
            </View>
            <View style={styles.roomReadinessCopy}>
              <Text style={styles.roomReadinessSlice} numberOfLines={1}>
                Room motion status
              </Text>
              <View style={styles.roomReadinessTitleRow}>
                <Text style={styles.roomReadinessTitle}>
                  {readinessCopy.title}
                </Text>
                <View style={styles.roomReadinessStatePill}>
                  <View
                    style={[
                      styles.roomReadinessStateDot,
                      { backgroundColor: readinessTone.color }
                    ]}
                  />
                  <Text style={styles.roomReadinessCount}>
                    {roomMotionReadiness.readyRequirementCount}/
                    {roomMotionReadiness.totalRequirementCount}
                  </Text>
                </View>
              </View>
              <Text style={styles.roomReadinessBody}>
                {readinessCopy.body}
              </Text>
              <View style={styles.motionCoverageRail}>
                {roomMotionReadiness.requirementSummaries.map((requirement) => (
                  <View
                    key={requirement.label}
                    style={[
                      styles.motionCoverageChip,
                      requirement.isReady ? styles.motionCoverageChipReady : null
                    ]}
                  >
                    <Ionicons
                      name={requirement.isReady ? "checkmark-circle" : "ellipse-outline"}
                      size={13}
                      color={requirement.isReady ? "#8FFFD1" : "#FFB4D4"}
                    />
                    <Text
                      style={[
                        styles.motionCoverageChipText,
                        requirement.isReady ? styles.motionCoverageChipTextReady : null
                      ]}
                      numberOfLines={1}
                    >
                      {formatWardrobeMotionRequirementLabel(requirement.label)}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.motionGestureRow}>
                <Text style={styles.motionGestureLabel} numberOfLines={1}>
                  Gestures {roomMotionReadiness.gestureReadyRequirementCount}/
                  {roomMotionReadiness.gestureTotalRequirementCount}
                </Text>
                <View style={styles.motionGestureRail}>
                  {roomMotionReadiness.gestureRequirementSummaries.map((requirement) => (
                    <View
                      key={requirement.label}
                      style={[
                        styles.motionGestureChip,
                        requirement.isReady ? styles.motionGestureChipReady : null
                      ]}
                    >
                      <Ionicons
                        name={requirement.isReady ? "checkmark-circle" : "ellipse-outline"}
                        size={12}
                        color={requirement.isReady ? "#C9FFEA" : "#FFB4D4"}
                      />
                      <Text
                        style={[
                          styles.motionGestureChipText,
                          requirement.isReady ? styles.motionGestureChipTextReady : null
                        ]}
                        numberOfLines={1}
                      >
                        {formatWardrobeMotionRequirementLabel(requirement.label)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.motionProductionGate}>
                <Ionicons
                  name={
                    productionMotionAudit.isFirstMotionSliceReadyForDefaultPresets
                      ? "checkmark-circle"
                      : "construct"
                  }
                  size={13}
                  color={
                    productionMotionAudit.isFirstMotionSliceReadyForDefaultPresets
                      ? "#8FFFD1"
                      : "#FFD1E3"
                  }
                />
                <Text style={styles.motionProductionGateText} numberOfLines={1}>
                  {productionMotionAudit.firstMissingAssetPlan
                    ? `Next strip ${productionMotionAudit.firstMissingAssetPlan.expectedStripFileName} · ${productionMotionAudit.firstMissingAssetPlan.minimumFrameCount} frame`
                    : `Default rig set ${productionMotionAudit.readyRequirementCount}/${productionMotionAudit.totalRequirementCount}`}
                </Text>
              </View>
              {roomMotionReadiness.missingRequirementLabels.length > 0 ? (
                <Text style={styles.roomReadinessNext} numberOfLines={1}>
                  Needs art: {formatWardrobeMotionRequirementLabel(
                    roomMotionReadiness.missingRequirementLabels[0]
                  )}
                </Text>
              ) : roomMotionReadiness.missingGestureRequirementLabels.length > 0 ? (
                <Text style={styles.roomReadinessNext} numberOfLines={1}>
                  Next gesture art: {formatWardrobeMotionRequirementLabel(
                    roomMotionReadiness.missingGestureRequirementLabels[0]
                  )}
                </Text>
              ) : null}
              {roomMotionReadiness.blockingLayerLabels.length > 0 ? (
                <Text style={styles.roomReadinessLayer} numberOfLines={1}>
                  Blocking layer: {roomMotionReadiness.blockingLayerLabels[0]}
                </Text>
              ) : null}
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
                    color={active ? "#FFFFFF" : "rgba(255,255,255,0.54)"}
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

          <View style={styles.grid}>
            {activeItems.map((item) => {
              const catalogItem = buildAvatarShopCatalogItem({
                item,
                avatar,
                inventory
              })
              const canEquip = canEquipItem(item)
              const locked = !canEquip
              const equipped = isAvatarV2ItemEquipped(avatar, item)
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
                  <View
                    style={[
                      styles.itemIconShell,
                      equipped ? styles.itemIconShellEquipped : null
                    ]}
                  >
                    <Ionicons
                      name={locked ? "lock-closed" : CATEGORY_ICONS[item.type]}
                      size={20}
                      color={equipped ? "#FFFFFF" : "rgba(255,255,255,0.74)"}
                    />
                  </View>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.itemMeta,
                      locked ? styles.itemMetaLocked : null
                    ]}
                    numberOfLines={1}
                  >
                    {catalogItem.stateLabel}
                  </Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#110A16",
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
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    color: "#FFFFFF",
  },
  subtitle: {
    ...uiTheme.font.caption,
    marginTop: 2,
    color: "rgba(255,255,255,0.54)",
  },
  statusPill: {
    minWidth: 70,
    height: 34,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statusPillText: {
    ...uiTheme.font.captionBold,
    color: "#FFFFFF",
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
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  motionPreviewButton: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  motionPreviewButtonActive: {
    backgroundColor: "rgba(255,79,152,0.7)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  motionPreviewButtonText: {
    ...uiTheme.font.micro,
    color: "rgba(255,255,255,0.64)",
    fontWeight: "900",
  },
  motionPreviewButtonTextActive: {
    color: "#FFFFFF",
  },
  roomReadinessCard: {
    marginTop: uiTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  roomReadinessIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
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
    marginTop: 5,
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
    paddingVertical: uiTheme.spacing.lg,
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
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  categoryTabActive: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: "rgba(255,255,255,0.2)",
  },
  categoryTabText: {
    ...uiTheme.font.captionBold,
    color: "rgba(255,255,255,0.58)",
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
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  itemCardEquipped: {
    backgroundColor: "rgba(255,79,152,0.17)",
    borderColor: "rgba(255,79,152,0.68)",
  },
  itemCardLocked: {
    opacity: 0.48,
  },
  itemCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  itemIconShell: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  itemIconShellEquipped: {
    backgroundColor: uiTheme.colors.primary,
  },
  itemName: {
    ...uiTheme.font.bodySmall,
    maxWidth: "100%",
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },
  itemMeta: {
    ...uiTheme.font.caption,
    maxWidth: "100%",
    color: "rgba(255,255,255,0.54)",
    textAlign: "center",
  },
  itemMetaLocked: {
    color: "#FFB4D4",
  },
})
