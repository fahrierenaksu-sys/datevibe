import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { SessionActor } from "../features/session/sessionApi"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { MyAvatar } from "../ui/myAvatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BrandMark } from "../ui/brandMark"
import { TopBar, ActionButtonCircle, TagChip } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { VIBE_PRESETS } from "../ui/vibeTilePicker"

type YouScreenProps = NativeStackScreenProps<RootStackParamList, "You"> & {
  sessionActor: SessionActor
  onResetSession: () => void
}

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
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroGlowSecondary} pointerEvents="none" />
            <MyAvatar
              name={profile.displayName}
              seed={profile.userId}
              size={172}
              ring="strong"
            />
          </View>

          {/* Identity */}
          <View style={styles.identityBlock}>
            <Text style={styles.nameText}>{profile.displayName}</Text>
            {profile.age ? (
              <Text style={styles.ageText}>{profile.age} years old</Text>
            ) : null}
            <View style={styles.vibeRow}>
              <View style={[styles.vibeDot, { backgroundColor: vibeColor }]} />
              <Text style={styles.vibeLabel}>{vibeLabel} vibe</Text>
            </View>
          </View>

          {/* Info cards */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Identity</Text>
            <Text style={styles.infoBody}>
              Your avatar and name are how others see you in the lobby and during
              mini-rooms. Photos are intentionally absent — DateVibe is
              avatar-first.
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Session</Text>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionKey}>User ID</Text>
              <Text style={styles.sessionValue} numberOfLines={1}>
                {profile.userId.slice(-12)}
              </Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionKey}>Expires</Text>
              <Text style={styles.sessionValue}>
                {formatExpiry(sessionActor.session.expiresAt)}
              </Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.brandRow}>
              <BrandMark size={28} />
              <View style={styles.brandTextStack}>
                <Text style={styles.brandName}>DateVibe</Text>
                <Text style={styles.brandTagline}>Real people. Right here. Right now.</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <Pressable
            onPress={() => navigation.navigate("CosmeticShop")}
            style={({ pressed }) => [
              styles.customizeButton,
              pressed ? { opacity: 0.85 } : null
            ]}
          >
            <Text style={styles.customizeText}>✦ Customize Avatar</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("ProfileEdit")}
            style={({ pressed }) => [
              styles.editProfileButton,
              pressed ? { opacity: 0.85 } : null
            ]}
          >
            <Text style={styles.editProfileText}>✎ Edit Profile</Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={({ pressed }) => [
              styles.editProfileButton,
              pressed ? { opacity: 0.85 } : null
            ]}
          >
            <Text style={styles.editProfileText}>⚙ Settings</Text>
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

function formatExpiry(expiresAt: string): string {
  const ts = Date.parse(expiresAt)
  if (!Number.isFinite(ts)) return "Unknown"
  const remaining = Math.max(0, ts - Date.now())
  const hours = Math.floor(remaining / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  if (minutes > 0) return `${minutes}m remaining`
  return "Expiring soon"
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
  heroCard: {
    height: 280,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "#ECE9EE",
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.card
  },
  heroGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -60
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FCE4F1",
    right: -40,
    bottom: -50
  },
  identityBlock: {
    gap: uiTheme.spacing.xxs,
    paddingHorizontal: 2
  },
  nameText: {
    color: uiTheme.colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0
  },
  ageText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
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
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  infoCard: {
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  infoLabel: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  infoBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 21
  },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sessionKey: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  sessionValue: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600",
    maxWidth: "60%"
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
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  },
  brandTagline: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600"
  },
  signOutButton: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#F7C9D1"
  },
  signOutButtonPressed: {
    opacity: 0.8
  },
  signOutText: {
    color: uiTheme.colors.dangerInk,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  customizeButton: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.chipBackground,
    borderWidth: 1,
    borderColor: "#F4A9CA"
  },
  customizeText: {
    color: uiTheme.colors.chipText,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  editProfileButton: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  editProfileText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  }
})
