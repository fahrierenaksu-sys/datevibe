import { useMemo } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { OnboardingProgress } from "../components/OnboardingProgress"
import { RoomRenderer2D } from "../features/roomV2/components/RoomRenderer2D"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import { resolveRoomV2Scene } from "../features/roomV2/roomV2Selectors"
import { useRoomV2 } from "../features/roomV2/state/RoomV2Provider"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { uiTheme } from "../ui/theme"

interface RoomSetupScreenProps {
  isSubmitting: boolean
  errorMessage: string | null
  onComplete: () => Promise<void>
}

export function RoomSetupScreen({
  isSubmitting,
  errorMessage,
  onComplete
}: RoomSetupScreenProps) {
  const { userRoomDecor, resetRoomDecor } = useRoomV2()
  const scene = useMemo(
    () =>
      resolveRoomV2Scene({
        roomShellCatalog: ROOM_V2_SHELL_CATALOG,
        furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
        decor: userRoomDecor,
        defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
      }),
    [userRoomDecor]
  )

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="bootstrap" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <OnboardingProgress activeStep={2} />
          <View style={styles.roomFrame}>
            <RoomRenderer2D
              shell={scene.shell}
              renderItems={scene.renderItems}
              testID="onboarding-room-preview"
            />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Your room is part of your first impression.</Text>
            <Text style={styles.body}>
              Start cozy. You can move furniture and unlock new pieces after setup.
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Reset starter room"
            accessibilityRole="button"
            onPress={resetRoomDecor}
            style={styles.reset}
            testID="room-setup-reset"
          >
            <Text style={styles.resetText}>Reset starter room</Text>
          </Pressable>

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="Complete room setup and enter DateVibe"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              void onComplete().catch(() => undefined)
            }}
            style={isSubmitting ? styles.disabled : null}
            testID="room-setup-submit"
          >
            <LinearGradient
              colors={uiTheme.gradients.primary}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaText}>Enter DateVibe</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.ready}>
            You're almost ready to meet someone.
          </Text>
        </ScrollView>
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
    flex: 1
  },
  content: {
    padding: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xxl,
    gap: uiTheme.spacing.lg
  },
  roomFrame: {
    borderRadius: uiTheme.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    ...uiTheme.shadow.deep
  },
  heading: {
    gap: uiTheme.spacing.xs
  },
  title: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
    textAlign: "center"
  },
  body: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    textAlign: "center"
  },
  reset: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.sm
  },
  resetText: {
    ...uiTheme.font.label,
    color: uiTheme.colors.primaryDeep
  },
  error: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.dangerInk,
    textAlign: "center"
  },
  cta: {
    minHeight: 56,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  ctaText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF"
  },
  ready: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    textAlign: "center"
  },
  disabled: {
    opacity: 0.72
  }
})
