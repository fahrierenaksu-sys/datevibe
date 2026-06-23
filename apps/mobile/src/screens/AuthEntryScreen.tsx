import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AvatarPreview2D } from "../features/avatarV2/components/AvatarPreview2D"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BrandMark } from "../ui/brandMark"
import { LinearGradient } from "../ui/linearGradient"
import { uiTheme } from "../ui/theme"

type AuthEntryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "AuthEntry"
> & {
  isSubmitting: boolean
  errorMessage: string | null
  onStartDemo: () => Promise<void>
  onClearError: () => void
}

export function AuthEntryScreen({
  navigation,
  isSubmitting,
  errorMessage,
  onStartDemo,
  onClearError
}: AuthEntryScreenProps) {
  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="bootstrap" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.brandRow}>
          <BrandMark size={38} />
          <Text style={styles.brand}>DateVibe</Text>
        </View>

        <View style={styles.hero}>
          <AvatarPreview2D
            size={150}
            stageHeight={224}
            label="Your identity starts here"
            metaTone="light"
          />
          <Text style={styles.title}>Build your DateVibe world.</Text>
          <Text style={styles.body}>
            Create your identity, choose your look, and make a room people remember.
          </Text>
        </View>

        <View style={styles.actions}>
          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a DateVibe account"
            onPress={() => {
              onClearError()
              navigation.navigate("Register")
            }}
            style={styles.primaryWrap}
          >
            <LinearGradient
              colors={uiTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primary}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.primaryText}>Create my account</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Try the demo world first"
            disabled={isSubmitting}
            onPress={() => {
              onClearError()
              void onStartDemo().catch(() => undefined)
            }}
            style={({ pressed }) => [
              styles.secondary,
              pressed ? styles.pressed : null
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={uiTheme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="game-controller-outline"
                  size={20}
                  color={uiTheme.colors.primaryDeep}
                />
                <Text style={styles.secondaryText}>Try demo world</Text>
              </>
            )}
          </Pressable>

          <Text style={styles.demoNote}>
            Demo stays separate from a real DateVibe account.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.backgroundWarm
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.lg
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm
  },
  brand: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary
  },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm
  },
  title: {
    ...uiTheme.font.title,
    color: uiTheme.colors.textPrimary,
    textAlign: "center"
  },
  body: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary,
    textAlign: "center",
    maxWidth: 340
  },
  actions: {
    gap: uiTheme.spacing.sm
  },
  primaryWrap: {
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glowSubtle
  },
  primary: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm
  },
  primaryText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF"
  },
  secondary: {
    minHeight: 54,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: uiTheme.colors.borderStrong,
    backgroundColor: uiTheme.colors.glassStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm
  },
  secondaryText: {
    ...uiTheme.font.bodyBold,
    color: uiTheme.colors.primaryDeep
  },
  pressed: {
    opacity: 0.82
  },
  demoNote: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    textAlign: "center"
  },
  error: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.dangerInk,
    textAlign: "center"
  }
})
