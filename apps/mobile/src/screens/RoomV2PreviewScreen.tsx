import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { RoomRenderer2D } from "../features/roomV2/components/RoomRenderer2D"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import { resolveRoomV2Scene } from "../features/roomV2/roomV2Selectors"
import { useRoomV2 } from "../features/roomV2/state/RoomV2Provider"
import type {
  FurnitureItem,
  PlacedRoomItem,
  RoomFurnitureRotation,
  RoomV2FurnitureRenderItem,
  RoomV2RenderItem
} from "../features/roomV2/roomV2.types"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { uiTheme } from "../ui/theme"

type RoomV2PreviewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "RoomV2Preview"
>

const NUDGE_STEP = 0.02
const ROOM_V2_GRID_STEP = 0.05
const ROOM_V2_FLOOR_ADD_POSITION = { x: 0.52, y: 0.68 }
const ROOM_V2_WALL_ADD_POSITION = { x: 0.62, y: 0.28 }
const ROOM_V2_GRID_VALUES = Array.from(
  { length: Math.round(1 / ROOM_V2_GRID_STEP) + 1 },
  (_, index) => Number((index * ROOM_V2_GRID_STEP).toFixed(2))
)

interface SceneBounds {
  x: number
  y: number
  width: number
  height: number
}

interface DragState {
  renderId: string
  x: number
  y: number
  offsetX: number
  offsetY: number
}

