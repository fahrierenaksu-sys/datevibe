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
import type { BootstrapSessionInput } from "../features/session/sessionApi"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BrandMark } from "../ui/brandMark"
import { FieldInput } from "../ui/fieldInput"
import { uiTheme } from "../ui/theme"
import { VIBE_PRESETS, VibeTilePicker } from "../ui/vibeTilePicker"

interface SessionBootstrapScreenProps {
  isSubmitting: boolean
  errorMessage: string | null
  onBootstrap: (input: BootstrapSessionInput) => Promise<void>
}

export function SessionBootstrapScreen(props: SessionBootstrapScreenProps) {
  const { isSubmitting, errorMessage, onBootstrap } = props
  const [displayName, setDisplayName] = useState("")
  const [ageText, setAgeText] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<string>(VIBE_PRESETS[0].id)

  const parsedAge = ageText.length > 0 ? Number.parseInt(ageText, 10) : undefined
  const ageValid = parsedAge === undefined || (Number.isFinite(parsedAge) && parsedAge >= 18 && parsedAge <= 99)

  const canSubmit = useMemo(
    () => displayName.trim().length >= 2 && ageValid && !isSubmitting,
    [displayName, ageValid, isSubmitting]
  )

  const submit = async (): Promise<void> => {
    if (!canSubmit) {
      return
    }
    await onBootstrap({
      displayName: displayName.trim(),
      avatarPresetId: selectedPreset,
      age: parsedAge
    })
  }

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="bootstrap" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <BrandMark size={56} />
              <View style={styles.heroText}>
                <Text style={styles.eyebrow}>Welcome to DateVibe</Text>
                <Text style={styles.headline}>
                  Real people.{"\n"}Right here. Right now.
                </Text>
                <Text style={styles.subhead}>
                  We pair you with someone nearby for a short, real mini-chat. Bring your vibe.
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <FieldInput
                label="What should we call you?"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoCorrect={false}
                placeholder="Your first name"
                editable={!isSubmitting}
                returnKeyType="next"
                onSubmitEditing={() => {
                  // focus next field ideally
                }}
              />

              <FieldInput
                label="How old are you? (optional)"
                value={ageText}
                onChangeText={(text) => setAgeText(text.replace(/[^0-9]/g, "").slice(0, 2))}
                keyboardType="number-pad"
                placeholder="e.g. 24"
                editable={!isSubmitting}
                returnKeyType="done"
                onSubmitEditing={() => {
                  void submit()
                }}
              />
              {ageText.length > 0 && !ageValid ? (
                <Text style={styles.ageHint}>Must be 18–99</Text>
              ) : null}

              <View style={styles.vibeGroup}>
                <Text style={styles.vibeLabel}>Pick a vibe</Text>
                <Text style={styles.vibeHelper}>
                  This becomes your profile color until you add a photo.
                </Text>
                <VibeTilePicker
                  selectedId={selectedPreset}
                  onSelect={setSelectedPreset}
                />
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <Pressable
                disabled={!canSubmit}
                onPress={() => {
                  void submit()
                }}
                style={({ pressed }) => [
                  styles.cta,
                  !canSubmit ? styles.ctaDisabled : null,
                  pressed && canSubmit ? styles.ctaPressed : null
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.ctaText}>Start discovering</Text>
                )}
              </Pressable>

              <Text style={styles.footnote}>
                By continuing, you agree to DateVibe's community rules. Be kind. Be real.
              </Text>
            </View>
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
  kav: {
    flex: 1
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xl,
    gap: uiTheme.spacing.xl,
    justifyContent: "space-between"
  },
  hero: {
    gap: uiTheme.spacing.md,
    marginTop: uiTheme.spacing.md
  },
  heroText: {
    gap: uiTheme.spacing.xs
  },
  eyebrow: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  headline: {
    color: uiTheme.colors.textPrimary,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  subhead: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    lineHeight: 22
  },
  form: {
    gap: uiTheme.spacing.md
  },
  vibeGroup: {
    gap: 6
  },
  vibeLabel: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  vibeHelper: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    marginBottom: uiTheme.spacing.xs
  },
  errorBanner: {
    borderRadius: uiTheme.radius.md,
    backgroundColor: uiTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#F7C9D1",
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm
  },
  errorText: {
    color: uiTheme.colors.dangerInk,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600"
  },
  cta: {
    marginTop: uiTheme.spacing.xs,
    minHeight: 56,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...uiTheme.shadow.lift
  },
  ctaDisabled: {
    backgroundColor: uiTheme.colors.primaryDisabled,
    shadowOpacity: 0,
    elevation: 0
  },
  ctaPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  footnote: {
    textAlign: "center",
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    lineHeight: 18,
    paddingHorizontal: uiTheme.spacing.sm
  },
  ageHint: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600",
    marginTop: -uiTheme.spacing.xs
  }
})
