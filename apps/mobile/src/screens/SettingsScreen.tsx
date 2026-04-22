import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback } from "react"
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useBlockStore } from "../features/safety/blockStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { showToast } from "../ui/toast"

type SettingsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Settings"
>

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
          {/* Blocked Users */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Safety</Text>
            <Text style={styles.sectionTitle}>Blocked Users</Text>
            {blockedUserIds.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No blocked users. If you block someone, they'll appear here.
                </Text>
              </View>
            ) : (
              blockedUserIds.map((userId) => (
                <View key={userId} style={styles.blockedCard}>
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

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>About</Text>
            <Text style={styles.sectionTitle}>DateVibe</Text>
            <View style={styles.aboutCard}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Version</Text>
                <Text style={styles.aboutValue}>1.0.0-beta</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Build</Text>
                <Text style={styles.aboutValue}>Wave 11</Text>
              </View>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Philosophy</Text>
                <Text style={styles.aboutValue}>Avatars, not photos</Text>
              </View>
            </View>
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrow}>Legal</Text>
            <View style={styles.legalLinks}>
              <Pressable style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
                <Text style={styles.legalChevron}>›</Text>
              </Pressable>
              <Pressable style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
                <Text style={styles.legalChevron}>›</Text>
              </Pressable>
              <Pressable style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Community Guidelines</Text>
                <Text style={styles.legalChevron}>›</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.footer}>
            Made with intention. No algorithms. No photos.{"\n"}
            Just real moments between real people.
          </Text>
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
  scroll: {
    gap: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xxl
  },
  section: {
    gap: uiTheme.spacing.xs
  },
  sectionEyebrow: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  sectionTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    marginBottom: uiTheme.spacing.xs
  },
  emptyCard: {
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  emptyText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.bodySmall,
    textAlign: "center",
    lineHeight: 20
  },
  blockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    padding: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    marginBottom: uiTheme.spacing.xs
  },
  blockedBody: {
    flex: 1,
    gap: 2
  },
  blockedId: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  blockedLabel: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800"
  },
  unblockButton: {
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  unblockText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  aboutCard: {
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    overflow: "hidden"
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.colors.border
  },
  aboutLabel: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600"
  },
  aboutValue: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  legalLinks: {
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    overflow: "hidden"
  },
  legalLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.colors.border
  },
  legalLinkText: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600"
  },
  legalChevron: {
    color: uiTheme.colors.textMuted,
    fontSize: 18,
    fontWeight: "700"
  },
  footer: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    textAlign: "center",
    lineHeight: 20,
    paddingVertical: uiTheme.spacing.lg
  }
})
