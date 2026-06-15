import { useRef } from "react"
import { Ionicons } from "@expo/vector-icons"
import { Animated, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { uiTheme } from "./theme"
import { hapticLight } from "./haptics"
import { LinearGradient } from "./linearGradient"

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

function NavTab(props: {
  item: BottomNavItem
  isCurrent: boolean
  showBadge: boolean
  chatCount: number
  onPress: () => void
}) {
  const { item, isCurrent, showBadge, chatCount, onPress } = props
  const scaleAnim = useRef(new Animated.Value(1)).current
  const iconName = isCurrent ? item.activeIcon : item.icon

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
  }

  return (
    <Animated.View style={[styles.bottomNavItemOuter, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.label} tab`}
        accessibilityState={{ selected: isCurrent }}
        style={[
          styles.bottomNavItem,
          isCurrent ? styles.bottomNavItemActive : null,
        ]}
        disabled={isCurrent}
        onPress={() => {
          hapticLight()
          onPress()
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={6}
      >
        {isCurrent ? (
          <View style={styles.activeIconWrap}>
            <LinearGradient
              colors={uiTheme.gradients.primary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.activeIconGradient}
            />
            <Ionicons
              name={iconName}
              size={22}
              color={uiTheme.colors.primary}
              style={styles.iconZ}
            />
          </View>
        ) : (
          <View style={styles.bottomNavIconWrap}>
            <Ionicons
              name={iconName}
              size={22}
              color={uiTheme.colors.textMuted}
            />
          </View>
        )}
        {showBadge ? (
          <View style={styles.bottomNavBadge}>
            <Text style={styles.bottomNavBadgeText}>
              {chatCount > 99 ? "99+" : chatCount}
            </Text>
          </View>
        ) : null}
        <Text
          style={[
            styles.bottomNavLabel,
            isCurrent ? styles.bottomNavLabelActive : null
          ]}
        >
          {item.label}
        </Text>
        {isCurrent ? <View style={styles.activeIndicator} /> : null}
      </Pressable>
    </Animated.View>
  )
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
        return (
          <NavTab
            key={item.key}
            item={item}
            isCurrent={isCurrent}
            showBadge={showBadge}
            chatCount={chatCount}
            onPress={() => onPress(item.key)}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bottomNav: {
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    borderRadius: 32,
    backgroundColor: uiTheme.colors.glassStrong,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    ...uiTheme.shadow.float,
  },
  bottomNavItemOuter: {
    flex: 1,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    minHeight: 48,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: 24,
    position: "relative",
  },
  bottomNavItemActive: {
    backgroundColor: uiTheme.colors.primarySoft,
  },
  activeIconWrap: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconGradient: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.15,
  },
  iconZ: {
    zIndex: 1,
  },
  bottomNavIconWrap: {
    position: "relative",
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: uiTheme.colors.textMuted,
    letterSpacing: 0.2,
  },
  bottomNavLabelActive: {
    color: uiTheme.colors.primaryDeep,
    fontWeight: "800"
  },
  activeIndicator: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: uiTheme.colors.primary,
  },
  bottomNavBadge: {
    position: "absolute",
    top: 2,
    right: "22%",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: uiTheme.colors.surface,
    zIndex: 5,
    ...uiTheme.shadow.glowSubtle,
  },
  bottomNavBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900"
  }
})
