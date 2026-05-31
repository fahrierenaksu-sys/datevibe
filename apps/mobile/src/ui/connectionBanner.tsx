import { useEffect, useRef } from "react"
import { Animated, StyleSheet, Text, View } from "react-native"
import type { RealtimeConnectionStatus } from "../features/realtime/realtimeClient"
import { uiTheme } from "./theme"

interface ConnectionBannerProps {
  status: RealtimeConnectionStatus
}

/**
 * Slim banner that appears at the top when WebSocket is disconnected or reconnecting.
 * Slides down when visible, slides up when connected.
 */
export function ConnectionBanner(props: ConnectionBannerProps) {
  const { status } = props
  const slideAnim = useRef(new Animated.Value(-40)).current

  const shouldShow =
    status === "disconnected" ||
    status === "error" ||
    status === "connecting"

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: shouldShow ? 0 : -40,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200
    }).start()
  }, [shouldShow, slideAnim])

  if (status === "connected" || status === "idle") return null

  const isError = status === "disconnected" || status === "error"
  const label = isError ? "Reconnecting…" : "Connecting…"
  const bg = isError ? uiTheme.colors.warning : uiTheme.colors.primarySoft
  const dotColor = isError ? "#B45309" : uiTheme.colors.primary
  const textColor = isError ? "#78350F" : uiTheme.colors.primaryDeep

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: bg, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    paddingTop: 50 // account for status bar
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  text: {
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.3
  }
})
