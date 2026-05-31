import { Image, StyleSheet, View } from "react-native"
import type { RoomV2AvatarRenderLayer } from "../../../roomV2/roomV2.types"

interface RoomAvatarRenderer2DProps {
  layers: RoomV2AvatarRenderLayer[]
}

export function RoomAvatarRenderer2D(props: RoomAvatarRenderer2DProps) {
  const { layers } = props

  return (
    <View pointerEvents="none" style={styles.root}>
      {layers.map((layer) => (
        <Image
          key={`${layer.type}:${layer.id}:${layer.asset.key}`}
          source={layer.asset.source}
          resizeMode="contain"
          style={styles.layer}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "visible"
  },
  layer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  }
})
