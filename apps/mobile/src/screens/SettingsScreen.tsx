import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useRef } from "react"
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useBlockStore } from "../features/safety/blockStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { showToast } from "../ui/toast"

type SettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Settings"
>

/* ── Animated Row ──────────────────────────────────────────── */

function SettingsRow(props: {
  icon: string
  iconColors: [string, string]
  label: string
  value?: string
  chevron?: boolean
  onPress?: () => void
  isLast?: boolean
  children?: React.ReactNode
}) {
  const { icon, iconColors, label, value, chevron, onPress, isLast, children } = props
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      ...uiTheme.animation.spring
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.spring
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[styles.row, !isLast && styles.rowDivider]}
      >
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={iconColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Text style={styles.iconEmoji}>{icon}</Text>
          </LinearGradient>
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        {children}
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {chevron ? <Text style={styles.rowChevron}>›</Text> : null}
      </Pressable>
    </Animated.View>
  )
}

/* ── Main Screen ───────────────────────────────────────────── */

export function SettingsScreen(props: SettingsScreenProps) {
  const { navigation } = props
  const { blockedUserIds, unblockUser } = useBlockStore()

  const handleUnblock = useCallback(
    (userId: string) => {
      Alert.alert(
        "Unblock user?",
        "They'll be able to see you and send you invites again.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unblock",
            style: "destructive",
            onPress: () => {
              unblockUser(userId)
              showToast({ title: "User unblocked", type: "info" })
            }
          }
        ]
      )
    },
    [unblockUser]
  )

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView
        style={styles.safe}
        edges={["top", "left", "right", "bottom"]}
      >
        <TopBar
          title="Settings"
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
          {/* ── Safety / Blocked Users ────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionOverline}>SAFETY</Text>
            <View style={styles.sectionCard}>
              {blockedUserIds.length === 0 ? (
                <View style={styles.emptyRow}>
                  <View style={styles.iconCircle}>
                    <LinearGradient
                      colors={["#E2586C", "#FF8A9B"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconGradient}
                    >
                      <Text style={styles.iconEmoji}>🛡️</Text>
                    </LinearGradient>
                  </View>
                  <Text style={styles.emptyText}>
                    No blocked users. If you block someone, they'll appear here.
                  </Text>
                </View>
              ) : (
                blockedUserIds.map((userId, index) => (
                  <View
                    key={userId}
                    style={[
                      styles.blockedCard,
                      index < blockedUserIds.length - 1 && styles.rowDivider
                    ]}
                  >
                    <Avatar name="?" seed={userId} size={40} ring="soft" />
                    <View style={styles.blockedBody}>
                      <Text style={styles.blockedId} numberOfLines={1}>
                        {userId.slice(0, 12)}…
                      </Text>
                      <Text style={styles.blockedLabel}>Blocked</Text>
                    </View>
                    <Pressable
                      onPress={() => handleUnblock(userId)}
                      style={({ pressed }) => [
                        styles.unblockButton,
                        pressed ? { opacity: 0.85 } : null
                      ]}
                    >
                      <Text style={styles.unblockText}>Unblock</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* ── About ─────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionOverline}>ABOUT</Text>
            <View style={styles.sectionCard}>
              <SettingsRow
                icon="📱"
                iconColors={uiTheme.gradients.primary}
                label="Version"
                value="1.0.0-beta"
              />
              <SettingsRow
                icon="🌊"
                iconColors={uiTheme.gradients.cool}
                label="Build"
                value="Wave 11"
              />
              <SettingsRow
                icon="✨"
                iconColors={uiTheme.gradients.warm}
                label="Philosophy"
                value="Avatars, not photos"
                isLast
              />
            </View>
          </View>

          {/* ── Legal ─────────────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionOverline}>LEGAL</Text>
            <View style={styles.sectionCard}>
              <SettingsRow
                icon="🔒"
                iconColors={["#9B59B6", "#C39BD3"]}
                label="Privacy Policy"
                chevron
              />
              <SettingsRow
                icon="📄"
                iconColors={["#3498DB", "#85C1E9"]}
                label="Terms of Service"
                chevron
              />
              <SettingsRow
                icon="💬"
                iconColors={["#3AC08A", "#82E0AA"]}
                label="Community Guidelines"
                chevron
                isLast
              />
            </View>
          </View>

          {/* ── Footer ────────────────────────────────────── */}
          <View style={styles.footerWrap}>
            <Text style={styles.footerTagline}>
              Made with intention. No algorithms. No photos.{"\n"}
              Just real moments between real people.
            </Text>
            <Text style={styles.footerVersion}>DateVibe v1.0.0-beta</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

/* ── Styles ─────────────────────────────────────────────────── */

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

  /* ── Section ────────────────────────────────────── */
  sectionWrap: {
    gap: uiTheme.spacing.xs
  },
  sectionOverline: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
    paddingLeft: uiTheme.spacing.xxs,
    marginBottom: 2
  },
  sectionCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    overflow: "hidden",
    ...uiTheme.shadow.soft
  },

  /* ── Row ─────────────────────────────────────────── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    gap: uiTheme.spacing.sm
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.colors.divider
  },
  rowBody: {
    flex: 1
  },
  rowLabel: {
    ...uiTheme.font.bodyMedium,
    color: uiTheme.colors.textPrimary
  },
  rowValue: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary
  },
  rowChevron: {
    ...uiTheme.font.subheading,
    color: uiTheme.colors.textMuted,
    marginLeft: uiTheme.spacing.xxs
  },

  /* ── Icon Circle ─────────────────────────────────── */
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: "hidden"
  },
  iconGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  iconEmoji: {
    fontSize: 16
  },

  /* ── Empty state ─────────────────────────────────── */
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.md
  },
  emptyText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textMuted,
    flex: 1,
    lineHeight: 20
  },

  /* ── Blocked card ────────────────────────────────── */
  blockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm
  },
  blockedBody: {
    flex: 1,
    gap: 2
  },
  blockedId: {
    ...uiTheme.font.label,
    color: uiTheme.colors.textPrimary
  },
  blockedLabel: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.danger
  },
  unblockButton: {
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: uiTheme.colors.danger
  },
  unblockText: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.dangerInk
  },

  /* ── Footer ──────────────────────────────────────── */
  footerWrap: {
    alignItems: "center",
    gap: uiTheme.spacing.xs,
    paddingVertical: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.md
  },
  footerTagline: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textMuted,
    textAlign: "center",
    lineHeight: 20
  },
  footerVersion: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted,
    opacity: 0.6
  }
})
