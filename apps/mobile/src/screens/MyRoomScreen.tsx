import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native"
import { uiTheme } from "../ui/theme"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAvatarV2 } from "../features/avatarV2/state/AvatarV2Provider"
import { ROOM_AVATAR_CATALOG } from "../features/avatarV2/room/avatarRoom.mock"
import { projectAvatarV2ToRoomAvatarAppearance } from "../features/avatarV2/room/avatarRoomProjection"
import {
  createRoomAvatarRenderItem,
  getRoomAvatarAssetCoverage,
  getRoomAvatarMotionReadinessSummary
} from "../features/avatarV2/room/avatarRoomSelectors"
import type { RoomAvatarMotionReadinessLevel } from "../features/avatarV2/room/avatarRoom.types"
import {
  RoomRenderer2D,
  type RoomRendererStageMarker
} from "../features/roomV2/components/RoomRenderer2D"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import {
  compareRoomV2RenderItems,
  resolveRoomV2Scene
} from "../features/roomV2/roomV2Selectors"
import { useRoomV2 } from "../features/roomV2/state/RoomV2Provider"
import {
  isRoomWorldPointWalkable,
  omitRoomWorldBlockers,
  type RoomWorldGeometry,
  type RoomWorldPoint
} from "../features/roomWorld/roomWorldGeometry"
import {
  createRoomWorldGeometryFromRoomV2Scene,
  createRoomWorldHotspotsFromRoomV2Scene
} from "../features/roomWorld/roomWorldRoomV2Projection"
import {
  createRoomWorldMovementPlan,
  getRoomWorldMovementFrame,
  getRoomWorldMovementFramePose,
  getRoomWorldMovementSegmentStartPose,
  ROOM_WORLD_AVATAR_COLLISION_CLEARANCE,
  ROOM_WORLD_MY_ROOM_MOVEMENT_TIMING,
  resolveRoomWorldInteractiveTarget
} from "../features/roomWorld/roomWorldRuntime"
import type {
  FurnitureItem,
  PlacedRoomItem,
  RoomFurnitureRotation,
  RoomV2AvatarMotionState,
  RoomV2RenderItem
} from "../features/roomV2/roomV2.types"
import { useInventoryStore } from "../features/inventory/inventoryStore"
import type { SessionActor } from "../features/session/sessionApi"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { hapticError, hapticLight } from "../ui/haptics"

type MyRoomNavProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>
  route: { key: string; name: string }
}

type MyRoomScreenProps = MyRoomNavProps & {
  sessionActor: SessionActor
}

const MY_ROOM_STAGE_CAMERA = {
  compactRendererWidth: "165%",
  regularRendererWidth: "154%",
  rendererTranslateY: 0,
  compactStageHeightRatio: 0.48,
  wideStageHeightRatio: 0.64,
  compactMinStageHeight: 372,
  wideMinStageHeight: 440,
  compactMaxStageHeight: 500,
  wideMaxStageHeight: 560
} as const
const MY_ROOM_AVATAR_SPAWN = {
  x: 0.47,
  y: 0.84,
  direction: "front" as RoomFurnitureRotation
} as const
const MY_ROOM_WALK_ACTION_TARGETS: RoomWorldPoint[] = [
  { x: 0.28, y: 0.86 },
  { x: 0.72, y: 0.86 },
  { x: 0.3, y: 0.7 },
  { x: 0.7, y: 0.7 },
  { x: 0.5, y: 0.88 },
  { x: 0.5, y: 0.64 }
]
const MY_ROOM_AVATAR_SIZE = {
  compact: {
    width: 0.19,
    height: 0.5
  },
  wide: {
    width: 0.164,
    height: 0.436
  }
} as const
const MY_ROOM_WIDE_STAGE_BREAKPOINT = 720
const MY_ROOM_WIDE_STAGE_AVATAR_FEET_Y = 0.82
const MY_ROOM_TRANSIENT_POSE_DURATION_MS = 1800
const MY_ROOM_MOVEMENT_FEEDBACK_DURATION_MS = 1700
const MY_ROOM_MOVEMENT_NO_OP_DISTANCE = 0.012

