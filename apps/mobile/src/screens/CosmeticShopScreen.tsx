import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useMemo, useState } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  RARITY_COLORS,
  getCosmeticsByCategory,
  type AvatarCosmetic,
  type CosmeticCategory
} from "../features/cosmetics/cosmeticCatalog"
import { useCosmeticStore } from "../features/cosmetics/cosmeticStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { MyAvatar } from "../ui/myAvatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { hapticError, hapticLight, hapticSuccess } from "../ui/haptics"
import { useSessionState } from "../features/session/useSessionState"

type CosmeticShopScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "CosmeticShop"
>

const CATEGORIES: { key: CosmeticCategory; label: string; icon: string }[] = [
  { key: "hat", label: "Hats", icon: "🎩" },
  { key: "frame", label: "Frames", icon: "💫" },
  { key: "effect", label: "Effects", icon: "✦" },
  { key: "expression", label: "Faces", icon: "😊" }
]

export function CosmeticShopScreen(props: CosmeticShopScreenProps) {
  const { navigation } = props
  const { sessionActor } = useSessionState()
  const cosmetics = useCosmeticStore()
  const [activeCategory, setActiveCategory] = useState<CosmeticCategory>("hat")

  const items = useMemo(
    () => getCosmeticsByCategory(activeCategory),
    [activeCategory]
  )

  const profile = sessionActor?.profile
  const displayName = profile?.displayName ?? "You"
  const userId = profile?.userId ?? "unknown"

  const handleItemPress = useCallback((item: AvatarCosmetic) => {
    if (cosmetics.isUnlocked(item.id)) {
      // Already owned — toggle equip
      const equipped = cosmetics.getEquippedItem(item.category)
      if (equipped?.id === item.id) {
        cosmetics.unequipCategory(item.category)
        hapticLight()
      } else {
        cosmetics.equipCosmetic(item.id)
        hapticLight()
      }
    } else {
      // Attempt to purchase
      const result = cosmetics.unlockCosmetic(item.id)
      if (result.success) {
        hapticSuccess()
      } else {
        hapticError()
      }
    }
  }, [cosmetics])

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <TopBar
          title="Avatar Shop"
          subtitle="Express yourself"
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              ←
            </ActionButtonCircle>
          }
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Preview */}
          <View style={styles.previewCard}>
            <View style={styles.previewGlow} pointerEvents="none" />
            <MyAvatar name={displayName} seed={userId} size={120} ring="strong" />
            <Text style={styles.previewName}>{displayName}</Text>
            <View style={styles.coinPill}>
              <Text style={styles.coinIcon}>◆</Text>
              <Text style={styles.coinText}>{cosmetics.coinBalance.toLocaleString()} coins</Text>
            </View>
          </View>

          {/* Category tabs */}
          <View style={styles.tabRow}>
            {CATEGORIES.map((cat) => {
              const active = cat.key === activeCategory
              return (
                <Pressable
                  key={cat.key}
                  style={[styles.tab, active ? styles.tabActive : null]}
                  onPress={() => setActiveCategory(cat.key)}
                >
                  <Text style={styles.tabIcon}>{cat.icon}</Text>
                  <Text
                    style={[styles.tabLabel, active ? styles.tabLabelActive : null]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.grid}>
            {items.map((item) => {
              const owned = cosmetics.isUnlocked(item.id)
              const equipped = cosmetics.getEquippedItem(item.category)
              const isEquipped = equipped?.id === item.id
              return (
                <CosmeticItemCard
                  key={item.id}
                  item={item}
                  isOwned={owned}
                  isEquipped={isEquipped}
                  onPress={() => handleItemPress(item)}
                />
              )
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

// ── Item card ───────────────────────────────────────────────

interface CosmeticItemCardProps {
  item: AvatarCosmetic
  isOwned: boolean
  isEquipped: boolean
  onPress: () => void
}

function CosmeticItemCard(props: CosmeticItemCardProps) {
  const { item, isOwned, isEquipped, onPress } = props
  const rarityColor = RARITY_COLORS[item.rarity]

  return (
    <Pressable
      style={({ pressed }) => [
        itemStyles.card,
        isEquipped ? itemStyles.cardEquipped : null,
        pressed ? itemStyles.cardPressed : null
      ]}
      onPress={onPress}
    >
      <View style={[itemStyles.glyphWrap, { borderColor: rarityColor }]}>
        <Text style={itemStyles.glyph}>{item.glyph}</Text>
      </View>
      <Text style={itemStyles.name} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={[itemStyles.rarityBadge, { backgroundColor: `${rarityColor}20` }]}>
        <View style={[itemStyles.rarityDot, { backgroundColor: rarityColor }]} />
        <Text style={[itemStyles.rarityText, { color: rarityColor }]}>
          {item.rarity}
        </Text>
      </View>
      {isEquipped ? (
        <View style={itemStyles.equippedBadge}>
          <Text style={itemStyles.equippedText}>Equipped ✓</Text>
        </View>
      ) : isOwned ? (
        <View style={itemStyles.ownedBadge}>
          <Text style={itemStyles.ownedText}>Tap to equip</Text>
        </View>
      ) : (
        <View style={itemStyles.pricePill}>
          <Text style={itemStyles.priceIcon}>◆</Text>
          <Text style={itemStyles.priceText}>{item.priceCoins}</Text>
        </View>
      )}
    </Pressable>
  )
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm
  },
  scroll: {
    gap: uiTheme.spacing.md,
    paddingBottom: uiTheme.spacing.xxl
  },
  previewCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.card
  },
  previewGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -80
  },
  previewName: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.heading,
    fontWeight: "800"
  },
  coinPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FEF9E7",
    borderWidth: 1,
    borderColor: "#F5E6A3"
  },
  coinIcon: {
    color: "#D4A017",
    fontSize: 14,
    fontWeight: "800"
  },
  coinText: {
    color: "#8B6914",
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  tabRow: {
    flexDirection: "row",
    gap: uiTheme.spacing.xs
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  tabActive: {
    backgroundColor: uiTheme.colors.chipBackground,
    borderColor: "#F4A9CA"
  },
  tabIcon: {
    fontSize: 18
  },
  tabLabel: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.micro,
    fontWeight: "700"
  },
  tabLabelActive: {
    color: uiTheme.colors.chipText,
    fontWeight: "800"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm
  }
})

const ITEM_WIDTH = "47%" as const

const itemStyles = StyleSheet.create({
  card: {
    width: ITEM_WIDTH,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.md,
    alignItems: "center",
    gap: uiTheme.spacing.xs,
    ...uiTheme.shadow.soft
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }]
  },
  cardEquipped: {
    borderColor: uiTheme.colors.primary,
    borderWidth: 2,
    backgroundColor: "#FFF7FB"
  },
  glyphWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8FC"
  },
  glyph: {
    fontSize: 26
  },
  name: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700",
    textAlign: "center"
  },
  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: uiTheme.radius.full
  },
  rarityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  ownedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.successSoft,
    borderWidth: 1,
    borderColor: "rgba(58, 192, 138, 0.28)"
  },
  ownedText: {
    color: uiTheme.colors.successInk,
    fontSize: uiTheme.typography.micro,
    fontWeight: "800"
  },
  equippedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.chipBackground,
    borderWidth: 1,
    borderColor: "#F4A9CA"
  },
  equippedText: {
    color: uiTheme.colors.chipText,
    fontSize: uiTheme.typography.micro,
    fontWeight: "800"
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "#FEF9E7",
    borderWidth: 1,
    borderColor: "#F5E6A3"
  },
  priceIcon: {
    color: "#D4A017",
    fontSize: 10,
    fontWeight: "800"
  },
  priceText: {
    color: "#8B6914",
    fontSize: uiTheme.typography.micro,
    fontWeight: "700"
  }
})
