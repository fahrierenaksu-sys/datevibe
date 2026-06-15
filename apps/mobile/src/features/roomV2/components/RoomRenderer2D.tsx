import {
  Animated,
  Easing,
  type GestureResponderEvent,
  Image,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle
} from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { RoomAvatarRenderer2D } from "../../avatarV2/room/components/RoomAvatarRenderer2D"
import type { RoomWorldPoint } from "../../roomWorld/roomWorldGeometry"
import type {
  RoomShell,
  RoomPlacementLane,
  RoomV2FurnitureRenderItem,
  RoomV2RenderItem
} from "../roomV2.types"
import { getRenderableRoomV2AvatarMotionProfile } from "../roomV2AvatarMotion"

type RoomRendererPlacementState = "valid" | "invalid"
type RoomRendererStageMarkerTone = "target" | "blocked"

export interface RoomRendererStageMarker extends RoomWorldPoint {
  id: string
  tone?: RoomRendererStageMarkerTone
}

interface RoomRenderer2DProps {
  shell: RoomShell | null
  renderItems: RoomV2RenderItem[]
  stageMarkers?: RoomRendererStageMarker[]
  debugPlacement?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  selectedInstanceId?: string
  placementStateByRenderId?: Record<string, RoomRendererPlacementState>
  showPlacementGuides?: boolean
  onItemTap?: (item: RoomV2RenderItem) => void
  onStagePress?: (point: RoomWorldPoint) => void
}

export function RoomRenderer2D(props: RoomRenderer2DProps) {
  const {
    shell,
    renderItems,
    stageMarkers,
    debugPlacement = false,
    style,
    testID,
    selectedInstanceId,
    placementStateByRenderId,
    showPlacementGuides,
    onItemTap,
    onStagePress
  } = props
  const [layoutSize, setLayoutSize] = useState({ width: 0, height: 0 })

  if (!shell) {
    return <View testID={testID} style={style} />
  }

  const aspectRatio = shell.canvasSize.width / shell.canvasSize.height
  const Root = onStagePress ? Pressable : View
  const handleLayout = useCallback((event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout
    setLayoutSize({ width, height })
  }, [])
  const handleStagePress = useCallback((event: GestureResponderEvent): void => {
    if (!onStagePress || layoutSize.width <= 0 || layoutSize.height <= 0) return
    const { locationX, locationY } = event.nativeEvent
    onStagePress({
      x: Math.max(0, Math.min(1, locationX / layoutSize.width)),
      y: Math.max(0, Math.min(1, locationY / layoutSize.height))
    })
  }, [layoutSize.height, layoutSize.width, onStagePress])

  return (
    <Root
      testID={testID}
      onLayout={handleLayout}
      onPress={handleStagePress}
      style={[
        styles.root,
        {
          aspectRatio
        },
        style
      ]}
    >
      <Image
        testID={testID ? `${testID}-shell` : undefined}
        source={shell.asset.source}
        resizeMode="cover"
        style={styles.shell}
      />
      <View pointerEvents="none" style={styles.floorDepthWash} />
      {showPlacementGuides ? (
        <PlacementGuideLayer shell={shell} />
      ) : null}
      {stageMarkers?.map((marker) => (
        <StageMarker key={marker.id} marker={marker} />
      ))}
      {renderItems.map((item) => (
        item.kind === "furniture" || item.kind === "avatar" ? (
          <RoomRendererItem
            key={item.renderId}
            item={item}
            isSelected={selectedInstanceId === item.renderId}
            placementState={placementStateByRenderId?.[item.renderId]}
            onTap={onItemTap ? () => onItemTap(item) : undefined}
            debugPlacement={debugPlacement}
            testID={testID ? `${testID}-item-${item.renderId}` : undefined}
          />
        ) : null
      ))}
    </Root>
  )
}

function StageMarker(props: { marker: RoomRendererStageMarker }) {
  const { marker } = props
  const pulseRef = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRef, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulseRef, {
          toValue: 0,
          duration: 620,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => {
      loop.stop()
      pulseRef.setValue(0)
    }
  }, [pulseRef])

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.stageMarker,
        marker.tone === "blocked" ? styles.stageMarkerBlocked : null,
        {
          left: `${marker.x * 100}%`,
          top: `${marker.y * 100}%`,
          opacity: pulseRef.interpolate({
            inputRange: [0, 1],
            outputRange: [0.82, 1]
          }),
          transform: [
            {
              scale: pulseRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1.08]
              })
            }
          ]
        }
      ]}
    >
      <View
        style={[
          styles.stageMarkerCore,
          marker.tone === "blocked" ? styles.stageMarkerCoreBlocked : null
        ]}
      />
    </Animated.View>
  )
}