interface MyRoomAvatarPose extends RoomWorldPoint {
  direction: RoomFurnitureRotation
  state: RoomV2AvatarMotionState
}

type MyRoomPoseActionState = Extract<
  RoomV2AvatarMotionState,
  "idle" | "waving" | "dancing"
>

export function MyRoomScreen({ navigation, sessionActor }: MyRoomScreenProps) {
  const { userRoomDecor } = useRoomV2()
  const { avatar, catalog } = useAvatarV2()
  const windowSize = useWindowDimensions()
  const [avatarPose, setAvatarPose] = useState<MyRoomAvatarPose>({
    ...MY_ROOM_AVATAR_SPAWN,
    state: "idle"
  })
  const avatarPoseRef = useRef(avatarPose)
  const animationFrameRef = useRef<number | null>(null)
  const transientPoseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const movementFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [movementFeedback, setMovementFeedback] = useState<string | undefined>()
  const [stageMarker, setStageMarker] = useState<RoomRendererStageMarker | undefined>()
  const [stageWidth, setStageWidth] = useState(0)

  const roomScene = useMemo(
    () =>
      resolveRoomV2Scene({
        roomShellCatalog: ROOM_V2_SHELL_CATALOG,
        furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
        decor: userRoomDecor,
        defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
      }),
    [userRoomDecor]
  )
  const roomWorldGeometry = useMemo(
    () => createRoomWorldGeometryFromRoomV2Scene(roomScene),
    [roomScene]
  )
  const roomWorldHotspots = useMemo(
    () => createRoomWorldHotspotsFromRoomV2Scene(roomScene),
    [roomScene]
  )
  const shellCamera = {
    ...(roomScene.shell?.myRoomCamera ?? MY_ROOM_STAGE_CAMERA),
    compactRendererWidth: MY_ROOM_STAGE_CAMERA.compactRendererWidth,
    regularRendererWidth: MY_ROOM_STAGE_CAMERA.regularRendererWidth,
    rendererTranslateY: MY_ROOM_STAGE_CAMERA.rendererTranslateY,
    compactStageHeightRatio: MY_ROOM_STAGE_CAMERA.compactStageHeightRatio,
    wideStageHeightRatio: MY_ROOM_STAGE_CAMERA.wideStageHeightRatio,
    compactMinStageHeight: MY_ROOM_STAGE_CAMERA.compactMinStageHeight,
    wideMinStageHeight: MY_ROOM_STAGE_CAMERA.wideMinStageHeight,
    compactMaxStageHeight: MY_ROOM_STAGE_CAMERA.compactMaxStageHeight,
    wideMaxStageHeight: MY_ROOM_STAGE_CAMERA.wideMaxStageHeight
  }
  const usesWideWindow = windowSize.width >= MY_ROOM_WIDE_STAGE_BREAKPOINT
  const stageHeightRatio = usesWideWindow
    ? shellCamera.wideStageHeightRatio
    : shellCamera.compactStageHeightRatio
  const minStageHeight = usesWideWindow
    ? shellCamera.wideMinStageHeight
    : shellCamera.compactMinStageHeight
  const maxStageHeight = usesWideWindow
    ? shellCamera.wideMaxStageHeight
    : shellCamera.compactMaxStageHeight
  const stageHeight = Math.max(
    minStageHeight,
    Math.min(
      maxStageHeight,
      Math.round(windowSize.height * stageHeightRatio)
    )
  )
  const usesWideStageCamera = stageWidth >= MY_ROOM_WIDE_STAGE_BREAKPOINT
  const stageRendererWidth = usesWideStageCamera
    ? "100%"
    : windowSize.width < 390
      ? shellCamera.compactRendererWidth
      : shellCamera.regularRendererWidth
  const stageRendererTranslateY = usesWideStageCamera && roomScene.shell
    ? getWideStageRendererTranslateY({
        stageWidth,
        stageHeight,
        shellCanvasWidth: roomScene.shell.canvasSize.width,
        shellCanvasHeight: roomScene.shell.canvasSize.height,
        avatarWorldY: avatarPose.y
      })
    : shellCamera.rendererTranslateY

  const projectedRoomAvatar = useMemo(
    () =>
      projectAvatarV2ToRoomAvatarAppearance({
        avatar,
        avatarCatalog: catalog,
        roomAvatarCatalog: ROOM_AVATAR_CATALOG
      }).appearance,
    [avatar, catalog]
  )
  const roomMotionReadiness = useMemo(
    () => getRoomAvatarMotionReadinessSummary({
      appearance: projectedRoomAvatar,
      catalog: ROOM_AVATAR_CATALOG
    }),
    [projectedRoomAvatar]
  )
  const roomMotionBadge = getMyRoomMotionBadge(roomMotionReadiness.level)

  const roomAvatar = useMemo(() => {
    const avatarSize = usesWideStageCamera
      ? MY_ROOM_AVATAR_SIZE.wide
      : MY_ROOM_AVATAR_SIZE.compact
    return createRoomAvatarRenderItem({
      avatarId: "my-room-owner",
      name: sessionActor.profile.displayName,
      appearance: projectedRoomAvatar,
      x: avatarPose.x,
      y: avatarPose.y,
      width: avatarSize.width,
      height: avatarSize.height,
      renderId: "my_room_owner_avatar",
      direction: avatarPose.direction,
      state: avatarPose.state,
      depth: avatarPose.y
    })
  }, [
    avatarPose.direction,
    avatarPose.state,
    avatarPose.x,
    avatarPose.y,
    projectedRoomAvatar,
    sessionActor.profile.displayName,
    usesWideStageCamera
  ])

  const renderItems = useMemo(
    () => [...roomScene.renderItems, roomAvatar].sort(compareRoomV2RenderItems),
    [roomAvatar, roomScene.renderItems]
  )

  useEffect(() => {
    avatarPoseRef.current = avatarPose
  }, [avatarPose])

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (transientPoseTimerRef.current !== null) {
      clearTimeout(transientPoseTimerRef.current)
    }
    if (movementFeedbackTimerRef.current !== null) {
      clearTimeout(movementFeedbackTimerRef.current)
    }
  }, [])

  const showMovementFeedback = useCallback((message: string): void => {
    if (movementFeedbackTimerRef.current !== null) {
      clearTimeout(movementFeedbackTimerRef.current)
    }
    setMovementFeedback(message)
    movementFeedbackTimerRef.current = setTimeout(() => {
      setMovementFeedback(undefined)
      movementFeedbackTimerRef.current = null
    }, MY_ROOM_MOVEMENT_FEEDBACK_DURATION_MS)
  }, [])

  useEffect(() => {
    const clearance = { clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE }
    if (isRoomWorldPointWalkable(roomWorldGeometry, avatarPoseRef.current, clearance)) return
    if (!isRoomWorldPointWalkable(roomWorldGeometry, MY_ROOM_AVATAR_SPAWN, clearance)) return
    const nextPose = {
      ...MY_ROOM_AVATAR_SPAWN,
      state: "idle" as const
    }
    avatarPoseRef.current = nextPose
    setAvatarPose(nextPose)
  }, [roomWorldGeometry])

  const moveAvatarToPoint = useCallback((
    target: RoomWorldPoint,
    arrival?: {
      direction?: RoomFurnitureRotation
      state?: Extract<RoomV2AvatarMotionState, "idle" | "walking" | "sitting">
      geometry?: RoomWorldGeometry
    }
  ): void => {
    if (transientPoseTimerRef.current !== null) {
      clearTimeout(transientPoseTimerRef.current)
      transientPoseTimerRef.current = null
    }
    const start = avatarPoseRef.current
    const movementGeometry = arrival?.geometry ?? roomWorldGeometry
    const resolvedTarget = resolveRoomWorldInteractiveTarget({
      geometry: movementGeometry,
      target,
      clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
    })
    if (!resolvedTarget) {
      setStageMarker(undefined)
      hapticError()
      showMovementFeedback("Path blocked")
      return
    }
    if (getMyRoomPointDistance(start, resolvedTarget) <= MY_ROOM_MOVEMENT_NO_OP_DISTANCE) {
      const restingPose: MyRoomAvatarPose = {
        x: start.x,
        y: start.y,
        direction: arrival?.direction ?? start.direction,
        state: arrival?.state ?? "idle"
      }
      avatarPoseRef.current = restingPose
      setAvatarPose(restingPose)
      setStageMarker(undefined)
      hapticLight()
      showMovementFeedback(restingPose.state === "sitting" ? "Settled in" : "Already here")
      return
    }
    const plan = createRoomWorldMovementPlan({
      geometry: movementGeometry,
      from: start,
      to: resolvedTarget,
      clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE,
      timing: ROOM_WORLD_MY_ROOM_MOVEMENT_TIMING
    })
    if (!plan) {
      setStageMarker(undefined)
      hapticError()
      showMovementFeedback("No clear route")
      return
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (movementFeedbackTimerRef.current !== null) {
      clearTimeout(movementFeedbackTimerRef.current)
      movementFeedbackTimerRef.current = null
    }
    setMovementFeedback(undefined)
    setStageMarker({
      id: `my_room_target_${Date.now()}`,
      x: resolvedTarget.x,
      y: resolvedTarget.y,
      tone: "target"
    })

    const animatePathSegment = (pathIndex: number): void => {
      const segment = plan.segments[pathIndex]
      const startedAt = Date.now()
      const segmentStartPose = getRoomWorldMovementSegmentStartPose(segment)

      const startingPose = {
        x: segmentStartPose.x,
        y: segmentStartPose.y,
        direction: segmentStartPose.facing,
        state: segmentStartPose.motion
      }
      avatarPoseRef.current = startingPose
      setAvatarPose(startingPose)

      const tick = (): void => {
        const frame = getRoomWorldMovementFrame({
          segment,
          startedAt,
          now: Date.now()
        })
        const runtimePose = getRoomWorldMovementFramePose({
          frame,
          segment,
          arrival: {
            facing: arrival?.direction,
            motion: arrival?.state
          }
        })
        const nextPose: MyRoomAvatarPose = {
          x: runtimePose.x,
          y: runtimePose.y,
          direction: runtimePose.facing,
          state: runtimePose.motion
        }
        avatarPoseRef.current = nextPose
        setAvatarPose(nextPose)

        if (!frame.isComplete) {
          animationFrameRef.current = requestAnimationFrame(tick)
          return
        }

        if (!segment.isFinal) {
          animatePathSegment(pathIndex + 1)
          return
        }

        animationFrameRef.current = null
        setStageMarker(undefined)
        hapticLight()
      }

      animationFrameRef.current = requestAnimationFrame(tick)
    }

    animatePathSegment(0)
  }, [roomWorldGeometry, showMovementFeedback])

  const handlePoseAction = useCallback((state: MyRoomPoseActionState): void => {
    if (transientPoseTimerRef.current !== null) {
      clearTimeout(transientPoseTimerRef.current)
      transientPoseTimerRef.current = null
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    const nextPose: MyRoomAvatarPose = {
      ...avatarPoseRef.current,
      direction: state === "idle" ? avatarPoseRef.current.direction : "front",
      state
    }
    avatarPoseRef.current = nextPose
    setAvatarPose(nextPose)

    if (state === "idle") return

    transientPoseTimerRef.current = setTimeout(() => {
      const restingPose: MyRoomAvatarPose = {
        ...avatarPoseRef.current,
        state: "idle"
      }
      avatarPoseRef.current = restingPose
      setAvatarPose(restingPose)
      transientPoseTimerRef.current = null
    }, MY_ROOM_TRANSIENT_POSE_DURATION_MS)
  }, [])

  const handleWalkAction = useCallback((): void => {
    const currentPose = avatarPoseRef.current
    const target = getMyRoomWalkActionTarget({
      geometry: roomWorldGeometry,
      from: currentPose
    })
    if (!target) {
      hapticError()
      showMovementFeedback("No clear route")
      return
    }
    moveAvatarToPoint(target, {
      direction: "front",
      state: "idle"
    })
  }, [moveAvatarToPoint, roomWorldGeometry, showMovementFeedback])

  const handleRoomItemTap = useCallback((item: RoomV2RenderItem): void => {
    if (item.kind !== "furniture" || item.interactionType !== "seat") return
    const seatGeometry = omitRoomWorldBlockers(roomWorldGeometry, [item.renderId])
    const seatHotspot = roomWorldHotspots.find((hotspot) =>
      hotspot.sourceRenderId === item.renderId &&
      hotspot.kind === "seat" &&
      isRoomWorldPointWalkable(seatGeometry, hotspot, {
        clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
      })
    )
    if (!seatHotspot) {
      hapticError()
      showMovementFeedback("Seat blocked")
      return
    }
    const seatDirection = seatHotspot.facing ?? item.rotation
    const sittingCoverage = getRoomAvatarAssetCoverage({
      appearance: projectedRoomAvatar,
      catalog: ROOM_AVATAR_CATALOG,
      direction: seatDirection,
      state: "sitting"
    })
    moveAvatarToPoint(seatHotspot, {
      direction: seatDirection,
      state: sittingCoverage.isProductionReady ? "sitting" : "idle",
      geometry: seatGeometry
    })
  }, [
    moveAvatarToPoint,
    projectedRoomAvatar,
    roomWorldGeometry,
    roomWorldHotspots,
    showMovementFeedback
  ])

  const handleStageLayout = useCallback((event: LayoutChangeEvent): void => {
    const nextWidth = Math.round(event.nativeEvent.layout.width)
    setStageWidth((current) => current === nextWidth ? current : nextWidth)
  }, [])

  return (
    <SafeAreaView style={styles.myRoomRoot}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.myRoomTitle}>My Room</Text>
            <Text style={styles.myRoomSubtitle}>Tap the floor to move</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile options"
            style={styles.myRoomIconButton}
            onPress={() => navigation.navigate("You")}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={uiTheme.colors.textPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.roomStack}>
          <View
            onLayout={handleStageLayout}
            style={[styles.stageCard, { height: stageHeight }]}
          >
            <View style={styles.stageBackdrop} pointerEvents="none" />
            <View style={styles.stageTopScrim} pointerEvents="none" />
            <RoomRenderer2D
              shell={roomScene.shell}
              renderItems={renderItems}
              stageMarkers={stageMarker ? [stageMarker] : undefined}
              testID="my-room-production-stage"
              onStagePress={moveAvatarToPoint}
              onItemTap={handleRoomItemTap}
              style={[
                styles.stageRenderer,
                {
                  width: stageRendererWidth,
                  transform: [{ translateY: stageRendererTranslateY }]
                }
              ]}
            />
            <View style={styles.stageHud} pointerEvents="none">
              <View style={styles.stageHudPill}>
                <Ionicons name="heart" size={13} color="#FF7AB8" />
                <Text style={styles.stageHeaderText} numberOfLines={1}>
                  Cozy room
                </Text>
              </View>
              <View style={styles.stageHudMetaGroup}>
                <View style={styles.stageMiniPill}>
                  <Ionicons name="cube" size={12} color="#FAD7E8" />
                  <Text style={styles.stageMotionText} numberOfLines={1}>
                    {userRoomDecor.placedItems.length}
                  </Text>
                </View>
                <View style={styles.stageStatusPill}>
                  <Ionicons
                    name={roomMotionBadge.icon}
                    size={13}
                    color={roomMotionBadge.color}
                  />
                  <Text style={styles.stageMotionText} numberOfLines={1}>
                    {roomMotionBadge.label}
                  </Text>
                </View>
              </View>
            </View>
            {movementFeedback ? (
              <View style={styles.movementFeedbackPill} pointerEvents="none">
                <Ionicons name="footsteps" size={14} color="#FFB4C8" />
                <Text style={styles.movementFeedbackText} numberOfLines={1}>
                  {movementFeedback}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.roomControlPanel}>
            <View style={styles.poseDock}>
              <PoseDockButton
                icon="walk"
                label="Walk"
                active={avatarPose.state === "walking"}
                onPress={handleWalkAction}
              />
              <PoseDockButton
                icon="hand-left"
                label="Wave"
                active={avatarPose.state === "waving"}
                onPress={() => handlePoseAction("waving")}
              />
              <PoseDockButton
                icon="musical-notes"
                label="Dance"
                active={avatarPose.state === "dancing"}
                onPress={() => handlePoseAction("dancing")}
              />
              <PoseDockButton
                icon="accessibility"
                label="Stand"
                active={avatarPose.state === "idle"}
                onPress={() => handlePoseAction("idle")}
              />
            </View>
            <View style={styles.stageActionDock}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open wardrobe"
                style={({ pressed }) => [
                  styles.stageActionButton,
                  styles.stageActionButtonPrimary,
                  pressed ? styles.stageActionButtonPressed : null
                ]}
                onPress={() => navigation.navigate("WardrobeV2")}
              >
                <Ionicons name="shirt" size={18} color="#FFFFFF" />
                <Text style={styles.stageActionText} numberOfLines={1}>
                  Wardrobe
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit room"
                style={({ pressed }) => [
                  styles.stageActionButton,
                  pressed ? styles.stageActionButtonPressed : null
                ]}
                onPress={() => navigation.navigate("MyRoomV2Preview")}
              >
                <Ionicons name="brush" size={18} color="#FFD9E8" />
                <Text style={styles.stageActionText} numberOfLines={1}>
                  Edit
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open room shop"
                style={({ pressed }) => [
                  styles.stageActionButton,
                  pressed ? styles.stageActionButtonPressed : null
                ]}
                onPress={() => navigation.navigate("RoomShop")}
              >
                <Ionicons name="sparkles" size={18} color="#FFD9E8" />
                <Text style={styles.stageActionText} numberOfLines={1}>
                  Shop
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function getMyRoomMotionBadge(level: RoomAvatarMotionReadinessLevel): {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
} {
  switch (level) {
    case "motionReady":
      return {
        icon: "checkmark-circle",
        label: "Ready",
        color: "#8FFFD1"
      }
    case "idleReady":
      return {
        icon: "sparkles",
        label: "Preview",
        color: "#FFD1E3"
      }
    case "notReady":
      return {
        icon: "alert-circle",
        label: "Art pending",
        color: "#FFE1A8"
      }
  }
}

function getMyRoomPointDistance(
  from: RoomWorldPoint,
  to: RoomWorldPoint
): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
}

function getMyRoomWalkActionTarget(input: {
  geometry: RoomWorldGeometry
  from: RoomWorldPoint
}): RoomWorldPoint | null {
  const candidates = [...MY_ROOM_WALK_ACTION_TARGETS].sort(
    (left, right) =>
      getMyRoomPointDistance(input.from, right) -
      getMyRoomPointDistance(input.from, left)
  )
  for (const candidate of candidates) {
    const target = resolveRoomWorldInteractiveTarget({
      geometry: input.geometry,
      target: candidate,
      clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
    })
    if (
      !target ||
      getMyRoomPointDistance(input.from, target) <= MY_ROOM_MOVEMENT_NO_OP_DISTANCE
    ) {
      continue
    }
    const plan = createRoomWorldMovementPlan({
      geometry: input.geometry,
      from: input.from,
      to: target,
      clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE,
      timing: ROOM_WORLD_MY_ROOM_MOVEMENT_TIMING
    })
    if (plan?.segments.length) return target
  }
  return null
}

function getWideStageRendererTranslateY(input: {
  stageWidth: number
  stageHeight: number
  shellCanvasWidth: number
  shellCanvasHeight: number
  avatarWorldY: number
}): number {
  const rendererHeight =
    input.stageWidth * input.shellCanvasHeight / input.shellCanvasWidth
  const avatarFeetY = rendererHeight * input.avatarWorldY
  const targetFeetY = input.stageHeight * MY_ROOM_WIDE_STAGE_AVATAR_FEET_Y
  const centeredRendererTop = (input.stageHeight - rendererHeight) / 2
  const targetRendererTop = Math.max(
    input.stageHeight - rendererHeight,
    Math.min(0, targetFeetY - avatarFeetY)
  )
  return Math.round(targetRendererTop - centeredRendererTop)
}

function PoseDockButton(props: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  active?: boolean
  onPress: () => void
}) {
  const { icon, label, active, onPress } = props
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} avatar pose`}
      accessibilityState={{ selected: Boolean(active) }}
      onPress={(event) => {
        event.stopPropagation()
        onPress()
      }}
      style={({ pressed }) => [
        styles.poseButton,
        active ? styles.poseButtonActive : null,
        pressed ? styles.poseButtonPressed : null
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? "#FFFFFF" : uiTheme.colors.textSecondary}
      />
      <Text
        style={[
          styles.poseButtonText,
          active ? styles.poseButtonTextActive : null
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

type RoomShopScreenProps = NativeStackScreenProps<RootStackParamList, "RoomShop">

export function RoomShopScreen({ navigation }: RoomShopScreenProps) {
  const { addPlacedItem } = useRoomV2()
  const { ownsRoomItem } = useInventoryStore()
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null)

  const addFurnitureToRoom = useCallback(
    (item: FurnitureItem): void => {
      if (!ownsRoomItem(item.id)) return
      const placedItem = createRoomShopPlacedItem(item)
      addPlacedItem(placedItem)
      setLastAddedItemId(item.id)
    },
    [addPlacedItem, ownsRoomItem]
  )

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.title}>Room Shop</Text>
        <View style={styles.iconButton} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.shopContent}
      >
        <View style={styles.shopHero}>
          <View style={styles.shopHeroIcon}>
            <Ionicons name="sparkles" size={26} color="#FF4F98" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopHeroTitle}>Decor Catalog</Text>
            <Text style={styles.shopHeroCopy}>
              Add furniture to make your room yours.
            </Text>
          </View>
        </View>

        <View style={styles.shopGrid}>
          {ROOM_V2_FURNITURE_CATALOG.map((item) => {
            const justAdded = lastAddedItemId === item.id
            const owned = ownsRoomItem(item.id)
            return (
              <View key={item.id} style={styles.shopCard}>
                <FurniturePreviewImage item={item} />
                <Text style={styles.shopItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.shopItemMeta} numberOfLines={1}>
                  {item.category}
                </Text>
                <Pressable
                  disabled={!owned}
                  style={[
                    styles.addDecorButton,
                    justAdded ? styles.addDecorButtonAdded : null,
                    !owned ? styles.addDecorButtonDisabled : null
                  ]}
                  onPress={() => addFurnitureToRoom(item)}
                >
                  <Ionicons
                    name={!owned ? "lock-closed" : justAdded ? "checkmark" : "add"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.addDecorButtonText}>
                    {!owned ? "Locked" : justAdded ? "Added" : "Add"}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function createRoomShopPlacedItem(item: FurnitureItem): PlacedRoomItem {
  return {
    instanceId: `${item.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    itemId: item.id,
    x: item.category === "wallDecor" ? 0.28 : 0.52,
    y: item.category === "wallDecor" ? 0.5 : 0.72,
    rotation: getDefaultFurnitureRotation(item)
  }
}

