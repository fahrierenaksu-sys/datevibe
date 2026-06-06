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
import type {
  AvatarCatalogItem,
  AvatarItemType
} from "../features/avatarV2/avatarV2.types"
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

export function WardrobeV2Screen(props: WardrobeV2ScreenProps) {
  const { navigation } = props
  const [activeType, setActiveType] = useState<AvatarItemType>("hair")
  const { avatar, catalog, inventory, canEquipItem, equipItem } = useAvatarV2()

  const activeItems = useMemo(
    () => getAvatarV2ItemsByType(catalog, activeType),
    [activeType, catalog]
  )

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
            selectedType={activeType}
            label={equippedLabel}
            size={164}
            stageHeight={246}
          />

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#110A16"
  },
  safe: {
    flex: 1
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.md,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.sm
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  iconButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }]
  },
  titleBlock: {
    flex: 1
  },
  title: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.heading,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.54)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  statusPill: {
    minWidth: 70,
    height: 34,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  statusPillText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  scroll: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xxxl
  },
  categoryRow: {
    gap: 8,
    paddingVertical: uiTheme.spacing.lg
  },
  categoryTab: {
    minWidth: 86,
    height: 42,
    borderRadius: uiTheme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  categoryTabActive: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: "rgba(255,255,255,0.2)"
  },
  categoryTabText: {
    color: "rgba(255,255,255,0.58)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  categoryTabTextActive: {
    color: "#FFFFFF"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm
  },
  itemCard: {
    width: "48%",
    minHeight: 126,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  itemCardEquipped: {
    backgroundColor: "rgba(255,79,152,0.17)",
    borderColor: "rgba(255,79,152,0.68)"
  },
  itemCardLocked: {
    opacity: 0.48
  },
  itemCardPressed: {
    transform: [{ scale: 0.98 }]
  },
  itemIconShell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  itemIconShellEquipped: {
    backgroundColor: uiTheme.colors.primary
  },
  itemName: {
    maxWidth: "100%",
    color: "#FFFFFF",
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "900",
    textAlign: "center"
  },
  itemMeta: {
    maxWidth: "100%",
    color: "rgba(255,255,255,0.54)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    textAlign: "center"
  },
  itemMetaLocked: {
    color: "#FFB4D4"
  }
})
