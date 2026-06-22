import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useRef, useState } from "react"
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { MyAvatar } from "../ui/myAvatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { hapticMedium } from "../ui/haptics"

type ProfileEditScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ProfileEdit"
> & {
  currentDisplayName: string
  currentAge: number | undefined
  currentUserId: string
  onSave: (displayName: string, age: number | undefined) => Promise<void>
}

export function ProfileEditScreen(props: ProfileEditScreenProps) {
  const { navigation, currentDisplayName, currentAge, currentUserId, onSave } =
    props
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [ageText, setAgeText] = useState(
    currentAge ? String(currentAge) : ""
  )
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveScaleAnim = useRef(new Animated.Value(1)).current

  const parsedAge = Number.parseInt(ageText, 10)
  const ageValid = ageText === "" || (parsedAge >= 18 && parsedAge <= 99)
  const nameValid = displayName.trim().length >= 2
  const canSave = nameValid && ageValid && !saved && !isSaving

  const hasChanges =
    displayName.trim() !== currentDisplayName ||
    (ageText !== "" ? parsedAge !== currentAge : currentAge !== undefined)

  const handleSave = useCallback(async () => {
    if (!canSave || !hasChanges) return
    const finalAge = ageText === "" ? undefined : parsedAge
    setIsSaving(true)
    setSaveError(null)
    try {
      await onSave(displayName.trim(), finalAge)
      hapticMedium()
      setSaved(true)
      setTimeout(() => navigation.goBack(), 600)
    } catch {
      setSaveError("Could not save your profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [ageText, canSave, displayName, hasChanges, navigation, onSave, parsedAge])

  const handleSavePressIn = () => {
    Animated.spring(saveScaleAnim, {
      toValue: uiTheme.animation.scalePress,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handleSavePressOut = () => {
    Animated.spring(saveScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
  }

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView
        style={styles.safe}
        edges={["top", "left", "right", "bottom"]}
      >
        <TopBar
          title="Edit Profile"
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              ←
            </ActionButtonCircle>
          }
        />

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Preview */}
          <View style={styles.previewCard}>
            <LinearGradient
              colors={uiTheme.gradients.heroBackground as [string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.previewGlow} pointerEvents="none" />
            <MyAvatar
              name={displayName || "?"}
              seed={currentUserId}
              size={110}
              ring="strong"
            />
            <Text style={styles.previewName}>
              {displayName || "Your Name"}
            </Text>
            <Text style={styles.previewHint}>
              This is the name beside your avatar in Discover and room moments.
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Avatar Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should people meet you?"
              placeholderTextColor={uiTheme.colors.textMuted}
              maxLength={30}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {!nameValid && displayName.length > 0 ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorDot}>●</Text>
                <Text style={styles.errorHint}>At least 2 characters</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={ageText}
              onChangeText={setAgeText}
              placeholder="Optional, shown on your profile"
              placeholderTextColor={uiTheme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
            {!ageValid ? (
              <View style={styles.errorRow}>
                <Text style={styles.errorDot}>●</Text>
                <Text style={styles.errorHint}>Must be between 18 and 99</Text>
              </View>
            ) : null}
            <Text style={styles.fieldHint}>
              Your avatar, room, and vibe carry the expression; keep profile details simple.
            </Text>
          </View>

          {saveError ? (
            <Text accessibilityRole="alert" style={styles.saveError}>
              {saveError}
            </Text>
          ) : null}

          {/* Save */}
          <Animated.View style={[styles.saveWrap, { transform: [{ scale: saveScaleAnim }] }]}>
            <Pressable
              onPress={handleSave}
              onPressIn={handleSavePressIn}
              onPressOut={handleSavePressOut}
              disabled={!canSave || !hasChanges}
              style={[
                styles.saveButton,
                (!canSave || !hasChanges) ? styles.saveButtonDisabled : null,
              ]}
            >
              <LinearGradient
                colors={
                  canSave && hasChanges
                    ? uiTheme.gradients.primary as [string, string]
                    : [uiTheme.colors.primaryDisabled, uiTheme.colors.primaryDisabled]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {saved ? "Saved ✓" : isSaving ? "Saving..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
  },
  content: {
    flex: 1,
    gap: uiTheme.spacing.md,
  },
  previewCard: {
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.xl,
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.deep,
  },
  previewGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -80,
  },
  previewName: {
    ...uiTheme.font.title,
    color: uiTheme.colors.textPrimary,
    fontSize: 26,
  },
  previewHint: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
    lineHeight: 18,
    textAlign: "center",
  },
  fieldCard: {
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.soft,
  },
  fieldLabel: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  input: {
    ...uiTheme.font.bodyMedium,
    color: uiTheme.colors.textPrimary,
    paddingVertical: uiTheme.spacing.xs,
    borderBottomWidth: 1.5,
    borderBottomColor: uiTheme.colors.border,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  errorDot: {
    color: uiTheme.colors.danger,
    fontSize: 6,
  },
  errorHint: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.danger,
    fontWeight: "700",
  },
  fieldHint: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    lineHeight: 18,
  },
  saveError: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.danger,
    fontWeight: "700",
    textAlign: "center",
  },
  saveWrap: {
    alignSelf: "center",
    marginTop: uiTheme.spacing.sm,
  },
  saveButton: {
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glow,
  },
  saveButtonGradient: {
    paddingHorizontal: uiTheme.spacing.xxl,
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  saveButtonText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF",
  },
})
