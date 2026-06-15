import { StyleSheet, Text, View } from "react-native"
import type { RealtimeConnectionStatus } from "../features/realtime/realtimeClient"
import { uiTheme } from "../ui/theme"

interface ConnectionStatusChipProps {
  status: RealtimeConnectionStatus
}

const STATUS_COLORS: Record<RealtimeConnectionStatus, string> = {
  idle: uiTheme.colors.textMuted,
  connecting: uiTheme.colors.warning,
  connected: uiTheme.colors.success,
  disconnected: uiTheme.colors.textMuted,
  error: uiTheme.colors.danger,
}

export function ConnectionStatusChip(props: ConnectionStatusChipProps) {
  const { status } = props
  return (
    <View style={[styles.chip, { borderColor: STATUS_COLORS[status] }]}>
      <View style={[styles.dot, { backgroundColor: STATUS_COLORS[status] }]} />
      <Text style={styles.text}>{status}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderRadius: uiTheme.radius.full,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.xs,
    gap: 6,
    backgroundColor: uiTheme.colors.glass,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  text: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
    textTransform: "capitalize",
  },
})
