import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { LinearGradient } from "../ui/linearGradient"
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
  const [gender, setGender] = useState<"male" | "female" | "other" | undefined>(undefined)
  const [selectedPreset, setSelectedPreset] = useState<string>(VIBE_PRESETS[0].id)
  const ctaScaleAnim = useRef(new Animated.Value(1)).current
  const heroAnim = useRef(new Animated.Value(0)).current

  // Hero entrance animation
  useEffect(() => {
    Animated.spring(heroAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springGentle,
    }).start()
  }, [heroAnim])

  const parsedAge = ageText.length > 0 ? Number.parseInt(ageText, 10) : undefined
  const ageValid = parsedAge === undefined || (Number.isFinite(parsedAge) && parsedAge >= 18 && parsedAge <= 99)

  const canSubmit = useMemo(
    () => displayName.trim().length >= 2 && ageValid && gender !== undefined && !isSubmitting,
    [displayName, ageValid, gender, isSubmitting]
  )

  const submit = async (): Promise<void> => {
    if (!canSubmit) {
      return
    }
    await onBootstrap({
      displayName: displayName.trim(),
      avatarPresetId: selectedPreset,
      age: parsedAge,
      gender: gender
    })
  }

  const handleCtaPressIn = () => {
    Animated.spring(ctaScaleAnim, {
      toValue: uiTheme.animation.scalePress,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handleCtaPressOut = () => {
    Animated.spring(ctaScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
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
            <Animated.View
              style={[
                styles.hero,
                {
                  opacity: heroAnim,
                  transform: [
                    {
                      translateY: heroAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-16, 0],
                      })
                    }
                  ],
                }
              ]}
            >
              <View style={styles.brandWrap}>
                <BrandMark size={64} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.eyebrow}>Welcome to DateVibe</Text>
                <Text style={styles.headline}>
                  Your avatar.{"\n"}Your room. Your vibe.
                </Text>
                <Text style={styles.subhead}>
                  Set your name and vibe first. Your avatar and room become the way people meet you across DateVibe.
                </Text>
              </View>
            </Animated.View>

            <View style={styles.form}>
              <View style={styles.formCard}>
                <FieldInput
                  label="What should we call you?"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="Your first name"
                  editable={!isSubmitting}
                  returnKeyType="next"
                  icon="✦"
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
                  icon="🎂"
                  onSubmitEditing={() => {
                    void submit()
                  }}
                />
                {ageText.length > 0 && !ageValid ? (
                  <Text style={styles.ageHint}>Must be 18–99</Text>
                ) : null}

                <View style={styles.genderRow}>
                  <Text style={styles.genderLabel}>Gender</Text>
                  <View style={styles.genderButtons}>
                    <Pressable
                      style={[styles.genderButton, gender === "male" && styles.genderButtonActive]}
                      onPress={() => setGender("male")}
                    >
                      <Text style={[styles.genderButtonText, gender === "male" && styles.genderButtonTextActive]}>Erkek</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.genderButton, gender === "female" && styles.genderButtonActive]}
                      onPress={() => setGender("female")}
                    >
                      <Text style={[styles.genderButtonText, gender === "female" && styles.genderButtonTextActive]}>Kadın</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.genderButton, gender === "other" && styles.genderButtonActive]}
                      onPress={() => setGender("other")}
                    >
                      <Text style={[styles.genderButtonText, gender === "other" && styles.genderButtonTextActive]}>Diğer</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.vibeCard}>
                <Text style={styles.vibeLabel}>Pick a vibe</Text>
                <Text style={styles.vibeHelper}>
                  This gives your avatar-first profile its first mood. You can customize your look and room next.
                </Text>
                <VibeTilePicker
                  selectedId={selectedPreset}
                  onSelect={setSelectedPreset}
                />
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <Animated.View style={{ transform: [{ scale: ctaScaleAnim }] }}>
                <Pressable
                  disabled={!canSubmit}
                  onPress={() => {
                    void submit()
                  }}
                  onPressIn={handleCtaPressIn}
                  onPressOut={handleCtaPressOut}
                  style={[
                    styles.cta,
                    !canSubmit ? styles.ctaDisabled : null,
                  ]}
                >
                  <LinearGradient
                    colors={
                      canSubmit
                        ? uiTheme.gradients.primary as [string, string]
                        : [uiTheme.colors.primaryDisabled, uiTheme.colors.primaryDisabled]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.ctaText}>Enter DateVibe</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              <Text style={styles.footnote}>
                Be kind in rooms, chats, and matches. DateVibe is built for avatar-first presence, not photo judging.
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
    backgroundColor: uiTheme.colors.backgroundWarm,
  },
  safe: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xl,
    gap: uiTheme.spacing.xl,
    justifyContent: "space-between",
  },
  hero: {
    gap: uiTheme.spacing.lg,
    marginTop: uiTheme.spacing.md,
  },
  brandWrap: {
    ...uiTheme.shadow.glow,
    borderRadius: 32,
    alignSelf: "flex-start",
  },
  heroText: {
    gap: uiTheme.spacing.sm,
  },
  eyebrow: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  headline: {
    ...uiTheme.font.display,
    fontSize: 36,
    lineHeight: 42,
    color: uiTheme.colors.textPrimary,
  },
  subhead: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary,
  },
  form: {
    gap: uiTheme.spacing.lg,
  },
  formCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    ...uiTheme.shadow.soft,
  },
  vibeCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.xs,
    ...uiTheme.shadow.soft,
  },
  vibeLabel: {
    ...uiTheme.font.label,
    color: uiTheme.colors.textPrimary,
  },
  vibeHelper: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    marginBottom: uiTheme.spacing.xs,
  },
  errorBanner: {
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#F7C9D1",
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs,
  },
  errorIcon: {
    fontSize: 16,
  },
  errorText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.dangerInk,
    fontWeight: "600",
    flex: 1,
  },
  cta: {
    marginTop: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glow,
  },
  ctaGradient: {
    minHeight: 56,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  footnote: {
    ...uiTheme.font.caption,
    textAlign: "center",
    color: uiTheme.colors.textMuted,
    lineHeight: 18,
    paddingHorizontal: uiTheme.spacing.sm,
  },
  ageHint: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.danger,
    fontWeight: "600",
    marginTop: -uiTheme.spacing.xs,
  },
  genderRow: {
    marginTop: uiTheme.spacing.sm,
    gap: uiTheme.spacing.xs,
  },
  genderLabel: {
    ...uiTheme.font.label,
    color: uiTheme.colors.textPrimary,
  },
  genderButtons: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
  },
  genderButton: {
    flex: 1,
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    alignItems: "center",
  },
  genderButtonActive: {
    borderColor: uiTheme.colors.primary,
    backgroundColor: uiTheme.colors.primarySoft,
  },
  genderButtonText: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary,
  },
  genderButtonTextActive: {
    color: uiTheme.colors.primary,
    fontWeight: "600",
  },
})
