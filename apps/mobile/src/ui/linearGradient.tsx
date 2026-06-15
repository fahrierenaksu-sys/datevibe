import type { ReactNode } from "react"
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"

interface LinearGradientProps {
  children?: ReactNode
  colors: readonly string[]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
  style?: StyleProp<ViewStyle>
}

export function LinearGradient(props: LinearGradientProps) {
  const { children, colors, style } = props
  const baseColor = colors[0] ?? "transparent"
  const overlayColors = colors.slice(1, 4)

  return (
    <View style={[style, { backgroundColor: baseColor, overflow: "hidden" }]}>
      {overlayColors.map((color, index) => (
        <View
          key={`${color}-${index}`}
          pointerEvents="none"
          style={[
            styles.overlay,
            {
              backgroundColor: color,
              opacity: 0.42 - index * 0.1,
              left: `${18 + index * 16}%`,
              top: `${-12 + index * 12}%`,
              transform: [{ rotate: "18deg" }]
            }
          ]}
        />
      ))}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width: "86%",
    height: "150%",
    borderRadius: 999
  }
})