function PlacementGuideLayer(props: { shell: RoomShell }) {
  const { shell } = props
  if (!shell.placementLanes?.length || !shell.placeableArea) return null
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {shell.placementLanes.map((lane) => (
        <View
          key={lane.id}
          style={[
            styles.placementGuide,
            getPlacementGuideStyle(lane, shell)
          ]}
        />
      ))}
    </View>
  )
}

function RoomRendererItem(props: {
  item: RoomV2RenderItem
  isSelected?: boolean
  placementState?: RoomRendererPlacementState
  onTap?: () => void
  debugPlacement: boolean
  testID?: string
}) {
  const { item, isSelected, placementState, onTap, debugPlacement, testID } = props
  const breatheRef = useRef(new Animated.Value(0)).current
  const walkRef = useRef(new Animated.Value(0)).current
  const gestureRef = useRef(new Animated.Value(0)).current

  const perspectiveScale = getRoomRendererItemPerspectiveScale(item)
  const renderedWidth = item.width * perspectiveScale
  const renderedHeight = item.height * perspectiveScale
  const left = item.x - renderedWidth * item.anchor.x
  const top = item.y - renderedHeight * item.anchor.y
  const shouldShowFootprint =
    item.kind === "furniture" &&
    (isSelected || Boolean(placementState))
  const footprintStyle = shouldShowFootprint && item.kind === "furniture"
    ? getFurnitureFootprintStyle(item)
    : undefined
  const avatarMotion = item.kind === "avatar"
    ? getRenderableRoomV2AvatarMotionProfile(item)
    : {
      state: "idle" as const,
      treatment: "idleFallback" as const,
      usesRuntimeLocomotion: false,
      usesRuntimeGesture: false,
      usesAnimatedAssets: false
    }

  useEffect(() => {
    if (item.kind !== "avatar") return undefined
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheRef, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(breatheRef, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [breatheRef, item.kind])

  useEffect(() => {
    if (
      item.kind !== "avatar" ||
      avatarMotion.state !== "walking" ||
      !avatarMotion.usesRuntimeLocomotion
    ) {
      walkRef.setValue(0)
      return undefined
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(walkRef, {
          toValue: 1,
          duration: 190,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(walkRef, {
          toValue: 0,
          duration: 190,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => {
      loop.stop()
      walkRef.setValue(0)
    }
  }, [avatarMotion.state, avatarMotion.usesRuntimeLocomotion, item.kind, walkRef])

  useEffect(() => {
    if (
      item.kind !== "avatar" ||
      !avatarMotion.usesRuntimeGesture
    ) {
      gestureRef.setValue(0)
      return undefined
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(gestureRef, {
          toValue: 1,
          duration: avatarMotion.state === "dancing" ? 260 : 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(gestureRef, {
          toValue: 0,
          duration: avatarMotion.state === "dancing" ? 260 : 420,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => {
      loop.stop()
      gestureRef.setValue(0)
    }
  }, [avatarMotion.state, avatarMotion.usesRuntimeGesture, gestureRef, item.kind])

  // If onTap is provided, we need to allow touches. Otherwise pass through.
  const pointerEvents = onTap ? "auto" : "none"

  const Wrapper = onTap ? Pressable : View

  return (
    <Wrapper
      onPress={(event) => {
        event.stopPropagation()
        onTap?.()
      }}
      testID={testID}
      pointerEvents={pointerEvents}
      style={[
        styles.item,
        {
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          width: `${renderedWidth * 100}%`,
          height: `${renderedHeight * 100}%`
        }
      ]}
    >
      <View
        style={[
          styles.itemContent,
          isSelected ? styles.itemSelected : null,
          placementState === "valid" ? styles.itemPlacementValid : null,
          placementState === "invalid" ? styles.itemPlacementInvalid : null
        ]}
      >
        {item.kind === "avatar" ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.avatarGroundShadow,
              {
                opacity: getAvatarGroundShadowOpacity(avatarMotion),
                transform: [
                  { rotate: "-3deg" },
                  { scaleX: getAvatarGroundShadowScaleX(avatarMotion, walkRef) }
                ]
              }
            ]}
          />
        ) : shouldShowFurnitureGroundShadow(item) ? (
          <View
            pointerEvents="none"
            style={[
              styles.furnitureGroundShadow,
              getFurnitureGroundShadowStyle(item)
            ]}
          />
        ) : null}
        {isSelected || placementState ? (
          <View
            pointerEvents="none"
            style={[
              styles.interactionAura,
              isSelected ? styles.interactionAuraSelected : null,
              placementState === "valid" ? styles.interactionAuraValid : null,
              placementState === "invalid" ? styles.interactionAuraInvalid : null
            ]}
          />
        ) : null}
        {footprintStyle ? (
          <View
            pointerEvents="none"
            style={[
              styles.footprintPad,
              placementState === "valid" ? styles.footprintPadValid : null,
              placementState === "invalid" ? styles.footprintPadInvalid : null,
              footprintStyle
            ]}
          />
        ) : null}
        {item.kind === "avatar" ? (
          <Animated.View
            style={[
              styles.avatarImage,
              {
                opacity: item.direction === "back" ? 0.84 : 1,
                transform: [
                  { translateX: getAvatarMotionTranslateX(avatarMotion, gestureRef) },
                  { translateY: getAvatarMotionTranslateY(avatarMotion, breatheRef, walkRef, gestureRef) },
                  { scaleX: item.direction === "left" ? -1 : 1 },
                  { scaleY: getAvatarMotionScaleY(avatarMotion, breatheRef, gestureRef) },
                  { scale: item.direction === "back" ? 0.96 : 1 },
                  { rotate: getAvatarMotionRotate(avatarMotion, gestureRef) }
                ]
              }
            ]}
          >
            <RoomAvatarRenderer2D layers={item.layers} />
          </Animated.View>
        ) : (
          <Image
            source={item.asset.source}
            resizeMode="contain"
            style={[
              styles.itemImage,
              { transform: [{ scaleX: item.rotation === 'left' || item.rotation === 'back' ? -1 : 1 }] }
            ]}
          />
        )}
        {debugPlacement ? (
          <>
            <View
              testID={testID ? `${testID}-debug-bounds` : undefined}
              style={styles.debugBounds}
            />
            <View
              testID={testID ? `${testID}-debug-anchor` : undefined}
              style={[
                styles.debugAnchor,
                {
                  left: `${item.anchor.x * 100}%`,
                  top: `${item.anchor.y * 100}%`
                }
              ]}
            />
            <Text
              testID={testID ? `${testID}-debug-label` : undefined}
              numberOfLines={1}
              style={styles.debugLabel}
            >
              {item.name || item.renderId}
            </Text>
          </>
        ) : null}
      </View>
    </Wrapper>
  )
}

function getAvatarMotionTranslateY(
  motion: ReturnType<typeof getRenderableRoomV2AvatarMotionProfile>,
  breatheRef: Animated.Value,
  walkRef: Animated.Value,
  gestureRef: Animated.Value
): Animated.AnimatedInterpolation<string | number> | number {
  if (motion.state === "walking" && motion.usesRuntimeLocomotion) {
    return walkRef.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -3]
    })
  }
  if (motion.state === "sitting") return 14
  if (motion.state === "dancing" && motion.usesRuntimeGesture) {
    return gestureRef.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5]
    })
  }
  if (motion.state === "waving" && motion.usesRuntimeGesture) {
    return gestureRef.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -2]
    })
  }
  if (motion.usesAnimatedAssets) return 0
  return breatheRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5]
  })
}

