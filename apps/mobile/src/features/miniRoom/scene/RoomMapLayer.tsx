import { Image, StyleSheet, View } from "react-native"
import type { InteractionState, RoomScene } from "./miniRoomSceneTypes"

interface RoomMapLayerProps {
  scene: RoomScene
  interaction: InteractionState
}

export function RoomMapLayer(props: RoomMapLayerProps) {
  const { scene, interaction } = props
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={scene.map.backgroundAsset}
        resizeMode="cover"
        style={styles.background}
      />

      <View style={styles.topGlow} pointerEvents="none" />
      <View style={styles.floorPool} pointerEvents="none" />
      <View style={styles.vignetteTop} pointerEvents="none" />
      <View style={styles.vignetteBottom} pointerEvents="none" />
      <View style={styles.vignetteLeft} pointerEvents="none" />
      <View style={styles.vignetteRight} pointerEvents="none" />

      {interaction.pressedPoint ? (
        <View
          style={[
            styles.tapTarget,
            {
              left: `${interaction.pressedPoint.x * 100}%`,
              top: `${interaction.pressedPoint.y * 100}%`
            }
          ]}
        >
          <View style={styles.tapTargetRingOuter} />
          <View style={styles.tapTargetRingInner} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    width: "100%",
    height: "100%"
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "28%",
    backgroundColor: "rgba(255, 229, 244, 0.22)"
  },
  floorPool: {
    position: "absolute",
    left: "14%",
    right: "14%",
    bottom: "12%",
    height: "20%",
    borderRadius: 180,
    backgroundColor: "rgba(94, 43, 71, 0.05)"
  },
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 42,
    backgroundColor: "rgba(30, 12, 23, 0.18)"
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(30, 12, 23, 0.22)"
  },
  vignetteLeft: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 26,
    backgroundColor: "rgba(30, 12, 23, 0.16)"
  },
  vignetteRight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: 26,
    backgroundColor: "rgba(30, 12, 23, 0.16)"
  },
  tapTarget: {
    position: "absolute",
    width: 48,
    height: 22,
    marginLeft: -24,
    marginTop: -11,
    alignItems: "center",
    justifyContent: "center"
  },
  tapTargetRingOuter: {
    position: "absolute",
    width: 48,
    height: 22,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255, 79, 152, 0.55)",
    backgroundColor: "rgba(255, 79, 152, 0.12)"
  },
  tapTargetRingInner: {
    width: 14,
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 79, 152, 0.85)"
  }
})
