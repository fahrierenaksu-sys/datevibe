import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { Pressable, StyleSheet, Text, View, Image, ScrollView, PanResponder, type LayoutChangeEvent, type GestureResponderEvent } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { RoomRenderer2D } from "../features/roomV2/components/RoomRenderer2D"
import { useInventoryStore } from "../features/inventory/inventoryStore"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import {
  createRoomV2FurniturePlacementPreview,
  compareRoomV2RenderItems,
  resolvePlacedFurnitureRenderItem,
  resolveRoomV2Scene,
  snapRoomV2PointToPlacementLane,
  validateRoomV2FurniturePlacement
} from "../features/roomV2/roomV2Selectors"
import { 
  useRoomV2, 
  appendRoomV2PlacedItem, 
  copyRoomV2Decor,
  patchRoomV2PlacedItem, 
  removeRoomV2PlacedItem 
} from "../features/roomV2/state/RoomV2Provider"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { uiTheme } from "../ui/theme"
import { hapticLight, hapticSuccess, hapticError } from "../ui/haptics"
import { projectRoomWorldPointToPolygon } from "../features/roomWorld/roomWorldGeometry"
import { getRoomWorldMotionReadinessSummary } from "../features/roomWorld/roomWorldDiagnostics"
import { createRoomWorldGeometryFromRoomV2Scene } from "../features/roomWorld/roomWorldRoomV2Projection"
import type {
  FurnitureItem,
  PlacedRoomItem,
  ResolvedRoomV2Scene,
  RoomShell,
  RoomV2RenderItem
} from "../features/roomV2/roomV2.types"

type MyRoomV2PreviewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "MyRoomV2Preview"
>

const ROOM_V2_PLACEMENT_SNAP_STEP = 0.01
const EDIT_ROOM_AVATAR_SPAWN = {
  x: 0.47,
  y: 0.76
} as const

interface PlacementPreview {
  item: RoomV2RenderItem
  isValid: boolean
  feedback?: string
  blockingRenderIds?: string[]
}

interface StageWindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export function MyRoomV2PreviewScreen(props: MyRoomV2PreviewScreenProps) {
  const { navigation, route } = props
  const { userRoomDecor, setUserRoomDecor } = useRoomV2()
  const { ownsRoomItem } = useInventoryStore()
  const placementItemId = route.params?.placementItemId
  const hasAppliedPlacementIntent = useRef(false)
  const stageRef = useRef<View | null>(null)
  const trayDragInstanceIdRef = useRef<string | null>(null)
  
  const [draftDecor, setDraftDecor] = useState(() => copyRoomV2Decor(userRoomDecor))
  
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>()
  const [placementFeedback, setPlacementFeedback] = useState<string | undefined>()
  const [placementPreview, setPlacementPreview] = useState<PlacementPreview | undefined>()
  const [roomLayout, setRoomLayout] = useState({ width: 0, height: 0 })
  const [stageWindowBounds, setStageWindowBounds] = useState<StageWindowBounds | undefined>()
  
  const scene = useMemo(
    () =>
      resolveRoomV2Scene({
        roomShellCatalog: ROOM_V2_SHELL_CATALOG,
        furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
        decor: draftDecor,
        defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
      }),
    [draftDecor]
  )
  const displayRenderItems = useMemo(() => {
    if (!placementPreview) return scene.renderItems
    const containsPreviewItem = scene.renderItems.some((item) =>
      item.renderId === placementPreview.item.renderId
    )
    const items = containsPreviewItem
      ? scene.renderItems.map((item) =>
        item.renderId === placementPreview.item.renderId
          ? placementPreview.item
          : item
      )
      : [...scene.renderItems, placementPreview.item]
    return items.sort(compareRoomV2RenderItems)
  }, [placementPreview, scene.renderItems])
  const placementStateByRenderId = useMemo(() => {
    if (!placementPreview) return undefined
    const stateByRenderId: Record<string, "valid" | "invalid"> = {
      [placementPreview.item.renderId]: placementPreview.isValid
        ? "valid"
        : "invalid"
    }
    if (!placementPreview.isValid) {
      placementPreview.blockingRenderIds?.forEach((renderId) => {
        stateByRenderId[renderId] = "invalid"
      })
    }
    return {
      ...stateByRenderId
    }
  }, [placementPreview])
  const roomWorldGeometry = useMemo(
    () => createRoomWorldGeometryFromRoomV2Scene(scene),
    [scene]
  )
  const roomWorldReadiness = useMemo(
    () => getRoomWorldMotionReadinessSummary({
      geometry: roomWorldGeometry,
      spawn: EDIT_ROOM_AVATAR_SPAWN
    }),
    [roomWorldGeometry]
  )
  const roomWorldStatus = getEditRoomWorldStatus(roomWorldReadiness.level)