function getAvatarMotionScaleY(
  motion: ReturnType<typeof getRenderableRoomV2AvatarMotionProfile>,
  breatheRef: Animated.Value,
  gestureRef: Animated.Value
): Animated.AnimatedInterpolation<string | number> | number {
  if (motion.state === "sitting") return 0.82
  if (motion.usesAnimatedAssets) return 1
  if (motion.state === "dancing" && motion.usesRuntimeGesture) {
    return gestureRef.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.045]
    })
  }
  return breatheRef.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.018]
  })
}

function getAvatarMotionRotate(
  motion: ReturnType<typeof getRenderableRoomV2AvatarMotionProfile>,
  gestureRef: Animated.Value
): Animated.AnimatedInterpolation<string | number> | string {
  if (motion.usesAnimatedAssets) return "0deg"
  if (motion.state === "dancing" && motion.usesRuntimeGesture) {
    return gestureRef.interpolate({
      inputRange: [0, 1],
      outputRange: ["-4deg", "4deg"]
    })
  }
  if (motion.state === "waving" && motion.usesRuntimeGesture) {
    return gestureRef.interpolate({
      inputRange: [0, 1],
      outputRange: ["-1deg", "3deg"]
    })
  }
  return "0deg"
}

function getAvatarMotionTranslateX(
  motion: ReturnType<typeof getRenderableRoomV2AvatarMotionProfile>,
  gestureRef: Animated.Value
): Animated.AnimatedInterpolation<string | number> | number {
  if (motion.state === "dancing" && motion.usesRuntimeGesture) {
    return gestureRef.interpolate({
      inputRange: [0, 1],
      outputRange: [-2.5, 2.5]
    })
  }
  return 0
}

