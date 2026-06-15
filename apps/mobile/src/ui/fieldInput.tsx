import { useRef, useState } from "react"
import {
  Animated,
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
  icon?: string
}

export function FieldInput(props: FieldInputProps) {
  const { label, helper, error, containerStyle, icon, onFocus, onBlur, ...inputProps } = props
  const [focused, setFocused] = useState(false)
  const borderAnim = useRef(new Animated.Value(0)).current

  const handleFocus = (event: any) => {
    setFocused(true)
    Animated.spring(borderAnim, {
      toValue: 1,
      useNativeDriver: false,
      ...uiTheme.animation.spring,
    }).start()
    onFocus?.(event)
  }

  const handleBlur = (event: any) => {
    setFocused(false)
    Animated.spring(borderAnim, {
      toValue: 0,
      useNativeDriver: false,
      ...uiTheme.animation.spring,
    }).start()
    onBlur?.(event)
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [uiTheme.colors.border, uiTheme.colors.primary],
  })

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused ? styles.inputWrapperFocused : null,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {icon ? (
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor={uiTheme.colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, icon ? styles.inputWithIcon : null]}
        />
      </Animated.View>
      {error ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorDot}>●</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: uiTheme.spacing.xs,
  },
  label: {
    ...uiTheme.font.label,
    color: uiTheme.colors.textPrimary,
  },
  inputWrapper: {
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1.5,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWrapperFocused: {
    backgroundColor: uiTheme.colors.surfaceRaised,
    ...uiTheme.shadow.soft,
  },
  inputWrapperError: {
    borderColor: uiTheme.colors.danger,
    backgroundColor: "#FFF8F9",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: uiTheme.colors.chipBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: uiTheme.spacing.xs,
  },
  iconText: {
    fontSize: 14,
  },
  input: {
    flex: 1,
    minHeight: 52,
    color: uiTheme.colors.textPrimary,
    ...uiTheme.font.bodyMedium,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  helperText: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    paddingLeft: 2,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 2,
  },
  errorDot: {
    color: uiTheme.colors.danger,
    fontSize: 6,
  },
  errorText: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.dangerInk,
    fontWeight: "600",
  },
})
