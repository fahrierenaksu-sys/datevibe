import { useEffect, useRef } from "react"
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native"
import type { InteractionState, RoomHotspot } from "./miniRoomSceneTypes"

interface HotspotLayerProps {
  hotspots: RoomHotspot[]
  interaction: InteractionState
  stageWidth: number
  stageHeight: number
  onSelect: (hotspotId: string) => void
  disabled: boolean
}

export function HotspotLayer(props: HotspotLayerProps) {
  const { hotspots, interaction, onSelect, disabled, stageWidth, stageHeight } = props
  if (stageWidth <= 0 || stageHeight <= 0) return null
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {hotspots.map((hotspot) => {
        const padW = (hotspot.padWidth ?? 0.18) * stageWidth
        const padH = (hotspot.padHeight ?? 0.08) * stageHeight
        const left = hotspot.x * stageWidth - padW / 2
        const top = hotspot.y * stageHeight - padH / 2
        return (
          <HotspotPad
            key={hotspot.id}
            hotspot={hotspot}
            selected={interaction.selectedHotspotId === hotspot.id}
            onSelect={onSelect}
            disabled={disabled}
            left={left}
            top={top}
            width={padW}
            height={padH}
          />
        )
      })}
    </View>
  )
}

interface HotspotPadProps {
  hotspot: RoomHotspot
  selected: boolean
  onSelect: (hotspotId: string) => void
  disabled: boolean
  left: number
  top: number
  width: number
  height: number
}

function HotspotPad(props: HotspotPadProps) {
  const { hotspot, selected, onSelect, disabled, left, top, width, height } = props
  const shimmerRef = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerRef, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(shimmerRef, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [shimmerRef])

  const haloScale = shimmerRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08]
  })
  const haloOpacity = shimmerRef.interpolate({
    inputRange: [0, 1],
    outputRange: disabled ? [0.08, 0.12] : [0.16, 0.34]
  })
  const ringOpacity = selected ? 1 : haloOpacity

  const kindIcon =
    hotspot.kind === "seat"
      ? "○"
      : hotspot.kind === "activity"
      ? "✦"
      : hotspot.kind === "decor"
      ? "◇"
      : "♡"

  return (
    <Pressable
      onPress={() => onSelect(hotspot.id)}
      disabled={disabled}
      hitSlop={6}
      style={[
        styles.padAnchor,
        {
          left,
          top,
          width,
          height
        }
      ]}
    >
      <Animated.View
        style={[
          styles.padHalo,
          selected ? styles.padHaloSelected : null,
          {
            opacity: ringOpacity,
            transform: [{ scale: haloScale }]
          }
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.padRing,
          hotspot.kind === "seat" ? styles.padRingSeat : null,
          hotspot.kind === "activity" ? styles.padRingActivity : null,
          hotspot.kind === "stand" ? styles.padRingStand : null,
          selected ? styles.padRingSelected : null
        ]}
        pointerEvents="none"
      />
      {hotspot.label ? (
        <View
          style={[
            styles.labelChip,
            selected ? styles.labelChipSelected : null
          ]}
          pointerEvents="none"
        >
          <Text style={styles.labelIcon}>{kindIcon}</Text>
          <Text style={styles.labelText} numberOfLines={1}>
            {hotspot.label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  padAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  padHalo: {
    position: "absolute",
    left: -6,
    right: -6,
    top: -8,
    bottom: -8,
    borderRadius: 999,
    backgroundColor: "rgba(255, 138, 184, 0.16)"
  },
  padHaloSelected: {
    backgroundColor: "rgba(255, 90, 152, 0.32)"
  },
  padRing: {
    position: "absolute",
    left: 2,
    right: 2,
    top: 4,
    bottom: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.68)",
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  padRingSeat: {
    borderColor: "rgba(255, 235, 244, 0.78)",
    backgroundColor: "rgba(255, 235, 244, 0.12)"
  },
  padRingActivity: {
    borderColor: "rgba(242, 214, 255, 0.74)",
    backgroundColor: "rgba(242, 214, 255, 0.13)"
  },
  padRingStand: {
    borderColor: "rgba(255, 183, 213, 0.78)",
    backgroundColor: "rgba(255, 138, 184, 0.16)"
  },
  padRingSelected: {
    borderColor: "#FFFFFF",
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 79, 152, 0.28)"
  },
  labelChip: {
    position: "absolute",
    top: -18,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(34, 16, 26, 0.48)",
    borderWidth: 1,
    borderColor: "rgba(255, 201, 224, 0.42)"
  },
  labelChipSelected: {
    backgroundColor: "rgba(255, 79, 152, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.9)"
  },
  labelIcon: {
    fontSize: 9
  },
  labelText: {
    color: "#FFE9F3",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2
  }
})
