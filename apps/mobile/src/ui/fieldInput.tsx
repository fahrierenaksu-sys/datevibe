import { useState } from "react"
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle
} from "react-native"
import { uiTheme } from "./theme"

interface FieldInputProps extends Omit<TextInputProps, "style"> {
  label: string
  helper?: string
  error?: string
  containerStyle?: StyleProp<ViewStyle>
}

export function FieldInput(props: FieldInputProps) {
  const { label, helper, error, containerStyle, onFocus, onBlur, ...inputProps } = props
  const [focused, setFocused] = useState(false)

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          focused ? styles.inputWrapperFocused : null,
          error ? styles.inputWrapperError : null
        ]}
      >
        <TextInput
          {...inputProps}
          placeholderTextColor={uiTheme.colors.textMuted}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            onBlur?.(event)
          }}
          style={styles.input}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8
  },
  label: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  inputWrapper: {
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1.5,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: 4
  },
  inputWrapperFocused: {
    borderColor: uiTheme.colors.primary,
    backgroundColor: uiTheme.colors.surfaceRaised,
    ...uiTheme.shadow.soft
  },
  inputWrapperError: {
    borderColor: uiTheme.colors.danger
  },
  input: {
    minHeight: 52,
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.body,
    fontWeight: "600"
  },
  helperText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption
  },
  errorText: {
    color: uiTheme.colors.dangerInk,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600"
  }
})
