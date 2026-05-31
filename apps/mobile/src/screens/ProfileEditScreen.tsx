import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
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
  onSave: (displayName: string, age: number | undefined) => void
}

export function ProfileEditScreen(props: ProfileEditScreenProps) {
  const { navigation, currentDisplayName, currentAge, currentUserId, onSave } =
    props
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [ageText, setAgeText] = useState(
    currentAge ? String(currentAge) : ""
  )
  const [saved, setSaved] = useState(false)

  const parsedAge = Number.parseInt(ageText, 10)
  const ageValid = ageText === "" || (parsedAge >= 18 && parsedAge <= 99)
  const nameValid = displayName.trim().length >= 2
  const canSave = nameValid && ageValid && !saved

  const hasChanges =
    displayName.trim() !== currentDisplayName ||
    (ageText !== "" ? parsedAge !== currentAge : currentAge !== undefined)

  const handleSave = useCallback(() => {
    if (!canSave || !hasChanges) return
    const finalAge = ageText === "" ? undefined : parsedAge
    onSave(displayName.trim(), finalAge)
    hapticMedium()
    setSaved(true)
    setTimeout(() => navigation.goBack(), 600)
  }, [ageText, canSave, displayName, hasChanges, navigation, onSave, parsedAge])

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
            <View style={styles.previewGlow} pointerEvents="none" />
            <MyAvatar
              name={displayName || "?"}
              seed={currentUserId}
              size={100}
              ring="strong"
            />
            <Text style={styles.previewName}>
              {displayName || "Your Name"}
            </Text>
          </View>

          {/* Fields */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How should others see you?"
              placeholderTextColor={uiTheme.colors.textMuted}
              maxLength={30}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {!nameValid && displayName.length > 0 ? (
              <Text style={styles.errorHint}>At least 2 characters</Text>
            ) : null}
          </View>

          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={ageText}
              onChangeText={setAgeText}
              placeholder="Optional — must be 18+"
              placeholderTextColor={uiTheme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
            />
            {!ageValid ? (
              <Text style={styles.errorHint}>Must be between 18 and 99</Text>
            ) : null}
          </View>

          {/* Save */}
          <Pressable
            onPress={handleSave}
            disabled={!canSave || !hasChanges}
            style={({ pressed }) => [
              styles.saveButton,
              (!canSave || !hasChanges) ? styles.saveButtonDisabled : null,
              pressed ? styles.saveButtonPressed : null
            ]}
          >
            <Text style={styles.saveButtonText}>
              {saved ? "Saved ✓" : "Save Changes"}
            </Text>
          </Pressable>
        </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    gap: uiTheme.spacing.md
  },
  previewCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.card
  },
  previewGlow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -60
  },
  previewName: {
    color: uiTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "800"
  },
  fieldCard: {
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  fieldLabel: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  input: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.body,
    fontWeight: "600",
    paddingVertical: uiTheme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.colors.border
  },
  errorHint: {
    color: uiTheme.colors.danger,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  saveButton: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.xxl,
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    marginTop: uiTheme.spacing.sm
  },
  saveButtonDisabled: {
    opacity: 0.45
  },
  saveButtonPressed: {
    opacity: 0.85
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  }
})
