import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
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
import type { RegisterAccountInput } from "../features/session/sessionApi"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { SoftBlobBackground } from "../ui/backgrounds"
import { FieldInput } from "../ui/fieldInput"
import { LinearGradient } from "../ui/linearGradient"
import { uiTheme } from "../ui/theme"

function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim()
  const prefix = trimmed.startsWith("+") ? "+" : ""
  return `${prefix}${trimmed.replace(/[^\d]/g, "")}`
}

type RegisterScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Register"
> & {
  isSubmitting: boolean
  errorMessage: string | null
  onRegister: (input: RegisterAccountInput) => Promise<void>
  onClearError: () => void
}

export function RegisterScreen({
  navigation,
  isSubmitting,
  errorMessage,
  onRegister,
  onClearError
}: RegisterScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")

  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber)
  const phoneValid = /^\+?[1-9]\d{9,14}$/.test(normalizedPhoneNumber)
  const verificationCodeValid = /^\d{4,8}$/.test(verificationCode)
  const canSubmit = useMemo(
    () => phoneValid && verificationCodeValid && !isSubmitting,
    [isSubmitting, phoneValid, verificationCodeValid]
  )

  const submit = async (): Promise<void> => {
    if (!canSubmit) return
    await onRegister({
      phoneNumber: normalizedPhoneNumber,
      verificationCode
    }).catch(() => undefined)
  }

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to account choices"
              onPress={() => {
                onClearError()
                navigation.goBack()
              }}
              style={styles.back}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color={uiTheme.colors.textPrimary}
              />
            </Pressable>

            <View style={styles.heading}>
              <Text style={styles.eyebrow}>YOUR DATEVIBE ACCOUNT</Text>
              <Text style={styles.title}>Use your phone to save your vibe.</Text>
              <Text style={styles.body}>
                One phone number keeps your profile, avatar, room, and future matches connected.
              </Text>
            </View>

            <View style={styles.form}>
              <FieldInput
                label="Phone number"
                value={phoneNumber}
                onChangeText={(value) => {
                  setPhoneNumber(value)
                  onClearError()
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                placeholder="+90 5XX XXX XX XX"
                editable={!isSubmitting}
                error={
                  phoneNumber.length > 0 && !phoneValid
                    ? "Enter a valid phone number"
                    : undefined
                }
              />
              <FieldInput
                label="SMS code"
                value={verificationCode}
                onChangeText={(value) => {
                  setVerificationCode(value.replace(/[^0-9]/g, "").slice(0, 8))
                  onClearError()
                }}
                placeholder="4-8 digit code"
                keyboardType="number-pad"
                editable={!isSubmitting}
                error={
                  verificationCode.length > 0 && !verificationCodeValid
                    ? "Enter the SMS code"
                    : undefined
                }
                onSubmitEditing={() => {
                  void submit()
                }}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={uiTheme.colors.danger}
                />
                <Text accessibilityRole="alert" style={styles.error}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityLabel="Verify phone number and create DateVibe account"
              accessibilityRole="button"
              disabled={!canSubmit}
              onPress={() => {
                void submit()
              }}
              style={[
                styles.submitWrap,
                !canSubmit ? styles.disabled : null
              ]}
              testID="register-submit"
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
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submit}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitText}>Create account</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Text style={styles.note}>
              The code comes from the DateVibe account service. If it is unavailable,
              we will keep you here instead of switching you into demo.
            </Text>
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
    flexGrow: 1,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.xl,
    justifyContent: "center"
  },
  back: {
    position: "absolute",
    top: uiTheme.spacing.lg,
    left: uiTheme.spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  heading: {
    gap: uiTheme.spacing.sm
  },
  eyebrow: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary
  },
  title: {
    ...uiTheme.font.title,
    color: uiTheme.colors.textPrimary
  },
  body: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary
  },
  form: {
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glassStrong,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.soft
  },
  errorBox: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
    alignItems: "center",
    borderRadius: uiTheme.radius.md,
    padding: uiTheme.spacing.md,
    backgroundColor: uiTheme.colors.dangerSoft
  },
  error: {
    flex: 1,
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.dangerInk
  },
  submitWrap: {
    borderRadius: uiTheme.radius.full,
    overflow: "hidden"
  },
  submit: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center"
  },
  submitText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF"
  },
  disabled: {
    opacity: 0.72
  },
  note: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    textAlign: "center"
  }
})
