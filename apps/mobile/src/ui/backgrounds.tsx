import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "./theme"
import { LinearGradient } from "./linearGradient"

type BackgroundVariant = "lobby" | "bootstrap" | "miniRoom"

interface SoftBlobBackgroundProps {
  variant?: BackgroundVariant
  style?: StyleProp<ViewStyle>
  animated?: boolean
}

interface BlobSpec {
  size: number
  color: string
  top?: number
  left?: number
  right?: number
  bottom?: number
  opacity: number
}

const blobConfig: Record<BackgroundVariant, { baseColors: string[]; blobs: BlobSpec[] }> = {
  lobby: {
    baseColors: [uiTheme.colors.background, uiTheme.colors.backgroundWarm, uiTheme.colors.background],
    blobs: [
      { size: 380, color: uiTheme.colors.blobPink, top: -150, right: -130, opacity: 0.5 },
      { size: 300, color: uiTheme.colors.blobLilac, top: 260, left: -130, opacity: 0.4 },
      { size: 340, color: uiTheme.colors.blobPeach, bottom: -170, right: -110, opacity: 0.3 },
      { size: 200, color: uiTheme.colors.blobMint, bottom: 120, left: 60, opacity: 0.25 },
    ]
  },
  bootstrap: {
    baseColors: [uiTheme.colors.backgroundWarm, "#FFF2F8", uiTheme.colors.backgroundWarm],
    blobs: [
      { size: 440, color: uiTheme.colors.blobPink, top: -160, left: -130, opacity: 0.55 },
      { size: 360, color: uiTheme.colors.blobPeach, top: 120, right: -170, opacity: 0.45 },
      { size: 320, color: uiTheme.colors.blobLilac, bottom: -130, left: -100, opacity: 0.4 },
    ]
  },
  miniRoom: {
    baseColors: [uiTheme.colors.nightBackground, "#2D1B4E", uiTheme.colors.nightBackground],
    blobs: [
      { size: 480, color: "#B2418F", top: -210, right: -190, opacity: 0.5 },
      { size: 400, color: "#5E3B89", top: 260, left: -150, opacity: 0.45 },
      { size: 320, color: "#D12F7E", bottom: -130, right: -90, opacity: 0.25 },
    ]
  }
}

export function SoftBlobBackground(props: SoftBlobBackgroundProps) {
  const { variant = "lobby", style, animated = true } = props
  const config = blobConfig[variant]
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!animated) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [animated, pulseAnim])

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.root, style]}
    >
      <LinearGradient
        colors={config.baseColors as [string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {config.blobs.map((blob, index) => {
        const isEven = index % 2 === 0
        const scaleInterp = animated
          ? pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: isEven ? [1, 1.12] : [1.08, 0.96],
            })
          : 1

        return (
          <Animated.View
            key={index}
            style={{
              position: "absolute",
              width: blob.size,
              height: blob.size,
              borderRadius: blob.size / 2,
              backgroundColor: blob.color,
              top: blob.top,
              left: blob.left,
              right: blob.right,
              bottom: blob.bottom,
              opacity: blob.opacity,
              transform: [{ scale: scaleInterp }],
            }}
          />
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden"
  }
})