  const measureStageWindow = useCallback(() => {
    stageRef.current?.measureInWindow((x, y, width, height) => {
      setStageWindowBounds({ x, y, width, height })
    })
  }, [])

  const handleRoomLayout = useCallback((e: LayoutChangeEvent) => {
    setRoomLayout({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height
    })
    requestAnimationFrame(measureStageWindow)
  }, [measureStageWindow])

  const handleItemTap = useCallback((item: RoomV2RenderItem) => {
    if (item.kind !== "furniture") return
    hapticLight()
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
    setSelectedInstanceId(item.renderId)
  }, [])

  const createPlacementPreviewFromEvent = useCallback((e: GestureResponderEvent): PlacementPreview | undefined => {
    if (!selectedInstanceId || roomLayout.width === 0 || roomLayout.height === 0) {
      return undefined
    }

    const { locationX, locationY } = e.nativeEvent
    const normalizedPoint = clampRoomV2PlacementPointToFloor({
      x: locationX / roomLayout.width,
      y: locationY / roomLayout.height
    }, scene.shell)

    const selectedItem = scene.renderItems.find((item) =>
      item.renderId === selectedInstanceId
    )
    if (!selectedItem || selectedItem.kind !== "furniture") return undefined

    const candidate = createRoomV2FurniturePlacementPreview({
      item: selectedItem,
      x: normalizedPoint.x,
      y: normalizedPoint.y
    })
    const validation = validateRoomV2FurniturePlacement({
      scene,
      candidate
    })

    return createRoomV2PlacementPreviewResult({
      scene,
      candidate,
      placementIsValid: validation.isValid,
      placementFeedback: validation.isValid
        ? undefined
        : getRoomPlacementFeedback(validation.issueIds[0]),
      blockingRenderIds: validation.blockingRenderIds
    })
  }, [selectedInstanceId, roomLayout.height, roomLayout.width, scene])

  const createTrayPlacementPreview = useCallback((input: {
    item: FurnitureItem
    instanceId: string
    pageX: number
    pageY: number
  }): PlacementPreview | undefined => {
    if (
      !stageWindowBounds ||
      stageWindowBounds.width <= 0 ||
      stageWindowBounds.height <= 0
    ) {
      return undefined
    }
    const localX = input.pageX - stageWindowBounds.x
    const localY = input.pageY - stageWindowBounds.y
    const isInsideStage =
      localX >= 0 &&
      localX <= stageWindowBounds.width &&
      localY >= 0 &&
      localY <= stageWindowBounds.height

    if (!isInsideStage) {
      return {
        item: resolvePlacedFurnitureRenderItem({
          instanceId: input.instanceId,
          itemId: input.item.id,
          x: 0.5,
          y: 0.72,
          rotation: getDefaultRoomV2FurnitureRotation(input.item)
        }, input.item),
        isValid: false,
        feedback: "Drag it onto the room floor."
      }
    }

    const normalizedPoint = clampRoomV2PlacementPointToFloor({
      x: localX / stageWindowBounds.width,
      y: localY / stageWindowBounds.height
    }, scene.shell)
    const placedItem: PlacedRoomItem = {
      instanceId: input.instanceId,
      itemId: input.item.id,
      x: normalizedPoint.x,
      y: normalizedPoint.y,
      rotation: getDefaultRoomV2FurnitureRotation(input.item)
    }
    const candidate = resolvePlacedFurnitureRenderItem(placedItem, input.item)
    const validation = validateRoomV2FurniturePlacement({
      scene,
      candidate
    })

    return createRoomV2PlacementPreviewResult({
      scene,
      candidate,
      placementIsValid: validation.isValid,
      placementFeedback: validation.isValid
        ? undefined
        : getRoomPlacementFeedback(validation.issueIds[0]),
      blockingRenderIds: validation.blockingRenderIds
    })
  }, [scene, stageWindowBounds])

