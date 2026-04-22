import { StyleSheet, Text, View } from "react-native"
import { uiTheme } from "./theme"

export type ConnectionPillStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

interface ConnectionPillProps {
  status: ConnectionPillStatus
  tone?: "light" | "dark"
}

interface PillVisual {
  label: string
  dot: string
  bg: string
  text: string
  nightBg: string
  nightText: string
}

const visualByStatus: Record<ConnectionPillStatus, PillVisual> = {
  idle: {
    label: "Ready",
    dot: uiTheme.colors.textMuted,
    bg: uiTheme.colors.secondary,
    text: uiTheme.colors.secondaryText,
    nightBg: uiTheme.colors.nightSurfaceSoft,
    nightText: uiTheme.colors.nightTextSecondary
  },
  connecting: {
    label: "Connecting",
    dot: uiTheme.colors.warning,
    bg: uiTheme.colors.warningSoft,
    text: uiTheme.colors.warningInk,
    nightBg: "rgba(224, 165, 58, 0.18)",
    nightText: "#FFD58E"
  },
  connected: {
    label: "Live",
    dot: uiTheme.colors.success,
    bg: uiTheme.colors.successSoft,
    text: uiTheme.colors.successInk,
    nightBg: "rgba(58, 192, 138, 0.18)",
    nightText: "#7CE3B7"
  },
  disconnected: {
    label: "Offline",
    dot: uiTheme.colors.danger,
    bg: uiTheme.colors.dangerSoft,
    text: uiTheme.colors.dangerInk,
    nightBg: "rgba(226, 88, 108, 0.22)",
    nightText: "#FFA5B0"
  },
  error: {
    label: "Offline",
    dot: uiTheme.colors.danger,
    bg: uiTheme.colors.dangerSoft,
    text: uiTheme.colors.dangerInk,
    nightBg: "rgba(226, 88, 108, 0.22)",
    nightText: "#FFA5B0"
  }
}

export function ConnectionPill(props: ConnectionPillProps) {
  const { status, tone = "light" } = props
  const visual = visualByStatus[status]
  const isDark = tone === "dark"
  const backgroundColor = isDark ? visual.nightBg : visual.bg
  const textColor = isDark ? visual.nightText : visual.text

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: visual.dot }]} />
      <Text style={[styles.label, { color: textColor }]}>{visual.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: uiTheme.radius.full
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4
  }
})
