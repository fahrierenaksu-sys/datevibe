import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { uiTheme } from "./theme"
import { hapticLight } from "./haptics"

export type BottomNavKey = "discover" | "chats" | "myroom" | "shop"

interface BottomNavItem {
  key: BottomNavKey
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
  label: string
}

const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    key: "discover",
    icon: "compass-outline",
    activeIcon: "compass",
    label: "Discover"
  },
  {
    key: "chats",
    icon: "chatbubble-ellipses-outline",
    activeIcon: "chatbubble-ellipses",
    label: "Chats"
  },
  { key: "myroom", icon: "home-outline", activeIcon: "home", label: "My Room" },
  { key: "shop", icon: "bag-outline", activeIcon: "bag", label: "Shop" }
]

export interface BottomNavProps {
  currentKey: BottomNavKey
  chatCount: number
  onPress: (key: BottomNavKey) => void
}

export function BottomNav(props: BottomNavProps) {
  const { currentKey, chatCount, onPress } = props
  const insets = useSafeAreaInsets()
  return (
    <View
      style={[
        styles.bottomNav,
        { marginBottom: Math.max(insets.bottom, uiTheme.spacing.sm) }
      ]}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isCurrent = item.key === currentKey
        const showBadge = item.key === "chats" && chatCount > 0
        const iconName = isCurrent ? item.activeIcon : item.icon
        return (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.bottomNavItem,
              isCurrent ? styles.bottomNavItemActive : null,
              pressed && !isCurrent ? styles.bottomNavItemPressed : null
            ]}
            disabled={isCurrent}
            onPress={() => {
              hapticLight()
              onPress(item.key)
            }}
            hitSlop={6}
          >
            <View style={styles.bottomNavIconWrap}>
              <Ionicons
                name={iconName}
                size={22}
                color={isCurrent ? uiTheme.colors.primary : uiTheme.colors.textMuted}
              />
              {showBadge ? (
                <View style={styles.bottomNavBadge}>
                  <Text style={styles.bottomNavBadgeText}>
                    {chatCount > 99 ? "99+" : chatCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                isCurrent ? styles.bottomNavLabelActive : null
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bottomNav: {
    marginHorizontal: uiTheme.spacing.lg,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.xxl,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    ...uiTheme.shadow.card
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    minHeight: 46,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.lg
  },
  bottomNavItemActive: {
    backgroundColor: uiTheme.colors.primarySoft
  },
  bottomNavItemPressed: {
    backgroundColor: uiTheme.colors.surfaceMuted
  },
  bottomNavIconWrap: {
    position: "relative"
  },
  bottomNavLabel: {
    fontSize: uiTheme.typography.micro,
    fontWeight: "700",
    color: uiTheme.colors.textMuted,
    letterSpacing: 0
  },
  bottomNavLabelActive: {
    color: uiTheme.colors.primary,
    fontWeight: "800"
  },
  bottomNavBadge: {
    position: "absolute",
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: uiTheme.colors.surface
  },
  bottomNavBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800"
  }
})
