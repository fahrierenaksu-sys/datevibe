import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { STATUS_CARD_FOUNDATION_CATALOG } from "../features/shop/shopCatalog"
import type { SessionActor } from "../features/session/sessionApi"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { MyAvatar } from "../ui/myAvatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BrandMark } from "../ui/brandMark"
import { LinearGradient } from "../ui/linearGradient"
import { TopBar, ActionButtonCircle } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { VIBE_PRESETS } from "../ui/vibeTilePicker"

type YouScreenProps = NativeStackScreenProps<RootStackParamList, "You"> & {
  sessionActor: SessionActor
  onResetSession: () => void
}

const PREVIEW_NAMEPLATE_ITEM = STATUS_CARD_FOUNDATION_CATALOG.find(
  (item) => item.category === "nameplate"
)

export function YouScreen(props: YouScreenProps) {
  const { navigation, sessionActor, onResetSession } = props
  const { profile } = sessionActor

  const vibePreset = VIBE_PRESETS.find((p) => p.id === profile.avatar.presetId)
  const vibeLabel = vibePreset?.label ?? "Custom"
  const vibeColor = vibePreset?.swatch ?? uiTheme.colors.primary

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <TopBar
          title="You"
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              ←
            </ActionButtonCircle>
          }
          rightSlot={<View style={styles.topRightSpacer} />}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero avatar card */}
          <View style={styles.heroCardOuter}>
            <LinearGradient
              colors={["#FBF8FD", "#FFF2F8", "#FFE2EE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroGlow} pointerEvents="none" />
              <View style={styles.heroGlowSecondary} pointerEvents="none" />
              {/* Gradient glow behind avatar */}
              <View style={styles.avatarGlowWrap} pointerEvents="none">
                <LinearGradient
                  colors={["rgba(255,79,152,0.28)", "rgba(255,126,179,0.12)", "transparent"]}
                  style={styles.avatarGlowGradient}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                />
              </View>
              <MyAvatar
                name={profile.displayName}
                seed={profile.userId}
                size={172}
                ring="strong"
              />
              {PREVIEW_NAMEPLATE_ITEM ? (
                <View
                  style={[
                    styles.nameplatePreview,
                    {
                      backgroundColor: PREVIEW_NAMEPLATE_ITEM.accentSoftColor,
                      borderColor: PREVIEW_NAMEPLATE_ITEM.accentColor
                    }
                  ]}
                >
                  <Text
                    style={[
                      styles.nameplatePreviewText,
                      { color: PREVIEW_NAMEPLATE_ITEM.accentColor }
                    ]}
                    numberOfLines={1}
                  >
                    {PREVIEW_NAMEPLATE_ITEM.name}
                  </Text>
                  <Text style={styles.nameplatePreviewMeta} numberOfLines={1}>
                    Preview only
                  </Text>
                </View>
              ) : null}
            </LinearGradient>
          </View>

          {/* Identity */}
          <View style={styles.identityBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{profile.displayName}</Text>
              <Text style={styles.verifiedBadge}>✦</Text>
            </View>
            {profile.age ? (
              <Text style={styles.ageText}>{profile.age} years old</Text>
            ) : null}
            <View style={styles.vibeRow}>
              <View style={[styles.vibeDot, { backgroundColor: vibeColor }]} />
              <Text style={styles.vibeLabel}>{vibeLabel} vibe</Text>
            </View>
          </View>

          {/* Info cards */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionLabel}>Avatar Identity</Text>
              <Text style={styles.sectionChevron}>›</Text>
            </View>
            <Text style={styles.sectionBody}>
              Your AvatarV2 look, name, and vibe are how people recognize you
              in Discover, My Room, and post-match rooms.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <Text style={styles.sectionIcon}>🏠</Text>
              <Text style={styles.sectionLabel}>My Room</Text>
              <Text style={styles.sectionChevron}>›</Text>
            </View>
            <Text style={styles.sectionBody}>
              Your saved room is part of your presence. Decor you place in My
              Room is what people should see when room experiences open up.
            </Text>
          </View>

          <View style={styles.brandCard}>
            <View style={styles.brandCardInner}>
              <View style={styles.brandRow}>
                <BrandMark size={28} />
                <View style={styles.brandTextStack}>
                  <Text style={styles.brandName}>DateVibe</Text>
                  <Text style={styles.brandTagline}>
                    Avatar-first matching, then a private room after mutual interest.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <Pressable
            onPress={() => navigation.navigate("MyRoom")}
            style={({ pressed }) => [
              styles.gradientButtonWrap,
              pressed ? { opacity: 0.85, transform: [{ scale: uiTheme.animation.scalePress }] } : null
            ]}
          >
            <LinearGradient
              colors={uiTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.gradientButtonIcon}>🏠</Text>
              <Text style={styles.gradientButtonText}>My Room</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("CosmeticShop")}
            style={({ pressed }) => [
              styles.gradientButtonWrap,
              pressed ? { opacity: 0.85, transform: [{ scale: uiTheme.animation.scalePress }] } : null
            ]}
          >
            <LinearGradient
              colors={uiTheme.gradients.warm}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.gradientButtonIcon}>👗</Text>
              <Text style={styles.gradientButtonText}>Wardrobe & Shop</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("ProfileEdit")}
            style={({ pressed }) => [
              styles.utilityButton,
              pressed ? { opacity: 0.85, transform: [{ scale: uiTheme.animation.scalePress }] } : null
            ]}
          >
            <Text style={styles.utilityButtonIcon}>✏️</Text>
            <Text style={styles.utilityButtonText}>Edit Profile</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={({ pressed }) => [
              styles.utilityButton,
              pressed ? { opacity: 0.85, transform: [{ scale: uiTheme.animation.scalePress }] } : null
            ]}
          >
            <Text style={styles.utilityButtonIcon}>⚙️</Text>
            <Text style={styles.utilityButtonText}>Settings</Text>
          </Pressable>

          <Pressable
            onPress={onResetSession}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed ? styles.signOutButtonPressed : null
            ]}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

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
  topRightSpacer: {
    width: 40
  },
  scroll: {
    gap: uiTheme.spacing.md,
    paddingBottom: uiTheme.spacing.xxl
  },

  /* ── Hero ───────────────────────────────────── */
  heroCardOuter: {
    borderRadius: uiTheme.radius.xl,
    overflow: "hidden",
    ...uiTheme.shadow.deep
  },
  heroCard: {
    height: 300,
    borderRadius: uiTheme.radius.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  heroGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(234,219,245,0.7)",
    top: -80
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(252,228,241,0.65)",
    right: -50,
    bottom: -60
  },
  avatarGlowWrap: {
    position: "absolute",
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarGlowGradient: {
    width: 220,
    height: 220,
    borderRadius: 110
  },
  nameplatePreview: {
    position: "absolute",
    bottom: uiTheme.spacing.md,
    alignSelf: "center",
    maxWidth: "84%",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1
  },
  nameplatePreviewText: {
    flexShrink: 1,
    ...uiTheme.font.caption,
    fontWeight: "900"
  },
  nameplatePreviewMeta: {
    color: "rgba(32, 22, 42, 0.66)",
    ...uiTheme.font.micro,
    fontWeight: "900",
    textTransform: "uppercase"
  },

  /* ── Identity ──────────────────────────────── */
  identityBlock: {
    gap: uiTheme.spacing.xxs,
    paddingHorizontal: 2
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  nameText: {
    color: uiTheme.colors.textPrimary,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -0.6
  },
  verifiedBadge: {
    color: uiTheme.colors.primary,
    fontSize: 20,
    fontWeight: "800"
  },
  ageText: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.body,
    fontWeight: "600"
  },
  vibeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4
  },
  vibeDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  vibeLabel: {
    color: uiTheme.colors.primaryDeep,
    ...uiTheme.font.label,
    fontWeight: "800"
  },

  /* ── Section cards ─────────────────────────── */
  sectionCard: {
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm
  },
  sectionIcon: {
    fontSize: 18
  },
  sectionLabel: {
    flex: 1,
    color: uiTheme.colors.textMuted,
    ...uiTheme.font.captionBold,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  sectionChevron: {
    color: uiTheme.colors.textMuted,
    fontSize: 22,
    fontWeight: "600"
  },
  sectionBody: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.bodySmall,
    lineHeight: 21,
    paddingLeft: 28
  },

  /* ── Brand card with gradient border ────────── */
  brandCard: {
    borderRadius: uiTheme.radius.lg + 2,
    padding: 2,
    backgroundColor: uiTheme.colors.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(255,79,152,0.18)",
    ...uiTheme.shadow.soft
  },
  brandCardInner: {
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.md
  },
  brandTextStack: {
    flex: 1,
    gap: 2
  },
  brandName: {
    color: uiTheme.colors.textPrimary,
    ...uiTheme.font.bodyBold,
    fontWeight: "800"
  },
  brandTagline: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.caption,
    fontWeight: "600"
  },

  /* ── Gradient action buttons ───────────────── */
  gradientButtonWrap: {
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glowSubtle
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.md,
    paddingHorizontal: uiTheme.spacing.xl,
    borderRadius: uiTheme.radius.full
  },
  gradientButtonIcon: {
    fontSize: 18
  },
  gradientButtonText: {
    color: uiTheme.colors.textInverted,
    ...uiTheme.font.bodyBold,
    fontWeight: "800"
  },

  /* ── Utility buttons ───────────────────────── */
  utilityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm + 2,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  utilityButtonIcon: {
    fontSize: 16
  },
  utilityButtonText: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.bodySmall,
    fontWeight: "700"
  },

  /* ── Sign out ──────────────────────────────── */
  signOutButton: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.xxl,
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#F7C9D1",
    marginTop: uiTheme.spacing.sm
  },
  signOutButtonPressed: {
    opacity: 0.8
  },
  signOutText: {
    color: uiTheme.colors.dangerInk,
    ...uiTheme.font.bodySmall,
    fontWeight: "700"
  }
})