  const commitPlacementPreview = useCallback((preview: PlacementPreview | undefined): void => {
    if (!selectedInstanceId || !preview) {
      setSelectedInstanceId(undefined)
      return
    }

    if (!preview.isValid || preview.item.kind !== "furniture") {
      hapticError()
      setPlacementFeedback(preview.feedback ?? "Choose a clear room spot.")
      setPlacementPreview(preview)
      return
    }

    hapticSuccess()
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
    
    setDraftDecor(current => patchRoomV2PlacedItem(current, selectedInstanceId, {
      x: preview.item.x,
      y: preview.item.y
    }))
    
    setSelectedInstanceId(undefined)
  }, [selectedInstanceId])

  const commitTrayPlacementPreview = useCallback((preview: PlacementPreview | undefined): boolean => {
    if (!preview || preview.item.kind !== "furniture" || !preview.isValid) {
      hapticError()
      setPlacementFeedback(preview?.feedback ?? "Drag it onto the room floor.")
      setPlacementPreview(preview)
      return false
    }

    const placedItem: PlacedRoomItem = {
      instanceId: preview.item.renderId,
      itemId: preview.item.itemId,
      x: preview.item.x,
      y: preview.item.y,
      rotation: preview.item.rotation
    }
    hapticSuccess()
    setDraftDecor((current) => appendRoomV2PlacedItem(current, placedItem))
    setSelectedInstanceId(placedItem.instanceId)
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
    return true
  }, [])

  const handleFloorTap = useCallback((e: GestureResponderEvent) => {
    const preview = createPlacementPreviewFromEvent(e)
    commitPlacementPreview(preview)
  }, [commitPlacementPreview, createPlacementPreviewFromEvent])