export function RoomV2PreviewScreen(props: RoomV2PreviewScreenProps) {
  const { navigation } = props
  const {
    userRoomDecor,
    addPlacedItem,
    updatePlacedItem,
    resetRoomDecor
  } = useRoomV2()
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [sceneBounds, setSceneBounds] = useState<SceneBounds | null>(null)
  const [dragState, setDragState] = useState<DragState | null>(null)
  const sceneRef = useRef<View | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const scene = useMemo(
    () =>
      resolveRoomV2Scene({
        roomShellCatalog: ROOM_V2_SHELL_CATALOG,
        furnitureCatalog: ROOM_V2_FURNITURE_CATALOG,
        decor: userRoomDecor,
        defaultRoomShellId: DEFAULT_ROOM_V2_SHELL_ID
      }),
    [userRoomDecor]
  )
  const adjustedRenderItems = useMemo(
    () =>
      dragState
        ? scene.renderItems.map((item) =>
          item.renderId === dragState.renderId
            ? {
              ...item,
              x: dragState.x,
              y: dragState.y
            }
            : item
        )
        : scene.renderItems,
    [dragState, scene.renderItems]
  )
  const furnitureRenderItems = useMemo(
    () => scene.renderItems.filter(isFurnitureRenderItem),
    [scene.renderItems]
  )
  const adjustedFurnitureRenderItems = useMemo(
    () => adjustedRenderItems.filter(isFurnitureRenderItem),
    [adjustedRenderItems]
  )
  const selectedRenderItem = useMemo(
    () =>
      adjustedFurnitureRenderItems.find((item) => item.renderId === selectedItemId)
        ?? adjustedFurnitureRenderItems[0]
        ?? null,
    [adjustedFurnitureRenderItems, selectedItemId]
  )
  const sceneAspectRatio = scene.shell
    ? scene.shell.canvasSize.width / scene.shell.canvasSize.height
    : 1

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  useEffect(() => {
    if (furnitureRenderItems.length === 0) {
      if (selectedItemId !== null) {
        setSelectedItemId(null)
      }
      return
    }

    if (!selectedItemId || !furnitureRenderItems.some((item) => item.renderId === selectedItemId)) {
      setSelectedItemId(furnitureRenderItems[0].renderId)
    }
  }, [furnitureRenderItems, selectedItemId])

  const nudgeSelectedItem = useCallback(
    (deltaX: number, deltaY: number): void => {
      if (!selectedRenderItem) return

      dragStateRef.current = null
      setDragState(null)
      updatePlacedItem(selectedRenderItem.renderId, {
        x: clampNormalizedCoordinate(selectedRenderItem.x + deltaX),
        y: clampNormalizedCoordinate(selectedRenderItem.y + deltaY)
      })
    },
    [selectedRenderItem, updatePlacedItem]
  )

  const handleResetRoom = useCallback((): void => {
    resetRoomDecor()
    setSelectedItemId(null)
    dragStateRef.current = null
    setDragState(null)
  }, [resetRoomDecor])

  const handleAddFurnitureItem = useCallback(
    (item: FurnitureItem): void => {
      const position = item.layer === "wall"
        ? ROOM_V2_WALL_ADD_POSITION
        : ROOM_V2_FLOOR_ADD_POSITION
      const placedItem: PlacedRoomItem = {
        instanceId: createRoomV2PlacedItemInstanceId(item.id),
        itemId: item.id,
        x: position.x,
        y: position.y,
        rotation: getDefaultRoomV2FurnitureRotation(item)
      }

      dragStateRef.current = null
      setDragState(null)
      addPlacedItem(placedItem)
      setSelectedItemId(placedItem.instanceId)
    },
    [addPlacedItem]
  )

  const handleSceneLayout = useCallback((_event: LayoutChangeEvent): void => {
    requestAnimationFrame(() => {
      sceneRef.current?.measureInWindow((x, y, width, height) => {
        const nextBounds = { x, y, width, height }
        setSceneBounds(isValidSceneBounds(nextBounds) ? nextBounds : null)
      })
    })
  }, [])

  const beginDragItem = useCallback(
    (item: RoomV2FurnitureRenderItem, pageX: number, pageY: number): void => {
      if (!isValidSceneBounds(sceneBounds)) return

      const pointer = pointToNormalizedCoordinate(pageX, pageY, sceneBounds)
      const nextDragState = {
        renderId: item.renderId,
        x: item.x,
        y: item.y,
        offsetX: item.x - pointer.x,
        offsetY: item.y - pointer.y
      }
      setSelectedItemId(item.renderId)
      dragStateRef.current = nextDragState
      setDragState(nextDragState)
    },
    [sceneBounds]
  )

  const moveDragItem = useCallback(
    (renderId: string, pageX: number, pageY: number): void => {
      if (!isValidSceneBounds(sceneBounds)) return

      const pointer = pointToNormalizedCoordinate(pageX, pageY, sceneBounds)
      setDragState((current) => {
        if (!current || current.renderId !== renderId) return current

        const nextDragState = {
          ...current,
          x: clampNormalizedCoordinate(pointer.x + current.offsetX),
          y: clampNormalizedCoordinate(pointer.y + current.offsetY)
        }
        dragStateRef.current = nextDragState
        return nextDragState
      })
    },
    [sceneBounds]
  )

  const endDragItem = useCallback(
    (renderId: string, pageX: number, pageY: number): void => {
      const currentDragState = dragStateRef.current

      if (!currentDragState || currentDragState.renderId !== renderId) {
        dragStateRef.current = null
        setDragState(null)
        return
      }

      if (!isValidSceneBounds(sceneBounds)) {
        dragStateRef.current = null
        setDragState(null)
        return
      }

      const pointer = pointToNormalizedCoordinate(pageX, pageY, sceneBounds)
      const nextX = clampNormalizedCoordinate(pointer.x + currentDragState.offsetX)
      const nextY = clampNormalizedCoordinate(pointer.y + currentDragState.offsetY)

      updatePlacedItem(renderId, {
        x: snapNormalizedCoordinate(nextX),
        y: snapNormalizedCoordinate(nextY)
      })
      dragStateRef.current = null
      setDragState(null)
    },
    [sceneBounds, updatePlacedItem]
  )

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.backButtonPressed : null
            ]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Room V2 Preview</Text>
            <Text style={styles.subtitle}>Using tight-bound runtime furniture assets</Text>
          </View>
          <View style={styles.devPill}>
            <Text style={styles.devPillText}>Dev</Text>
          </View>
        </View>

        <View style={styles.stageWrap}>
          <View
            ref={sceneRef}
            onLayout={handleSceneLayout}
            style={[
              styles.sceneFrame,
              {
                aspectRatio: sceneAspectRatio
              }
            ]}
          >
            <RoomRenderer2D
              shell={scene.shell}
              renderItems={adjustedRenderItems}
              debugPlacement={__DEV__}
              testID="room-v2-preview"
              style={[styles.renderer, styles.rendererFill]}
            />
            {__DEV__ && selectedRenderItem ? (
              <RoomV2GridOverlay dragState={dragState} />
            ) : null}
            {__DEV__ ? (
              <View pointerEvents="box-none" style={styles.dragOverlay}>
                {adjustedFurnitureRenderItems.map((item) => (
                  <RoomV2DragHandle
                    key={item.renderId}
                    item={item}
                    isSelected={item.renderId === selectedRenderItem?.renderId}
                    isDragging={item.renderId === dragState?.renderId}
                    sceneBounds={sceneBounds}
                    onSelect={setSelectedItemId}
                    onDragStart={beginDragItem}
                    onDragMove={moveDragItem}
                    onDragEnd={endDragItem}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </View>
        {__DEV__ ? (
          <View style={styles.devPanel}>
            <View style={styles.devPanelHeader}>
              <View>
                <Text style={styles.devPanelTitle}>Placement QA</Text>
                <Text style={styles.devPanelSubtitle}>Select an item, then nudge x/y</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={handleResetRoom}
                style={({ pressed }) => [
                  styles.resetButton,
                  pressed ? styles.controlPressed : null
                ]}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
            </View>

            <View style={styles.itemList}>
              {furnitureRenderItems.map((item) => {
                const isSelected = item.renderId === selectedRenderItem?.renderId
                return (
                  <Pressable
                    key={item.renderId}
                    accessibilityRole="button"
                    onPress={() => setSelectedItemId(item.renderId)}
                    style={({ pressed }) => [
                      styles.itemChip,
                      isSelected ? styles.itemChipSelected : null,
                      pressed ? styles.controlPressed : null
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.itemChipName,
                        isSelected ? styles.itemChipNameSelected : null
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.itemChipId,
                        isSelected ? styles.itemChipIdSelected : null
                      ]}
                    >
                      {shortRenderId(item.renderId)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.traySection}>
              <View style={styles.trayHeader}>
                <Text style={styles.trayTitle}>Furniture Tray</Text>
                <Text style={styles.trayCount}>
                  {userRoomDecor.placedItems.length} placed
                </Text>
              </View>
              <View style={styles.trayList}>
                {ROOM_V2_FURNITURE_CATALOG.map((item) => (
                  <View key={item.id} style={styles.trayCard}>
                    <View style={styles.trayItemCopy}>
                      <Text numberOfLines={1} style={styles.trayItemName}>
                        {item.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.trayItemMeta}>
                        {item.category} · {item.layer}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleAddFurnitureItem(item)}
                      style={({ pressed }) => [
                        styles.addButton,
                        pressed ? styles.controlPressed : null
                      ]}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.nudgeRow}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName} numberOfLines={1}>
                  {selectedRenderItem?.name ?? "No item selected"}
                </Text>
                <Text style={styles.selectedMeta} numberOfLines={1}>
                  {selectedRenderItem
                    ? `${shortRenderId(selectedRenderItem.renderId)} · x ${formatCoordinate(selectedRenderItem.x)} · y ${formatCoordinate(selectedRenderItem.y)}`
                    : "Select an item to edit"}
                </Text>
              </View>
              <View style={styles.nudgePad}>
                <Pressable
                  accessibilityRole="button"
                  disabled={!selectedRenderItem}
                  onPress={() => nudgeSelectedItem(0, -NUDGE_STEP)}
                  style={({ pressed }) => [
                    styles.nudgeButton,
                    pressed ? styles.controlPressed : null,
                    !selectedRenderItem ? styles.controlDisabled : null
                  ]}
                >
                  <Ionicons name="chevron-up" size={16} color="#FFFFFF" />
                </Pressable>
                <View style={styles.nudgePadMiddle}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!selectedRenderItem}
                    onPress={() => nudgeSelectedItem(-NUDGE_STEP, 0)}
                    style={({ pressed }) => [
                      styles.nudgeButton,
                      pressed ? styles.controlPressed : null,
                      !selectedRenderItem ? styles.controlDisabled : null
                    ]}
                  >
                    <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!selectedRenderItem}
                    onPress={() => nudgeSelectedItem(NUDGE_STEP, 0)}
                    style={({ pressed }) => [
                      styles.nudgeButton,
                      pressed ? styles.controlPressed : null,
                      !selectedRenderItem ? styles.controlDisabled : null
                    ]}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!selectedRenderItem}
                  onPress={() => nudgeSelectedItem(0, NUDGE_STEP)}
                  style={({ pressed }) => [
                    styles.nudgeButton,
                    pressed ? styles.controlPressed : null,
                    !selectedRenderItem ? styles.controlDisabled : null
                  ]}
                >
                  <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  )
}

function RoomV2DragHandle(props: {
  item: RoomV2FurnitureRenderItem
  isSelected: boolean
  isDragging: boolean
  sceneBounds: SceneBounds | null
  onSelect: (renderId: string) => void
  onDragStart: (item: RoomV2FurnitureRenderItem, pageX: number, pageY: number) => void
  onDragMove: (renderId: string, pageX: number, pageY: number) => void
  onDragEnd: (renderId: string, pageX: number, pageY: number) => void
}) {
  const {
    item,
    isSelected,
    isDragging,
    sceneBounds,
    onSelect,
    onDragStart,
    onDragMove,
    onDragEnd
  } = props
  const canDrag = isValidSceneBounds(sceneBounds)
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => canDrag,
        onMoveShouldSetPanResponder: () => canDrag,
        onPanResponderGrant: (event, gestureState) => {
          if (!canDrag) return

          const pageX = gestureState.x0 || event.nativeEvent.pageX
          const pageY = gestureState.y0 || event.nativeEvent.pageY
          onSelect(item.renderId)
          onDragStart(item, pageX, pageY)
        },
        onPanResponderMove: (event, gestureState) => {
          if (!canDrag) return

          onDragMove(
            item.renderId,
            gestureState.moveX || event.nativeEvent.pageX,
            gestureState.moveY || event.nativeEvent.pageY
          )
        },
        onPanResponderRelease: (event, gestureState) => {
          onDragEnd(
            item.renderId,
            gestureState.moveX || event.nativeEvent.pageX || gestureState.x0,
            gestureState.moveY || event.nativeEvent.pageY || gestureState.y0
          )
        },
        onPanResponderTerminate: (event, gestureState) => {
          onDragEnd(
            item.renderId,
            gestureState.moveX || event.nativeEvent.pageX || gestureState.x0,
            gestureState.moveY || event.nativeEvent.pageY || gestureState.y0
          )
        },
        onPanResponderTerminationRequest: () => false
      }),
    [canDrag, item, onDragEnd, onDragMove, onDragStart, onSelect]
  )

  return (
    <View
      {...panResponder.panHandlers}
      pointerEvents="auto"
      style={[
        styles.dragHandle,
        getRoomV2ItemBoundsStyle(item),
        isSelected ? styles.dragHandleSelected : null,
        isDragging ? styles.dragHandleDragging : null
      ]}
    >
      {isSelected ? (
        <Text numberOfLines={1} style={styles.dragHandleLabel}>
          {shortRenderId(item.renderId)}
        </Text>
      ) : null}
      <View
        style={[
          styles.dragHandleAnchor,
          {
            left: `${item.anchor.x * 100}%`,
            top: `${item.anchor.y * 100}%`
          }
        ]}
      />
    </View>
  )
}

function RoomV2GridOverlay(props: { dragState: DragState | null }) {
  const { dragState } = props
  const snappedX = dragState
    ? snapNormalizedCoordinate(dragState.x)
    : null
  const snappedY = dragState
    ? snapNormalizedCoordinate(dragState.y)
    : null

  return (
    <View pointerEvents="none" style={styles.gridOverlay}>
      {ROOM_V2_GRID_VALUES.map((value) => (
        <View
          key={`grid-v-${value}`}
          style={[
            styles.gridLine,
            styles.gridLineVertical,
            {
              left: `${value * 100}%`
            }
          ]}
        />
      ))}
      {ROOM_V2_GRID_VALUES.map((value) => (
        <View
          key={`grid-h-${value}`}
          style={[
            styles.gridLine,
            styles.gridLineHorizontal,
            {
              top: `${value * 100}%`
            }
          ]}
        />
      ))}
      {snappedX !== null && snappedY !== null ? (
        <View
          style={[
            styles.snapTarget,
            {
              left: `${snappedX * 100}%`,
              top: `${snappedY * 100}%`
            }
          ]}
        />
      ) : null}
    </View>
  )
}

function isFurnitureRenderItem(
  item: RoomV2RenderItem
): item is RoomV2FurnitureRenderItem {
  return item.kind === "furniture"
}

function isValidSceneBounds(
  bounds: SceneBounds | null | undefined
): bounds is SceneBounds {
  return Boolean(
    bounds
      && Number.isFinite(bounds.x)
      && Number.isFinite(bounds.y)
      && Number.isFinite(bounds.width)
      && Number.isFinite(bounds.height)
      && bounds.width > 0
      && bounds.height > 0
  )
}

function pointToNormalizedCoordinate(
  pageX: number,
  pageY: number,
  bounds: SceneBounds
): { x: number; y: number } {
  return {
    x: clampNormalizedCoordinate((pageX - bounds.x) / bounds.width),
    y: clampNormalizedCoordinate((pageY - bounds.y) / bounds.height)
  }
}

function clampNormalizedCoordinate(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(4))))
}