function getAvatarGroundShadowOpacity(
  motion: ReturnType<typeof getRenderableRoomV2AvatarMotionProfile>
): Animated.AnimatedInterpolation<string | number> | number {
  if (motion.state === "walking" && motion.usesRuntimeLocomotion) return 0.3
  if (motion.state === "sitting") return 0.42
  return 0.34
}

function getAvatarGroundShadowScaleX(
  motion: ReturnType<typeof getRenderableRoomV2AvatarMotionProfile>,
  walkRef: Animated.Value
): Animated.AnimatedInterpolation<string | number> | number {
  if (motion.state === "walking" && motion.usesRuntimeLocomotion) {
    return walkRef.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1.06]
    })
  }
  if (motion.state === "sitting") return 1.18
  return 1
}

function getFurnitureFootprintStyle(
  item: RoomV2FurnitureRenderItem
): ViewStyle {
  const footprint = item.footprint ?? {
    width: item.width,
    height: item.height
  }
  const widthRatio = item.width > 0 ? footprint.width / item.width : 1
  const heightRatio = item.height > 0 ? footprint.height / item.height : 1
  const widthPercent = Math.max(8, Math.min(180, widthRatio * 100))
  const heightPercent = Math.max(6, Math.min(120, heightRatio * 100))
  const leftPercent = item.anchor.x * (100 - widthPercent)
  const topPercent = item.anchor.y * (100 - heightPercent)

  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
    width: `${widthPercent}%`,
    height: `${heightPercent}%`
  }
}

function getRoomRendererItemPerspectiveScale(item: RoomV2RenderItem): number {
  if (item.kind !== "avatar") return 1
  const normalizedDepth = Math.max(0, Math.min(1, (item.y - 0.46) / 0.42))
  return 0.88 + normalizedDepth * 0.22
}

function shouldShowFurnitureGroundShadow(item: RoomV2FurnitureRenderItem): boolean {
  return item.layer !== "wall" && item.category !== "wallDecor"
}

function getFurnitureGroundShadowStyle(
  item: RoomV2FurnitureRenderItem
): ViewStyle {
  const footprint = item.footprint ?? {
    width: item.width * 0.76,
    height: item.height * 0.22
  }
  const widthRatio = item.width > 0 ? footprint.width / item.width : 0.7
  const heightRatio = item.height > 0 ? footprint.height / item.height : 0.18
  const widthPercent = Math.max(36, Math.min(125, widthRatio * 100))
  const heightPercent = Math.max(8, Math.min(30, heightRatio * 100))

  return {
    left: `${item.anchor.x * 100 - widthPercent / 2}%`,
    bottom: `${Math.max(0, (1 - item.anchor.y) * 100 - heightPercent * 0.22)}%`,
    width: `${widthPercent}%`,
    height: `${heightPercent}%`
  }
}

function getPlacementGuideStyle(
  lane: RoomPlacementLane,
  shell: RoomShell
): ViewStyle {
  const { minX, maxX } = getPlacementGuideSpan(lane, shell)
  return {
    left: `${minX * 100}%`,
    top: `${lane.y * 100}%`,
    width: `${Math.max(0, maxX - minX) * 100}%`
  }
}

function getPlacementGuideSpan(
  lane: RoomPlacementLane,
  shell: RoomShell
): { minX: number; maxX: number } {
  const fallbackMinX = lane.minX ?? shell.placeableArea?.minX ?? 0
  const fallbackMaxX = lane.maxX ?? shell.placeableArea?.maxX ?? 1
  const polygonSpan = getPolygonHorizontalSpanAtY(shell.walkablePolygon, lane.y)
  if (!polygonSpan) {
    return {
      minX: fallbackMinX,
      maxX: fallbackMaxX
    }
  }

  return {
    minX: Math.max(fallbackMinX, polygonSpan.minX),
    maxX: Math.min(fallbackMaxX, polygonSpan.maxX)
  }
}

