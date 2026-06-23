import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { OnboardingProgress } from "../components/OnboardingProgress"
import { AvatarPreview2D } from "../features/avatarV2/components/AvatarPreview2D"
import type { UpdateSessionProfileInput } from "../features/session/sessionApi"
import type { SessionActor } from "../features/session/sessionModel"
import { SoftBlobBackground } from "../ui/backgrounds"
import { FieldInput } from "../ui/fieldInput"
import { LinearGradient } from "../ui/linearGradient"
import { uiTheme } from "../ui/theme"
import { VIBE_PRESETS, VibeTilePicker } from "../ui/vibeTilePicker"

interface ProfileSetupScreenProps {
  sessionActor: SessionActor
  isSubmitting: boolean
  errorMessage: string | null
  onComplete: (input: UpdateSessionProfileInput) => Promise<void>
}

export function ProfileSetupScreen({
  sessionActor,
  isSubmitting,
  errorMessage,
  onComplete
}: ProfileSetupScreenProps) {
  const [displayName, setDisplayName] = useState(
    sessionActor.profile.displayName
  )
  const [ageText, setAgeText] = useState(
    sessionActor.profile.age ? String(sessionActor.profile.age) : ""
  )
  const [presetId, setPresetId] = useState(
    sessionActor.profile.avatar.presetId
  )

  const age = Number.parseInt(ageText, 10)
  const nameValid = displayName.trim().length >= 2
  const ageValid = Number.isFinite(age) && age >= 18 && age <= 99
  const canSubmit = useMemo(
    () => nameValid && ageValid && !isSubmitting,
    [ageValid, isSubmitting, nameValid]
  )

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="bootstrap" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <OnboardingProgress activeStep={0} />
            <AvatarPreview2D
              size={132}
              stageHeight={192}
              label={displayName.trim() || "Your DateVibe identity"}
              metaTone="light"
            />

            <View style={styles.heading}>
              <Text style={styles.title}>Who will people meet first?</Text>
              <Text style={styles.body}>
                Start with the name, age, and vibe that will introduce you.
              </Text>
            </View>

            <View style={styles.form}>
              <FieldInput
                label="Display name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your first name"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSubmitting}
                error={
                  displayName.length > 0 && !nameValid
                    ? "Use at least 2 characters"
                    : undefined
                }
              />
              <FieldInput
                label="Age"
                value={ageText}
                onChangeText={(value) =>
                  setAgeText(value.replace(/[^0-9]/g, "").slice(0, 2))
                }
                placeholder="18+"
                keyboardType="number-pad"
                editable={!isSubmitting}
                error={
                  ageText.length > 0 && !ageValid
                    ? "Use an age from 18 to 99"
                    : undefined
                }
              />
            </View>

            <View style={styles.vibe}>
              <Text style={styles.vibeTitle}>Pick your first vibe</Text>
              <VibeTilePicker selectedId={presetId} onSelect={setPresetId} />
            </View>

            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {errorMessage}
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Complete profile setup"
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => {
                void onComplete({
                  displayName: displayName.trim(),
                  age,
                  avatarPresetId: presetId
                }).catch(() => undefined)
              }}
              style={!canSubmit ? styles.disabled : null}
              testID="profile-setup-submit"
            >
              <LinearGradient
                colors={
                  canSubmit
                    ? uiTheme.gradients.primary
                    : [
                        uiTheme.colors.primaryDisabled,
                        uiTheme.colors.primaryDisabled
                      ]
                }
                style={styles.cta}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>Create my identity</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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
  flex: {
    flex: 1
  },
  content: {
    padding: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xxl,
    gap: uiTheme.spacing.lg
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
  form: {
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glassStrong,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder
  },
  vibe: {
    gap: uiTheme.spacing.sm
  },
  vibeTitle: {
    ...uiTheme.font.label,
    color: uiTheme.colors.textPrimary
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
  disabled: {
    opacity: 0.72
  }
})
