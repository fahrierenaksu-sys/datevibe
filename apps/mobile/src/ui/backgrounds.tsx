import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native"
import { uiTheme } from "./theme"

type BackgroundVariant = "lobby" | "bootstrap" | "miniRoom"

interface SoftBlobBackgroundProps {
  variant?: BackgroundVariant
  style?: StyleProp<ViewStyle>
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

const blobConfig: Record<BackgroundVariant, { baseBackground: string; blobs: BlobSpec[] }> = {
  lobby: {
    baseBackground: uiTheme.colors.background,
    blobs: [
      { size: 360, color: uiTheme.colors.blobPink, top: -140, right: -120, opacity: 0.55 },
      { size: 280, color: uiTheme.colors.blobLilac, top: 240, left: -120, opacity: 0.45 },
      { size: 320, color: uiTheme.colors.blobPeach, bottom: -160, right: -100, opacity: 0.35 }
    ]
  },
  bootstrap: {
    baseBackground: uiTheme.colors.backgroundWarm,
    blobs: [
      { size: 420, color: uiTheme.colors.blobPink, top: -150, left: -120, opacity: 0.6 },
      { size: 340, color: uiTheme.colors.blobPeach, top: 100, right: -160, opacity: 0.5 },
      { size: 300, color: uiTheme.colors.blobLilac, bottom: -120, left: -90, opacity: 0.45 }
    ]
  },
  miniRoom: {
    baseBackground: uiTheme.colors.nightBackground,
    blobs: [
      { size: 460, color: "#B2418F", top: -200, right: -180, opacity: 0.55 },
      { size: 380, color: "#5E3B89", top: 240, left: -140, opacity: 0.5 },
      { size: 300, color: "#D12F7E", bottom: -120, right: -80, opacity: 0.3 }
    ]
  }
}

export function SoftBlobBackground(props: SoftBlobBackgroundProps) {
  const { variant = "lobby", style } = props
  const config = blobConfig[variant]

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.root, style]}
    >
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: config.baseBackground }]}
      />
      {config.blobs.map((blob, index) => (
        <View
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
            opacity: blob.opacity
          }}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: "hidden"
  }
})