function getPolygonHorizontalSpanAtY(
  polygon: RoomShell["walkablePolygon"],
  y: number
): { minX: number; maxX: number } | null {
  if (!polygon || polygon.length < 3) return null
  const intersections: number[] = []
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]
    const end = polygon[(index + 1) % polygon.length]
    const crosses =
      (start.y <= y && end.y > y) ||
      (end.y <= y && start.y > y)
    if (!crosses) continue
    const dy = end.y - start.y
    if (Math.abs(dy) <= 0.0001) continue
    const t = (y - start.y) / dy
    intersections.push(start.x + (end.x - start.x) * t)
  }
  if (intersections.length < 2) return null
  intersections.sort((a, b) => a - b)
  return {
    minX: intersections[0],
    maxX: intersections[intersections.length - 1]
  }
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#110A12"
  },
  shell: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  floorDepthWash: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "58%",
    backgroundColor: "rgba(255, 216, 196, 0.1)"
  },
  placementGuide: {
    position: "absolute",
    height: 8,
    marginTop: -4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "rgba(255, 234, 244, 0.08)",
    shadowColor: "#FF8FBD",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }
  },
  stageMarker: {
    position: "absolute",
    width: 34,
    height: 18,
    marginLeft: -17,
    marginTop: -9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(143, 255, 209, 0.55)",
    backgroundColor: "rgba(143, 255, 209, 0.16)",
    shadowColor: "#8FFFD1",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 3
  },
  stageMarkerBlocked: {
    borderColor: "rgba(255, 180, 200, 0.58)",
    backgroundColor: "rgba(255, 180, 200, 0.15)",
    shadowColor: "#FFB4C8"
  },
  stageMarkerCore: {
    width: 12,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(143, 255, 209, 0.88)"
  },
  stageMarkerCoreBlocked: {
    backgroundColor: "rgba(255, 180, 200, 0.9)"
  },
  item: {
    position: "absolute"
  },
  itemContent: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    borderRadius: 8,
    position: "relative"
  },
  itemSelected: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 12,
    elevation: 8,
    opacity: 0.85
  },
  itemPlacementValid: {
    opacity: 0.9,
    shadowColor: "#6FFFC1",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 16,
    elevation: 10
  },
  itemPlacementInvalid: {
    opacity: 0.64,
    shadowColor: "#FF5F7A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10
  },
  itemImage: {
    width: "100%",
    height: "100%",
    zIndex: 2
  },
  furnitureGroundShadow: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(54, 25, 36, 0.28)",
    shadowColor: "#5D2339",
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ rotate: "-3deg" }],
    zIndex: 1
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    zIndex: 2
  },
  avatarGroundShadow: {
    position: "absolute",
    left: "10%",
    right: "10%",
    bottom: "2%",
    height: "9%",
    borderRadius: 999,
    backgroundColor: "rgba(38, 17, 42, 0.62)",
    shadowColor: "#5D2339",
    shadowOpacity: 0.26,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    transform: [{ rotate: "-3deg" }],
    zIndex: 1
  },
  interactionAura: {
    position: "absolute",
    left: "10%",
    right: "10%",
    bottom: "4%",
    height: "10%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    backgroundColor: "rgba(255, 234, 244, 0.12)",
    shadowColor: "#FF7AB8",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }
  },
  interactionAuraSelected: {
    borderColor: "rgba(255, 255, 255, 0.58)",
    backgroundColor: "rgba(255, 111, 174, 0.18)",
    shadowOpacity: 0.34,
    shadowRadius: 14
  },
  interactionAuraValid: {
    borderColor: "rgba(111, 255, 193, 0.78)",
    backgroundColor: "rgba(111, 255, 193, 0.2)",
    shadowColor: "#6FFFC1",
    shadowOpacity: 0.38,
    shadowRadius: 16
  },
  interactionAuraInvalid: {
    borderColor: "rgba(255, 95, 122, 0.9)",
    backgroundColor: "rgba(255, 95, 122, 0.2)",
    shadowColor: "#FF5F7A",
    shadowOpacity: 0.42,
    shadowRadius: 16
  },
  footprintPad: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.26)",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    zIndex: 1
  },
  footprintPadValid: {
    borderColor: "rgba(111, 255, 193, 0.86)",
    backgroundColor: "rgba(111, 255, 193, 0.18)",
    shadowColor: "#6FFFC1",
    shadowOpacity: 0.32
  },
  footprintPadInvalid: {
    borderColor: "rgba(255, 95, 122, 0.92)",
    backgroundColor: "rgba(255, 95, 122, 0.22)",
    shadowColor: "#FF5F7A",
    shadowOpacity: 0.38
  },
  debugBounds: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "#00E5FF",
    backgroundColor: "rgba(0, 229, 255, 0.08)"
  },
  debugAnchor: {
    position: "absolute",
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    borderRadius: 4,
    backgroundColor: "#FFEF5A",
    borderWidth: 1,
    borderColor: "#110A12"
  },
  debugLabel: {
    position: "absolute",
    left: 0,
    top: -16,
    width: 76,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(17, 10, 18, 0.82)",
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "800"
  }
})
