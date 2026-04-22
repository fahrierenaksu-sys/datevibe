import type { ReactNode } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle
} from "react-native"
import { uiTheme } from "./theme"

interface ScreenSurfaceProps {
  children: ReactNode
  scrollable?: boolean
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function ScreenSurface(props: ScreenSurfaceProps) {
  const { children, scrollable = false, style, contentContainerStyle } = props

  if (scrollable) {
    return (
      <ScrollView
        style={[styles.screen, style]}
        contentContainerStyle={[styles.screenContent, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    )
  }

  return <View style={[styles.screen, styles.screenContent, style]}>{children}</View>
}

interface CardWrapperProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export function CardWrapper(props: CardWrapperProps) {
  const { children, style } = props
  return <View style={[styles.card, style]}>{children}</View>
}

interface SharedButtonProps {
  label: string
  onPress: (event: GestureResponderEvent) => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function PrimaryButton(props: SharedButtonProps) {
  const { label, onPress, disabled = false, style } = props

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.primaryButton,
        pressed && !disabled ? styles.primaryButtonPressed : null,
        disabled ? styles.primaryButtonDisabled : null,
        style
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  )
}

export function SecondaryButton(props: SharedButtonProps) {
  const { label, onPress, disabled = false, style } = props

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.buttonBase,
        styles.secondaryButton,
        pressed && !disabled ? styles.secondaryButtonPressed : null,
        disabled ? styles.secondaryButtonDisabled : null,
        style
      ]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  )
}

interface TagChipProps {
  label: string
  style?: StyleProp<ViewStyle>
}

export function TagChip(props: TagChipProps) {
  const { label, style } = props
  return (
    <View style={[styles.tagChip, style]}>
      <Text style={styles.tagChipText}>{label}</Text>
    </View>
  )
}

interface AvatarPlaceholderBlockProps {
  title?: string
  subtitle?: string
  height?: number
  style?: StyleProp<ViewStyle>
}

export function AvatarPlaceholderBlock(props: AvatarPlaceholderBlockProps) {
  const { title = "Profile visual", subtitle, height = 320, style } = props

  return (
    <View style={[styles.avatarBlock, { height }, style]}>
      <View style={styles.avatarGlow} />
      <View style={styles.avatarGlowSecondary} />
      <Text style={styles.avatarTitle}>{title}</Text>
      {subtitle ? <Text style={styles.avatarSubtitle}>{subtitle}</Text> : null}
    </View>
  )
}

interface TopBarProps {
  title: string
  subtitle?: string
  leftSlot?: ReactNode
  rightSlot?: ReactNode
  titleAlign?: "center" | "start"
  style?: StyleProp<ViewStyle>
}

export function TopBar(props: TopBarProps) {
  const { title, subtitle, leftSlot, rightSlot, titleAlign = "center", style } = props
  const isStartAligned = titleAlign === "start"
  return (
    <View style={[styles.topBar, style]}>
      <View style={styles.topBarSide}>{leftSlot}</View>
      <View style={[styles.topBarCenter, isStartAligned ? styles.topBarCenterStart : null]}>
        <Text style={styles.topBarTitle}>{title}</Text>
        {subtitle ? <Text style={styles.topBarSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.topBarSide, styles.topBarRight]}>{rightSlot}</View>
    </View>
  )
}

interface ActionButtonCircleProps {
  children: ReactNode
  onPress: (event: GestureResponderEvent) => void
  disabled?: boolean
  variant?: "primary" | "soft"
  size?: number
  style?: StyleProp<ViewStyle>
}

export function ActionButtonCircle(props: ActionButtonCircleProps) {
  const {
    children,
    onPress,
    disabled = false,
    variant = "soft",
    size = 56,
    style
  } = props

  const isPrimary = variant === "primary"

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circleButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isPrimary ? uiTheme.colors.primary : uiTheme.colors.secondary
        },
        pressed && !disabled
          ? { backgroundColor: isPrimary ? uiTheme.colors.primaryPressed : uiTheme.colors.secondaryPressed }
          : null,
        disabled ? { opacity: 0.45 } : null,
        style
      ]}
    >
      {typeof children === "string" ? (
        <Text style={[styles.circleButtonText, isPrimary ? styles.circleButtonTextPrimary : null]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
  screenContent: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.xl,
    gap: uiTheme.spacing.lg
  },
  card: {
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadow.card
  },
  buttonBase: {
    minHeight: 52,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.lg
  },
  primaryButton: {
    backgroundColor: uiTheme.colors.primary
  },
  primaryButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  primaryButtonDisabled: {
    backgroundColor: uiTheme.colors.primaryDisabled
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "700"
  },
  secondaryButton: {
    backgroundColor: uiTheme.colors.secondary
  },
  secondaryButtonPressed: {
    backgroundColor: uiTheme.colors.secondaryPressed
  },
  secondaryButtonDisabled: {
    opacity: 0.55
  },
  secondaryButtonText: {
    color: uiTheme.colors.secondaryText,
    fontSize: uiTheme.typography.body,
    fontWeight: "600"
  },
  tagChip: {
    alignSelf: "flex-start",
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.chipBackground,
    borderWidth: 1,
    borderColor: "#FAD0E3",
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: 7
  },
  tagChipText: {
    color: uiTheme.colors.chipText,
    fontSize: 11,
    fontWeight: "700"
  },
  avatarBlock: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.avatarBackground,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
    paddingHorizontal: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.lg
  },
  avatarGlow: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -26
  },
  avatarGlowSecondary: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FCE4F1",
    right: -22,
    top: 74
  },
  avatarTitle: {
    fontSize: 28,
    color: uiTheme.colors.textPrimary,
    fontWeight: "800",
    zIndex: 1
  },
  avatarSubtitle: {
    marginTop: uiTheme.spacing.xs,
    fontSize: 13,
    color: "#766985",
    zIndex: 1
  },
  topBar: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center"
  },
  topBarSide: {
    minWidth: 56,
    alignItems: "flex-start",
    justifyContent: "center"
  },
  topBarRight: {
    alignItems: "flex-end"
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  topBarCenterStart: {
    alignItems: "flex-start",
    paddingHorizontal: uiTheme.spacing.sm
  },
  topBarTitle: {
    fontSize: uiTheme.typography.heading,
    color: uiTheme.colors.textPrimary,
    fontWeight: "800"
  },
  topBarSubtitle: {
    fontSize: uiTheme.typography.caption,
    color: uiTheme.colors.textMuted,
    fontWeight: "600"
  },
  circleButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EDE3F4",
    ...uiTheme.shadow.card
  },
  circleButtonText: {
    fontSize: 19,
    color: uiTheme.colors.secondaryText,
    fontWeight: "700"
  },
  circleButtonTextPrimary: {
    color: "#FFFFFF"
  }
})
