import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "./theme"
import { LinearGradient } from "./linearGradient"

interface BrandMarkProps {
  size?: number
  tone?: "light" | "dark"
  style?: StyleProp<ViewStyle>
  animated?: boolean
}

export function BrandMark(props: BrandMarkProps) {
  const { size = 48, tone = "light", style, animated = true } = props
  const glowSize = size * 0.9
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!animated) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animated, shimmerAnim])

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 0],
  })

  return (
    <View
      style={[
        styles.mark,
        tone === "light" ? uiTheme.shadow.glow : null,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style
      ]}
    >
      <LinearGradient
        colors={uiTheme.gradients.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: "center",
            justifyContent: "center",
          }
        ]}
      >
        <View
          style={{
            position: "absolute",
            top: -size * 0.2,
            right: -size * 0.2,
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: "rgba(255, 204, 224, 0.55)"
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -size * 0.28,
            left: -size * 0.18,
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: (size * 0.7) / 2,
            backgroundColor: "rgba(255, 116, 176, 0.35)"
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            width: size * 0.4,
            height: size * 1.2,
            backgroundColor: uiTheme.colors.shimmer,
            opacity: shimmerOpacity,
            transform: [{ rotate: "25deg" }, { translateX: size * 0.3 }],
          }}
          pointerEvents="none"
        />
        <Text style={[styles.markText, { fontSize: Math.round(size * 0.36) }]}>DV</Text>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  markText: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: 0.5,
    zIndex: 1
  }
})