  const stagePanResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(selectedInstanceId),
      onMoveShouldSetPanResponder: () => Boolean(selectedInstanceId),
      onPanResponderGrant: (event) => {
        const preview = createPlacementPreviewFromEvent(event)
        setPlacementPreview(preview)
        if (preview?.isValid) {
          setPlacementFeedback(preview.feedback)
        } else if (preview?.feedback) {
          setPlacementFeedback(preview.feedback)
        }
      },
      onPanResponderMove: (event) => {
        const preview = createPlacementPreviewFromEvent(event)
        setPlacementPreview(preview)
        if (preview?.isValid) {
          setPlacementFeedback(preview.feedback ?? "Release to place.")
        } else if (preview?.feedback) {
          setPlacementFeedback(preview.feedback)
        }
      },
      onPanResponderRelease: (event) => {
        commitPlacementPreview(createPlacementPreviewFromEvent(event))
      },
      onPanResponderTerminate: () => {
        setPlacementPreview(undefined)
      }
    }),
    [commitPlacementPreview, createPlacementPreviewFromEvent, selectedInstanceId]
  )

  const createInventoryItemPanHandlers = useCallback((
    item: FurnitureItem,
    owned: boolean
  ) => {
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        owned &&
        Math.abs(gestureState.dy) > 8 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: (_, gestureState) => {
        if (!owned) return
        measureStageWindow()
        const instanceId = `${item.id}_${Date.now()}`
        trayDragInstanceIdRef.current = instanceId
        const preview = createTrayPlacementPreview({
          item,
          instanceId,
          pageX: gestureState.moveX,
          pageY: gestureState.moveY
        })
        setSelectedInstanceId(instanceId)
        setPlacementPreview(preview)
        setPlacementFeedback(preview?.isValid
          ? preview.feedback ?? "Release to place."
          : preview?.feedback ?? "Drag it onto the room floor."
        )
      },
      onPanResponderMove: (_, gestureState) => {
        const instanceId = trayDragInstanceIdRef.current
        if (!owned || !instanceId) return
        const preview = createTrayPlacementPreview({
          item,
          instanceId,
          pageX: gestureState.moveX,
          pageY: gestureState.moveY
        })
        setPlacementPreview(preview)
        if (preview?.isValid) {
          setPlacementFeedback(preview.feedback ?? "Release to place.")
        } else {
          setPlacementFeedback(preview?.feedback ?? "Drag it onto the room floor.")
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const instanceId = trayDragInstanceIdRef.current
        trayDragInstanceIdRef.current = null
        if (!owned || !instanceId) return
        const preview = createTrayPlacementPreview({
          item,
          instanceId,
          pageX: gestureState.moveX,
          pageY: gestureState.moveY
        })
        if (!commitTrayPlacementPreview(preview)) {
          setSelectedInstanceId(undefined)
        }
      },
      onPanResponderTerminate: () => {
        trayDragInstanceIdRef.current = null
        setPlacementPreview(undefined)
        setPlacementFeedback(undefined)
      }
    })
    return responder.panHandlers
  }, [
    commitTrayPlacementPreview,
    createTrayPlacementPreview,
    measureStageWindow
  ])

  const handleRotate = useCallback(() => {
    if (!selectedInstanceId) return
    const selectedItem = scene.renderItems.find(i => i.renderId === selectedInstanceId)
    if (selectedItem?.kind !== "furniture") return
    
    const rot = selectedItem.rotation
    const nextRot: PlacedRoomItem["rotation"] =
      rot === "front"
        ? "right"
        : rot === "right"
        ? "back"
        : rot === "back"
        ? "left"
        : "front"
    const candidate = {
      ...selectedItem,
      rotation: nextRot
    }
    const validation = validateRoomV2FurniturePlacement({
      scene,
      candidate
    })
    const preview = createRoomV2PlacementPreviewResult({
      scene,
      candidate,
      placementIsValid: validation.isValid,
      placementFeedback: validation.isValid
        ? undefined
        : getRoomPlacementFeedback(validation.issueIds[0]),
      blockingRenderIds: validation.blockingRenderIds
    })
    if (!preview.isValid) {
      hapticError()
      setPlacementFeedback(preview.feedback ?? "Choose a clear room spot.")
      setPlacementPreview(preview)
      return
    }
    setDraftDecor(current => patchRoomV2PlacedItem(current, selectedInstanceId, { rotation: nextRot }))
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
    hapticLight()
  }, [selectedInstanceId, scene])

  const handleRemoveItem = useCallback(() => {
    if (!selectedInstanceId) return
    setDraftDecor(current => removeRoomV2PlacedItem(current, selectedInstanceId))
    setSelectedInstanceId(undefined)
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
    hapticSuccess()
  }, [selectedInstanceId])

  const addDraftItem = useCallback((itemId: string, feedback: boolean): boolean => {
    if (!ownsRoomItem(itemId)) {
      if (feedback) hapticError()
      return false
    }
    const item = ROOM_V2_FURNITURE_CATALOG.find((entry) => entry.id === itemId)
    if (!item) {
      if (feedback) hapticError()
      return false
    }
    const placedItem = createValidDraftPlacement({
      item,
      scene,
      itemId
    })
    if (!placedItem) {
      if (feedback) hapticError()
      setPlacementFeedback("No clear spot yet. Move another item first.")
      return false
    }
    if (feedback) hapticLight()
    setDraftDecor(current => appendRoomV2PlacedItem(current, {
      ...placedItem
    }))
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
    setSelectedInstanceId(placedItem.instanceId)
    return true
  }, [ownsRoomItem, scene])

  const handleAddItem = useCallback((itemId: string) => {
    addDraftItem(itemId, true)
  }, [addDraftItem])

  useEffect(() => {
    if (!placementItemId || hasAppliedPlacementIntent.current) return
    hasAppliedPlacementIntent.current = true
    if (addDraftItem(placementItemId, false)) {
      hapticSuccess()
    }
  }, [addDraftItem, placementItemId])

  const handleSave = useCallback(() => {
    const invalidItem = scene.renderItems.find((item) =>
      !validateRoomV2FurniturePlacement({ scene, candidate: item }).isValid
    )
    if (invalidItem) {
      hapticError()
      setSelectedInstanceId(invalidItem.renderId)
      const validation = validateRoomV2FurniturePlacement({
        scene,
        candidate: invalidItem
      })
      setPlacementPreview({
        item: invalidItem,
        isValid: false,
        feedback: getRoomPlacementFeedback(validation.issueIds[0]),
        blockingRenderIds: validation.blockingRenderIds
      })
      setPlacementFeedback("Move the highlighted item before saving.")
      return
    }
    if (roomWorldReadiness.level === "blocked") {
      hapticError()
      setPlacementFeedback("Leave a clear path for your avatar before saving.")
      return
    }
    hapticSuccess()
    setUserRoomDecor(draftDecor)
    navigation.goBack()
  }, [draftDecor, roomWorldReadiness.level, scene, setUserRoomDecor, navigation])

  const handleCancel = useCallback(() => {
    hapticLight()
    navigation.goBack()
  }, [navigation])

  const handleResetDraft = useCallback(() => {
    hapticLight()
    setDraftDecor(copyRoomV2Decor(userRoomDecor))
    setSelectedInstanceId(undefined)
    setPlacementFeedback(undefined)
    setPlacementPreview(undefined)
  }, [userRoomDecor])

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed ? styles.iconButtonPressed : null
            ]}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Edit Room</Text>
            <Text style={styles.subtitle}>
              {placementFeedback ?? (
                selectedInstanceId
                  ? "Drag or tap a clear floor spot"
                  : "Select furniture or add from tray"
              )}
            </Text>
          </View>
          <View style={styles.topActions}>
            {selectedInstanceId ? (
              <>
                <Pressable onPress={handleRemoveItem} style={styles.actionButton} hitSlop={8}>
                  <Ionicons name="trash" size={20} color="#FF7A8A" />
                </Pressable>
                <Pressable onPress={handleRotate} style={styles.actionButton} hitSlop={8}>
                  <Ionicons name="sync" size={20} color="#FFEAF4" />
                </Pressable>
              </>
            ) : null}
            <Pressable 
              onPress={handleSave} 
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed
              ]}
              hitSlop={8}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.stageWrap}>
          <View style={styles.roomWorldStatusPill} pointerEvents="none">
            <Ionicons
              name={roomWorldStatus.icon}
              size={14}
              color={roomWorldStatus.color}
            />
            <Text style={styles.roomWorldStatusText} numberOfLines={1}>
              {roomWorldStatus.label}
            </Text>
          </View>
          <Pressable 
            ref={stageRef}
            style={styles.roomImageWrapper}
            onLayout={handleRoomLayout}
            onPress={handleFloorTap}
            {...stagePanResponder.panHandlers}
          >
            <RoomRenderer2D
              shell={scene.shell}
              renderItems={displayRenderItems}
              selectedInstanceId={selectedInstanceId}
              placementStateByRenderId={placementStateByRenderId}
              showPlacementGuides={Boolean(selectedInstanceId)}
              onItemTap={handleItemTap}
              debugPlacement={false}
              testID="edit-room-v1"
              style={styles.renderer}
            />
          </Pressable>
        </View>
        
        <View style={styles.inventoryWrap}>
          <View style={styles.inventoryHeader}>
            <Text style={styles.inventoryTitle}>Your Furniture</Text>
            <Pressable onPress={handleResetDraft} hitSlop={8}>
              <Text style={styles.inventorySubtitle}>Reset draft</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inventoryScroll}>
            {ROOM_V2_FURNITURE_CATALOG.map((item) => {
              const owned = ownsRoomItem(item.id)
              return (
                <View key={item.id} style={styles.inventoryItemContainer}>
                  <Pressable
                    disabled={!owned}
                    onPress={() => handleAddItem(item.id)}
                    {...createInventoryItemPanHandlers(item, owned)}
                    style={({ pressed }) => [
                      styles.inventoryItem,
                      !owned ? styles.inventoryItemLocked : null,
                      pressed && owned ? styles.inventoryItemPressed : null
                    ]}
                  >
                    <Image
                      source={item.asset.source}
                      style={styles.inventoryItemImage}
                      resizeMode="contain"
                    />
                    {!owned ? (
                      <View style={styles.inventoryItemLock}>
                        <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                </View>
              )
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  )
}

function createValidDraftPlacement(input: {
  item: FurnitureItem
  itemId: string
  scene: ReturnType<typeof resolveRoomV2Scene>
}): PlacedRoomItem | null {
  const instanceId = `${input.itemId}_${Date.now()}`
  const rotation = getDefaultRoomV2FurnitureRotation(input.item)
  const candidates = getRoomV2DraftPlacementCandidates(input.item)

  for (const candidate of candidates) {
    const placedItem: PlacedRoomItem = {
      instanceId,
      itemId: input.itemId,
      x: candidate.x,
      y: candidate.y,
      rotation
    }
    const renderItem = resolvePlacedFurnitureRenderItem(placedItem, input.item)
    const validation = validateRoomV2FurniturePlacement({
      scene: input.scene,
      candidate: renderItem
    })
    const preview = createRoomV2PlacementPreviewResult({
      scene: input.scene,
      candidate: renderItem,
      placementIsValid: validation.isValid,
      placementFeedback: validation.isValid
        ? undefined
        : getRoomPlacementFeedback(validation.issueIds[0]),
      blockingRenderIds: validation.blockingRenderIds
    })
    if (preview.isValid) return placedItem
  }

  return null
}

function getRoomV2DraftPlacementCandidates(
  item: FurnitureItem
): Array<{ x: number; y: number }> {
  if (item.category === "wallDecor") {
    return [
      { x: 0.32, y: 0.52 },
      { x: 0.68, y: 0.52 },
      { x: 0.5, y: 0.5 },
      { x: 0.26, y: 0.6 },
      { x: 0.74, y: 0.6 }
    ]
  }

  return [
    { x: 0.5, y: 0.72 },
    { x: 0.38, y: 0.72 },
    { x: 0.62, y: 0.72 },
    { x: 0.5, y: 0.82 },
    { x: 0.34, y: 0.82 },
    { x: 0.66, y: 0.82 },
    { x: 0.5, y: 0.6 },
    { x: 0.28, y: 0.64 },
    { x: 0.72, y: 0.64 }
  ]
}

function getDefaultRoomV2FurnitureRotation(
  item: FurnitureItem
): PlacedRoomItem["rotation"] {
  const rotations = item.assetsByRotation
    ? (Object.keys(item.assetsByRotation) as PlacedRoomItem["rotation"][])
    : []
  if (rotations.length === 0 || rotations.includes("front")) return "front"
  return rotations[0]
}

function getRoomPlacementFeedback(
  issueId: ReturnType<typeof validateRoomV2FurniturePlacement>["issueIds"][number] | undefined
): string {
  if (issueId === "overlaps_blocking_furniture") {
    return "That spot collides with another item."
  }
  if (issueId === "outside_placeable_area") {
    return "Keep it on the room floor."
  }
  return "Choose a clear room spot."
}

function createRoomV2PlacementPreviewResult(input: {
  scene: ResolvedRoomV2Scene
  candidate: RoomV2RenderItem
  placementIsValid: boolean
  placementFeedback?: string
  blockingRenderIds?: string[]
}): PlacementPreview {
  if (!input.placementIsValid || input.candidate.kind !== "furniture") {
    return {
      item: input.candidate,
      isValid: false,
      feedback: input.placementFeedback,
      blockingRenderIds: input.blockingRenderIds
    }
  }

  const previewScene = createRoomV2SceneWithPreviewItem({
    scene: input.scene,
    candidate: input.candidate
  })
  const geometry = createRoomWorldGeometryFromRoomV2Scene(previewScene)
  const readiness = getRoomWorldMotionReadinessSummary({
    geometry,
    spawn: EDIT_ROOM_AVATAR_SPAWN
  })

  if (readiness.level === "blocked") {
    return {
      item: input.candidate,
      isValid: false,
      feedback: "This blocks your avatar path.",
      blockingRenderIds: [input.candidate.renderId]
    }
  }

  return {
    item: input.candidate,
    isValid: true,
    feedback: readiness.level === "constrained"
      ? "Tight but usable."
      : undefined
  }
}

function createRoomV2SceneWithPreviewItem(input: {
  scene: ResolvedRoomV2Scene
  candidate: RoomV2RenderItem
}): ResolvedRoomV2Scene {
  const containsPreviewItem = input.scene.renderItems.some((item) =>
    item.renderId === input.candidate.renderId
  )
  const renderItems = containsPreviewItem
    ? input.scene.renderItems.map((item) =>
        item.renderId === input.candidate.renderId
          ? input.candidate
          : item
      )
    : [...input.scene.renderItems, input.candidate]

  return {
    ...input.scene,
    renderItems: renderItems.sort(compareRoomV2RenderItems)
  }
}

function getEditRoomWorldStatus(level: ReturnType<typeof getRoomWorldMotionReadinessSummary>["level"]): {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  color: string
} {
  switch (level) {
    case "ready":
      return {
        icon: "walk",
        label: "Clear avatar path",
        color: "#8FFFD1"
      }
    case "constrained":
      return {
        icon: "resize",
        label: "Tight but usable",
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

function clampRoomV2PlacementPointToFloor(
  point: { x: number; y: number },
  shell: RoomShell | null | undefined
): { x: number; y: number } {
  const walkablePolygon = shell?.walkablePolygon
  const placeableArea = shell?.placeableArea
  const normalized = {
    x: Math.max(0, Math.min(1, point.x)),
    y: Math.max(0, Math.min(1, point.y))
  }
  if (walkablePolygon?.length) {
    const projected = projectRoomWorldPointToPolygon(normalized, walkablePolygon)
    const snapped = snapRoomV2PointToPlacementLane({
      shell,
      x: snapRoomV2PlacementValue(projected.x),
      y: snapRoomV2PlacementValue(projected.y)
    })
    return projectRoomWorldPointToPolygon(snapped, walkablePolygon)
  }

  if (!placeableArea) {
    return {
      x: snapRoomV2PlacementValue(normalized.x),
      y: snapRoomV2PlacementValue(normalized.y)
    }
  }

  const { minX, maxX, minY, maxY } = placeableArea
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const halfW = (maxX - minX) / 2
  const halfH = (maxY - minY) / 2
  let dx = (normalized.x - cx) / halfW
  let dy = (normalized.y - cy) / halfH
  const dist = Math.abs(dx) + Math.abs(dy)

  if (dist > 1) {
    dx /= dist
    dy /= dist
  }

  const clamped = {
    x: cx + dx * halfW,
    y: cy + dy * halfH
  }

  return snapRoomV2PointToPlacementLane({
    shell,
    x: Math.max(minX, Math.min(maxX, snapRoomV2PlacementValue(clamped.x))),
    y: Math.max(minY, Math.min(maxY, snapRoomV2PlacementValue(clamped.y)))
  })
}

function snapRoomV2PlacementValue(value: number): number {
  return Math.round(value / ROOM_V2_PLACEMENT_SNAP_STEP) *
    ROOM_V2_PLACEMENT_SNAP_STEP
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#110A12"
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: 12
  },
  cancelButton: {
    width: 40,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  actionButton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  iconButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.94 }]
  },
  saveButton: {
    paddingHorizontal: 17,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF5F9D",
    borderRadius: 20,
    shadowColor: "#FF4F98",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  saveButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0
  },
  titleBlock: {
    flex: 1
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },
  title: {
    color: "#FFFFFF",
    ...uiTheme.font.heading,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.54)",
    ...uiTheme.font.caption,
    fontWeight: "700"
  },
  stageWrap: {
    height: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.sm,
    position: "relative"
  },
  roomWorldStatusPill: {
    position: "absolute",
    top: 18,
    left: 12,
    zIndex: 2,
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(9,13,34,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  roomWorldStatusText: {
    color: "#FFEAF4",
    fontSize: 11,
    fontWeight: "800"
  },
  roomImageWrapper: {
    width: "100%",
    position: "relative",
    borderRadius: 26,
    backgroundColor: "rgba(255, 234, 244, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  renderer: {
    backgroundColor: "#0B0815"
  },
  inventoryWrap: {
    marginTop: uiTheme.spacing.md,
    height: 154,
    backgroundColor: "rgba(35, 20, 45, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: uiTheme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10
  },
  inventoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: uiTheme.spacing.lg,
    marginBottom: uiTheme.spacing.sm
  },
  inventoryTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  inventorySubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2
  },
  inventoryScroll: {
    paddingHorizontal: uiTheme.spacing.md,
    gap: 12
  },
  inventoryItemContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  inventoryItem: {
    width: 72,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    padding: 10
  },
  inventoryItemLocked: {
    opacity: 0.46
  },
  inventoryItemPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    transform: [{ scale: 0.94 }]
  },
  inventoryItemImage: {
    width: "100%",
    height: "100%"
  },
  inventoryItemLock: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)"
  }
})
