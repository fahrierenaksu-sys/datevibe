import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View } from "react-native"
import type { RealtimeConnectionStatus } from "../features/realtime/realtimeClient"
import { LinearGradient } from "./linearGradient"
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
  const slideAnim = useRef(new Animated.Value(-60)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  const shouldShow =
    status === "disconnected" ||
    status === "error" ||
    status === "connecting"

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: shouldShow ? 0 : -60,
      useNativeDriver: true,
      damping: 22,
      stiffness: 240,
    }).start()
  }, [shouldShow, slideAnim])

  // Breathing pulse for the dot
  useEffect(() => {
    if (!shouldShow) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.5,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [shouldShow, pulseAnim])

  if (status === "connected" || status === "idle") return null

  const isError = status === "disconnected" || status === "error"
  const label = isError ? "Reconnecting to the room…" : "Connecting to the room…"
  const gradientColors = isError
    ? ["#FFE0B2", "#FFCC80"] as [string, string]
    : [uiTheme.colors.primarySoft, "#FFE2EE"] as [string, string]
  const dotColor = isError ? "#B45309" : uiTheme.colors.primary
  const textColor = isError ? "#78350F" : uiTheme.colors.primaryDeep

  return (
    <Animated.View
      style={[
        styles.banner,
        { transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerGradient}
      >
        <View style={styles.dotWrap}>
          <Animated.View
            style={[
              styles.dotPulse,
              {
                backgroundColor: dotColor,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.5],
                  outputRange: [0.4, 0],
                }),
              }
            ]}
          />
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        </View>
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      </LinearGradient>
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
    ...uiTheme.shadow.soft,
  },
  bannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingTop: 54, // account for status bar
    paddingBottom: 10,
  },
  dotWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotPulse: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  text: {
    ...uiTheme.font.captionBold,
    letterSpacing: 0.3,
  }
})
