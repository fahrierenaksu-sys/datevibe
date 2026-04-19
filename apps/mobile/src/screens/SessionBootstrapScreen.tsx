import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"
import type { BootstrapSessionInput } from "../features/session/sessionApi"

interface SessionBootstrapScreenProps {
  isSubmitting: boolean
  errorMessage: string | null
  onBootstrap: (input: BootstrapSessionInput) => Promise<void>
}

export function SessionBootstrapScreen(
  props: SessionBootstrapScreenProps
): JSX.Element {
  const { isSubmitting, errorMessage, onBootstrap } = props

  const [displayName, setDisplayName] = useState("")
  const [avatarPresetId, setAvatarPresetId] = useState("default")

  const canSubmit = useMemo(() => displayName.trim().length > 0 && !isSubmitting, [
    displayName,
    isSubmitting
  ])

  const submit = async (): Promise<void> => {
    if (!canSubmit) {
      return
    }
    await onBootstrap({
      displayName: displayName.trim(),
      avatarPresetId: avatarPresetId.trim() || undefined
    })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DateVibe Mobile</Text>
      <Text style={styles.subtitle}>Bootstrap your MVP session</Text>

      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        placeholder="Display name"
        editable={!isSubmitting}
      />

      <TextInput
        style={styles.input}
        value={avatarPresetId}
        onChangeText={setAvatarPresetId}
        autoCapitalize="none"
        placeholder="Avatar preset (optional)"
        editable={!isSubmitting}
      />

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={() => {
          void submit()
        }}
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#ffffff"
  },
  title: {
    fontSize: 28,
    fontWeight: "700"
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  button: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44
  },
  buttonDisabled: {
    opacity: 0.45
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600"
  },
  error: {
    marginTop: 4,
    color: "#dc2626",
    fontSize: 13
  }
})
