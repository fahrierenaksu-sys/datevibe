import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "./theme"

interface BrandMarkProps {
  size?: number
  tone?: "light" | "dark"
  style?: StyleProp<ViewStyle>
}

export function BrandMark(props: BrandMarkProps) {
  const { size = 48, tone = "light", style } = props
  const glowSize = size * 0.9
  return (
    <View
      style={[
        styles.mark,
        tone === "light" ? uiTheme.shadow.lift : null,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: uiTheme.colors.primary
        },
        style
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
          backgroundColor: "rgba(255, 204, 224, 0.7)"
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
          backgroundColor: "rgba(255, 116, 176, 0.45)"
        }}
      />
      <Text style={[styles.markText, { fontSize: Math.round(size * 0.36) }]}>DV</Text>
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