function FurniturePreviewImage(props: { item: FurnitureItem }) {
  const { item } = props
  const [failed, setFailed] = useState(false)

  return (
    <View style={styles.shopPreview}>
      {failed ? (
        <View style={styles.shopPreviewFallback}>
          <Ionicons name="cube" size={30} color="#FF8FBD" />
        </View>
      ) : (
        <Image
          source={item.asset.source}
          resizeMode="contain"
          style={styles.shopPreviewImage}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  )
}

function getDefaultFurnitureRotation(item: FurnitureItem): RoomFurnitureRotation {
  const rotations = item.assetsByRotation
    ? (Object.keys(item.assetsByRotation) as RoomFurnitureRotation[])
    : []
  if (rotations.length === 0 || rotations.includes("front")) return "front"
  return rotations[0]
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#070B1D",
  },
  myRoomRoot: {
    flex: 1,
    backgroundColor: uiTheme.colors.background,
  },
  content: {
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: uiTheme.spacing.xs,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: 0,
  },
  title: {
    ...uiTheme.font.heading,
    color: "#FFFFFF",
  },
  subtitle: {
    ...uiTheme.font.caption,
    marginTop: 3,
    color: "rgba(255,255,255,0.62)",
  },
  myRoomTitle: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
  },
  myRoomSubtitle: {
    ...uiTheme.font.caption,
    marginTop: 3,
    color: uiTheme.colors.textSecondary,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  myRoomIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  roomStack: {
    gap: 10,
  },
  roomControlPanel: {
    gap: 8,
    padding: 8,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DDEA",
    ...uiTheme.shadow.soft,
  },
  stageActionDock: {
    flexDirection: "row",
    gap: 7,
    padding: 0,
  },
  stageActionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#26172E",
    borderWidth: 1,
    borderColor: "#39243F",
  },
  stageActionButtonPrimary: {
    backgroundColor: "rgba(255, 79, 152, 0.82)",
    borderColor: "rgba(255,255,255,0.24)",
    shadowColor: "#FF4F98",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  stageActionButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  stageActionText: {
    ...uiTheme.font.captionBold,
    fontSize: 11.5,
    color: "#FFFFFF",
    textAlign: "center",
  },
  shopContent: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingBottom: 34,
    gap: uiTheme.spacing.lg,
  },
  shopHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "rgba(255, 234, 244, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  shopHeroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE2EE",
  },
  shopHeroTitle: {
    ...uiTheme.font.subheading,
    color: "#FFFFFF",
  },
  shopHeroCopy: {
    ...uiTheme.font.bodySmall,
    marginTop: 4,
    color: "rgba(255,255,255,0.68)",
    lineHeight: 18,
  },
  shopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.sm,
  },
  shopCard: {
    width: "48%",
    padding: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "rgba(255, 234, 244, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 183, 217, 0.16)",
  },
  shopPreview: {
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: uiTheme.radius.lg,
    backgroundColor: "rgba(255, 241, 247, 0.09)",
    overflow: "hidden",
  },
  shopPreviewImage: {
    width: "86%",
    height: "86%",
  },
  shopPreviewFallback: {
    width: "86%",
    height: "86%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255, 143, 189, 0.12)",
  },
  shopItemName: {
    ...uiTheme.font.bodySmall,
    marginTop: 10,
    color: "#FFFFFF",
    fontWeight: "900",
  },
  shopItemMeta: {
    ...uiTheme.font.caption,
    marginTop: 3,
    color: "rgba(255,255,255,0.58)",
    textTransform: "capitalize",
  },
  addDecorButton: {
    marginTop: uiTheme.spacing.sm,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: uiTheme.colors.primary,
  },
  addDecorButtonAdded: {
    backgroundColor: "#31B67A",
  },
  addDecorButtonDisabled: {
    opacity: 0.54,
  },
  addDecorButtonText: {
    ...uiTheme.font.captionBold,
    color: "#FFFFFF",
  },
  stageCard: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 34,
    backgroundColor: "#E8B698",
    borderWidth: 1,
    borderColor: "rgba(255, 183, 217, 0.18)",
    ...uiTheme.shadow.deep,
  },
  stageBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#E8B698",
  },
  stageTopScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 92,
    backgroundColor: "rgba(255, 111, 174, 0.1)",
  },
  stageRenderer: {
    backgroundColor: "#E8B698",
  },
  stageHud: {
    position: "absolute",
    left: 14,
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stageHudPill: {
    maxWidth: "45%",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(9,13,34,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  stageHudMetaGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 7,
  },
  stageMiniPill: {
    minWidth: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(9,13,34,0.54)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  stageStatusPill: {
    maxWidth: 138,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(9,13,34,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  movementFeedbackPill: {
    position: "absolute",
    alignSelf: "center",
    top: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: 170,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(34, 9, 22, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 200, 0.28)",
  },
  movementFeedbackText: {
    ...uiTheme.font.captionBold,
    color: "#FFEAF4",
    fontSize: 11,
  },
  stageHeaderText: {
    ...uiTheme.font.captionBold,
    color: "#FFFFFF",
  },
  stageMotionText: {
    ...uiTheme.font.captionBold,
    color: "#FFEAF4",
    fontSize: 11,
  },
  poseDock: {
    flexDirection: "row",
    gap: 5,
  },
  poseButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 14,
    backgroundColor: "#FFF4F9",
    borderWidth: 1,
    borderColor: "#F2DDEA",
  },
  poseButtonActive: {
    backgroundColor: "rgba(255,79,152,0.78)",
    borderColor: "rgba(255,255,255,0.26)",
  },
  poseButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },
  poseButtonText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.textSecondary,
  },
  poseButtonTextActive: {
    color: "#FFFFFF",
  },
})
