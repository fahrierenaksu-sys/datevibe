import { Pressable, StyleSheet, Text, View } from "react-native"
import { uiTheme } from "./theme"

export type BottomNavKey = "discover" | "saved" | "chats" | "profile"

interface BottomNavItem {
  key: BottomNavKey
  icon: string
  label: string
  active: boolean
}

const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  { key: "discover", icon: "◎", label: "Discover", active: true },
  { key: "saved", icon: "♡", label: "Saved", active: true },
  { key: "chats", icon: "✺", label: "Chats", active: true },
  { key: "profile", icon: "◌", label: "You", active: true }
]

export interface BottomNavProps {
  currentKey: BottomNavKey
  savedCount: number
  chatCount: number
  onPress: (key: BottomNavKey) => void
}

export function BottomNav(props: BottomNavProps) {
  const { currentKey, savedCount, chatCount, onPress } = props
  return (
    <View style={styles.bottomNav}>
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isCurrent = item.key === currentKey
        const navigable = item.active && !isCurrent
        const showBadge =
          (item.key === "saved" && savedCount > 0) ||
          (item.key === "chats" && chatCount > 0)
        return (
          <Pressable
            key={item.key}
            style={styles.bottomNavItem}
            disabled={!item.active || isCurrent}
            onPress={() => onPress(item.key)}
            hitSlop={6}
          >
            <View style={styles.bottomNavIconWrap}>
              <Text
                style={[
                  styles.bottomNavIcon,
                  isCurrent ? styles.bottomNavIconActive : null,
                  navigable ? styles.bottomNavIconNavigable : null
                ]}
              >
                {item.icon}
              </Text>
              {showBadge ? (
                <View style={styles.bottomNavBadge}>
                  <Text style={styles.bottomNavBadgeText}>
                    {item.key === "chats"
                      ? chatCount > 99 ? "99+" : chatCount
                      : savedCount > 99 ? "99+" : savedCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.bottomNavLabel,
                isCurrent ? styles.bottomNavLabelActive : null,
                navigable ? styles.bottomNavLabelNavigable : null
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
    marginBottom: uiTheme.spacing.sm,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    borderRadius: uiTheme.radius.xxl,
    backgroundColor: uiTheme.colors.surface,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    ...uiTheme.shadow.card
  },
  bottomNavItem: {
    alignItems: "center",
    gap: 4,
    width: 60
  },
  bottomNavIconWrap: {
    position: "relative"
  },
  bottomNavIcon: {
    fontSize: 22,
    color: uiTheme.colors.textMuted,
    fontWeight: "700"
  },
  bottomNavIconActive: {
    color: uiTheme.colors.primary
  },
  bottomNavIconNavigable: {
    color: uiTheme.colors.textSecondary
  },
  bottomNavLabel: {
    fontSize: uiTheme.typography.micro,
    fontWeight: "700",
    color: uiTheme.colors.textMuted,
    letterSpacing: 0.2
  },
  bottomNavLabelActive: {
    color: uiTheme.colors.primary,
    fontWeight: "800"
  },
  bottomNavLabelNavigable: {
    color: uiTheme.colors.textSecondary
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
