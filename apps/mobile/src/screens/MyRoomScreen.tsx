import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
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
  getRoomWorldMotionReadinessSummary,
  type RoomWorldMotionReadinessLevel
} from "../features/roomWorld/roomWorldDiagnostics"
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
  compactRendererWidth: "184%",
  regularRendererWidth: "174%",
  rendererTranslateY: -4,
  stageHeightRatio: 0.45,
  minStageHeight: 390,
  maxStageHeight: 430
} as const
const MY_ROOM_AVATAR_SPAWN = {
  x: 0.47,
  y: 0.76,
  direction: "front" as RoomFurnitureRotation
} as const
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
  const shellCamera = roomScene.shell?.myRoomCamera ?? MY_ROOM_STAGE_CAMERA
  const stageHeight = Math.max(
    shellCamera.minStageHeight,
    Math.min(
      shellCamera.maxStageHeight,
      Math.round(windowSize.height * shellCamera.stageHeightRatio)
    )
  )
  const stageRendererWidth = windowSize.width < 390
    ? shellCamera.compactRendererWidth
    : shellCamera.regularRendererWidth

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
  const roomWorldReadiness = useMemo(
    () => getRoomWorldMotionReadinessSummary({
      geometry: roomWorldGeometry,
      spawn: MY_ROOM_AVATAR_SPAWN,
      clearance: ROOM_WORLD_AVATAR_COLLISION_CLEARANCE
    }),
    [roomWorldGeometry]
  )
  const roomWorldBadge = getMyRoomWorldBadge(roomWorldReadiness.level)

  const roomAvatar = useMemo(
    () =>
      createRoomAvatarRenderItem({
        avatarId: "my-room-owner",
        name: sessionActor.profile.displayName,
        appearance: projectedRoomAvatar,
        x: avatarPose.x,
        y: avatarPose.y,
        width: 0.13,
        height: 0.42,
        renderId: "my_room_owner_avatar",
        direction: avatarPose.direction,
        state: avatarPose.state,
        depth: avatarPose.y
      }),
    [
      avatarPose.direction,
      avatarPose.state,
      avatarPose.x,
      avatarPose.y,
      projectedRoomAvatar,
      sessionActor.profile.displayName
    ]
  )

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

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Room</Text>
            <Text style={styles.subtitle}>Cozy avatar room</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile options"
            style={styles.iconButton}
            onPress={() => navigation.navigate("You")}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFEAF4" />
          </Pressable>
        </View>

        <View style={styles.roomStack}>
          <View style={[styles.stageCard, { height: stageHeight }]}>
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
                  transform: [{ translateY: shellCamera.rendererTranslateY }]
                }
              ]}
            />
            <View style={styles.stageHud} pointerEvents="none">
              <View style={styles.stageHudRow}>
                <View style={styles.stageHudPill}>
                  <Ionicons name="heart" size={13} color="#FF7AB8" />
                  <Text style={styles.stageHeaderText} numberOfLines={1}>
                    Cozy room
                  </Text>
                </View>
                <View style={styles.stageHudPill}>
                  <Ionicons name="cube" size={13} color="#FAD7E8" />
                  <Text style={styles.stageHeaderText} numberOfLines={1}>
                    {userRoomDecor.placedItems.length} decor
                  </Text>
                </View>
              </View>
              <View style={styles.stageHudRow}>
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
                <View style={styles.stageStatusPill}>
                  <Ionicons
                    name={roomWorldBadge.icon}
                    size={13}
                    color={roomWorldBadge.color}
                  />
                  <Text style={styles.stageMotionText} numberOfLines={1}>
                    {roomWorldBadge.label}
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
            <View style={styles.poseDock}>
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
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open wardrobe"
              style={({ pressed }) => [
                styles.actionButtonGlass,
                pressed ? styles.actionButtonPressed : null
              ]}
              onPress={() => navigation.navigate("WardrobeV2")}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="shirt" size={20} color="#FF7AB8" />
              </View>
              <Text style={styles.actionTextGlass} numberOfLines={1}>
                Wardrobe
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit room"
              style={({ pressed }) => [
                styles.actionButtonGlass,
                pressed ? styles.actionButtonPressed : null
              ]}
              onPress={() => navigation.navigate("MyRoomV2Preview")}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="brush" size={20} color="#FF7AB8" />
              </View>
              <Text style={styles.actionTextGlass} numberOfLines={1}>
                Edit Room
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open room shop"
              style={({ pressed }) => [
                styles.actionButtonGlass,
                pressed ? styles.actionButtonPressed : null
              ]}
              onPress={() => navigation.navigate("RoomShop")}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="sparkles" size={20} color="#FF7AB8" />
              </View>
              <Text style={styles.actionTextGlass} numberOfLines={1}>
                Room Shop
              </Text>
            </Pressable>
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
        label: "Motion assets",
        color: "#8FFFD1"
      }
    case "idleReady":
      return {
        icon: "sparkles",
        label: "Runtime motion",
        color: "#FFD1E3"
      }
    case "notReady":
      return {
        icon: "alert-circle",
        label: "Room art pending",
        color: "#FFE1A8"
      }
  }
}

function getMyRoomWorldBadge(level: RoomWorldMotionReadinessLevel): {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
} {
  switch (level) {
    case "ready":
      return {
        icon: "walk",
        label: "Room pathing",
        color: "#8FFFD1"
      }
    case "constrained":
      return {
        icon: "resize",
        label: "Tight layout",
        color: "#FFE1A8"
      }
    case "blocked":
      return {
        icon: "alert-circle",
        label: "Path blocked",
        color: "#FFB4C8"
      }
  }
}

function getMyRoomPointDistance(
  from: RoomWorldPoint,
  to: RoomWorldPoint
): number {
  return Math.hypot(to.x - from.x, to.y - from.y)
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
        color={active ? "#FFFFFF" : "#FFEAF4"}
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
  content: {
    gap: 10,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.md,
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
  roomStack: {
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 0,
    marginTop: 0,
  },
  actionButtonGlass: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 72,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: "rgba(24, 14, 31, 0.58)",
    borderWidth: 1,
    borderColor: "rgba(255, 122, 184, 0.28)",
    shadowColor: "#FF4F98",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  actionButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  actionIconWrap: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255, 234, 244, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  actionTextGlass: {
    ...uiTheme.font.captionBold,
    fontSize: 11.5,
    color: "#FFD9E8",
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
    justifyContent: "flex-start",
    overflow: "hidden",
    borderRadius: uiTheme.radius.xxl,
    backgroundColor: "#080715",
    borderWidth: 1,
    borderColor: "rgba(255, 183, 217, 0.24)",
    ...uiTheme.shadow.deep,
  },
  stageBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#0B0815",
  },
  stageTopScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 68,
    backgroundColor: "rgba(255, 111, 174, 0.08)",
  },
  stageRenderer: {
    backgroundColor: "#0B0815",
  },
  stageHud: {
    position: "absolute",
    left: 12,
    top: 12,
    right: 12,
    gap: 7,
  },
  stageHudRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  stageHudPill: {
    maxWidth: "48%",
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
  stageStatusPill: {
    maxWidth: "48%",
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
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    gap: 5,
    padding: 5,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "rgba(9,13,34,0.68)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  poseButton: {
    flex: 1,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    color: "#FFEAF4",
  },
  poseButtonTextActive: {
    color: "#FFFFFF",
  },
})
