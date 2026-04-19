import { StyleSheet, Text, View } from "react-native"
import type { RealtimeConnectionStatus } from "../features/realtime/realtimeClient"

interface ConnectionStatusChipProps {
  status: RealtimeConnectionStatus
}

const STATUS_COLORS: Record<RealtimeConnectionStatus, string> = {
  idle: "#8b8b8b",
  connecting: "#f59e0b",
  connected: "#16a34a",
  disconnected: "#6b7280",
  error: "#dc2626"
}

export function ConnectionStatusChip(props: ConnectionStatusChipProps): JSX.Element {
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
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize"
  }
})