function snapNormalizedCoordinate(value: number): number {
  return clampNormalizedCoordinate(
    Math.round(value / ROOM_V2_GRID_STEP) * ROOM_V2_GRID_STEP
  )
}

function createRoomV2PlacedItemInstanceId(itemId: string): string {
  return `${itemId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
}

function getDefaultRoomV2FurnitureRotation(
  item: FurnitureItem
): RoomFurnitureRotation {
  if (!item.assetsByRotation) return "front"
  if (item.assetsByRotation.front) return "front"

  const supportedRotation = Object.keys(item.assetsByRotation)[0] as
    | RoomFurnitureRotation
    | undefined

  return supportedRotation ?? "front"
}

function getRoomV2ItemBoundsStyle(item: RoomV2FurnitureRenderItem): ViewStyle {
  const left = item.x - item.width * item.anchor.x
  const top = item.y - item.height * item.anchor.y

  return {
    left: toPercent(left),
    top: toPercent(top),
    width: toPercent(item.width),
    height: toPercent(item.height)
  }
}

function toPercent(value: number): `${number}%` {
  return `${value * 100}%` as `${number}%`
}

function formatCoordinate(value: number): string {
  return value.toFixed(2)
}

function shortRenderId(renderId: string): string {
  return renderId.replace(/^room_v2_placed_/, "")
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
    gap: uiTheme.spacing.md,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.md
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  backButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.96 }]
  },
  titleBlock: {
    flex: 1
  },
  title: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.heading,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.54)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  devPill: {
    height: 32,
    minWidth: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  devPillText: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  stageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  sceneFrame: {
    width: "100%",
    maxWidth: 560,
    position: "relative"
  },
  renderer: {
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  rendererFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%"
  },
  dragOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  dragHandle: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "rgba(255,255,255,0.02)"
  },
  dragHandleSelected: {
    borderWidth: 2,
    borderColor: "rgba(255,77,166,0.92)",
    backgroundColor: "rgba(255,77,166,0.08)"
  },
  dragHandleDragging: {
    borderColor: "#FFEF5A",
    backgroundColor: "rgba(255,239,90,0.12)",
    transform: [{ scale: 1.03 }]
  },
  dragHandleLabel: {
    position: "absolute",
    left: -1,
    top: -20,
    maxWidth: 108,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(17,10,18,0.88)",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900"
  },
  dragHandleAnchor: {
    position: "absolute",
    width: 10,
    height: 10,
    marginLeft: -5,
    marginTop: -5,
    borderRadius: 5,
    backgroundColor: "#FFEF5A",
    borderWidth: 1,
    borderColor: "#110A12"
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.14)"
  },
  gridLineVertical: {
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth
  },
  gridLineHorizontal: {
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth
  },
  snapTarget: {
    position: "absolute",
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFEF5A",
    backgroundColor: "rgba(255,239,90,0.18)"
  },
  devPanel: {
    marginBottom: uiTheme.spacing.md,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  devPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.md
  },
  devPanelTitle: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "900"
  },
  devPanelSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.54)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  resetButton: {
    minWidth: 58,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  itemList: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
    marginTop: uiTheme.spacing.md
  },
  itemChip: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  itemChipSelected: {
    backgroundColor: "rgba(255,77,166,0.18)",
    borderColor: "rgba(255,77,166,0.7)"
  },
  itemChipName: {
    color: "rgba(255,255,255,0.72)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  itemChipNameSelected: {
    color: "#FFFFFF"
  },
  itemChipId: {
    marginTop: 1,
    color: "rgba(255,255,255,0.42)",
    fontSize: 10,
    fontWeight: "700"
  },
  itemChipIdSelected: {
    color: "rgba(255,255,255,0.68)"
  },
  traySection: {
    gap: uiTheme.spacing.sm,
    marginTop: uiTheme.spacing.md,
    paddingTop: uiTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)"
  },
  trayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  trayTitle: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  trayCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "800"
  },
  trayList: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm
  },
  trayCard: {
    flex: 1,
    minHeight: 70,
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)"
  },
  trayItemCopy: {
    flex: 1,
    minWidth: 0
  },
  trayItemName: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  trayItemMeta: {
    marginTop: 1,
    color: "rgba(255,255,255,0.45)",
    fontSize: 10,
    fontWeight: "700"
  },
  addButton: {
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,77,166,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,77,166,0.6)"
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900"
  },
  nudgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.md,
    marginTop: uiTheme.spacing.md
  },
  selectedInfo: {
    flex: 1,
    minWidth: 0
  },
  selectedName: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "900"
  },
  selectedMeta: {
    marginTop: 2,
    color: "rgba(255,255,255,0.56)",
    fontSize: uiTheme.typography.caption,
    fontWeight: "700"
  },
  nudgePad: {
    alignItems: "center",
    gap: 4
  },
  nudgePadMiddle: {
    flexDirection: "row",
    gap: 24
  },
  nudgeButton: {
    width: 32,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  controlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.96 }]
  },
  controlDisabled: {
    opacity: 0.38
  }
})
