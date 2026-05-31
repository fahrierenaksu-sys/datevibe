import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useMemo, useState, useCallback } from "react"
import { Pressable, StyleSheet, Text, View, Image, ScrollView, type LayoutChangeEvent, type GestureResponderEvent } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { RoomRenderer2D } from "../features/roomV2/components/RoomRenderer2D"
import {
  DEFAULT_ROOM_V2_SHELL_ID,
  ROOM_V2_FURNITURE_CATALOG,
  ROOM_V2_SHELL_CATALOG
} from "../features/roomV2/roomV2.mock"
import { resolveRoomV2Scene } from "../features/roomV2/roomV2Selectors"
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
import type { RoomV2RenderItem } from "../features/roomV2/roomV2.types"

type MyRoomV2PreviewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "MyRoomV2Preview"
>

export function MyRoomV2PreviewScreen(props: MyRoomV2PreviewScreenProps) {
  const { navigation } = props
  const { userRoomDecor, setUserRoomDecor } = useRoomV2()
  
  const [draftDecor, setDraftDecor] = useState(() => copyRoomV2Decor(userRoomDecor))
  
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | undefined>()
  const [roomLayout, setRoomLayout] = useState({ width: 0, height: 0 })
  
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

  const handleRoomLayout = useCallback((e: LayoutChangeEvent) => {
    setRoomLayout({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height
    })
  }, [])

  const handleItemTap = useCallback((item: RoomV2RenderItem) => {
    if (item.kind !== "furniture") return
    hapticLight()
    setSelectedInstanceId(item.renderId)
  }, [])

  const handleFloorTap = useCallback((e: GestureResponderEvent) => {
    if (!selectedInstanceId || roomLayout.width === 0 || roomLayout.height === 0) {
      setSelectedInstanceId(undefined)
      return
    }

    // Convert screen tap coordinates to normalized (0..1)
    const { locationX, locationY } = e.nativeEvent
    let normalizedX = locationX / roomLayout.width
    let normalizedY = locationY / roomLayout.height

    // Clamp coordinates to prevent placing items on walls/outside bounds (Isometric Diamond)
    if (scene.shell?.placeableArea) {
      const { minX, maxX, minY, maxY } = scene.shell.placeableArea
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const halfW = (maxX - minX) / 2
      const halfH = (maxY - minY) / 2
      
      let dx = (normalizedX - cx) / halfW
      let dy = (normalizedY - cy) / halfH
      
      const dist = Math.abs(dx) + Math.abs(dy)
      if (dist > 1) {
        dx = dx / dist
        dy = dy / dist
        normalizedX = cx + dx * halfW
        normalizedY = cy + dy * halfH
      }
    }

    const furnitureCollision = scene.renderItems.some((item) => {
      if (item.renderId === selectedInstanceId || item.kind !== "furniture" || !item.blocksMovement) return false
      const fDx = normalizedX - item.x
      const fDy = normalizedY - item.y
      return Math.sqrt(fDx * fDx + fDy * fDy) < 0.08
    })

    if (furnitureCollision) {
      hapticError()
      setSelectedInstanceId(undefined)
      return
    }

    hapticSuccess()
    
    setDraftDecor(current => patchRoomV2PlacedItem(current, selectedInstanceId, {
      x: normalizedX,
      y: normalizedY
    }))
    
    // Deselect after moving
    setSelectedInstanceId(undefined)
  }, [selectedInstanceId, roomLayout, scene.shell?.placeableArea, scene.renderItems])

  const handleRotate = useCallback(() => {
    if (!selectedInstanceId) return
    const selectedItem = scene.renderItems.find(i => i.renderId === selectedInstanceId)
    if (selectedItem?.kind !== "furniture") return
    
    const rot = selectedItem.rotation
    const nextRot = rot === "front" ? "right" : rot === "right" ? "back" : rot === "back" ? "left" : "front"
    setDraftDecor(current => patchRoomV2PlacedItem(current, selectedInstanceId, { rotation: nextRot }))
    hapticLight()
  }, [selectedInstanceId, scene.renderItems])

  const handleRemoveItem = useCallback(() => {
    if (!selectedInstanceId) return
    setDraftDecor(current => removeRoomV2PlacedItem(current, selectedInstanceId))
    setSelectedInstanceId(undefined)
    hapticSuccess()
  }, [selectedInstanceId])

  const handleAddItem = useCallback((itemId: string) => {
    hapticLight()
    const instanceId = `${itemId}_${Date.now()}`
    setDraftDecor(current => appendRoomV2PlacedItem(current, {
      instanceId,
      itemId,
      x: 0.5,
      y: 0.5,
      rotation: "front"
    }))
    setSelectedInstanceId(instanceId)
  }, [])

  const handleSave = useCallback(() => {
    hapticSuccess()
    setUserRoomDecor(draftDecor)
    navigation.goBack()
  }, [draftDecor, setUserRoomDecor, navigation])

  const handleCancel = useCallback(() => {
    hapticLight()
    navigation.goBack()
  }, [navigation])

  const handleResetDraft = useCallback(() => {
    hapticLight()
    setDraftDecor(copyRoomV2Decor(userRoomDecor))
    setSelectedInstanceId(undefined)
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
              {selectedInstanceId ? "Tap floor to place selected item" : "Select furniture or add from tray"}
            </Text>
          </View>
          <View style={styles.topActions}>
            {selectedInstanceId ? (
              <>
              <Pressable onPress={handleRemoveItem} style={styles.actionButton} hitSlop={8}>
                <Ionicons name="trash" size={22} color="#FF6B6B" />
              </Pressable>
              <Pressable onPress={handleRotate} style={styles.actionButton} hitSlop={8}>
                <Ionicons name="sync" size={22} color="#FFFFFF" />
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
          <Pressable 
            style={styles.roomImageWrapper}
            onLayout={handleRoomLayout}
            onPress={handleFloorTap}
          >
            <RoomRenderer2D
              shell={scene.shell}
              renderItems={scene.renderItems}
              selectedInstanceId={selectedInstanceId}
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
            {ROOM_V2_FURNITURE_CATALOG.map((item) => (
              <View key={item.id} style={styles.inventoryItemContainer}>
                <Pressable
                  onPress={() => handleAddItem(item.id)}
                  style={({ pressed }) => [
                    styles.inventoryItem,
                    pressed && styles.inventoryItemPressed
                  ]}
                >
                  <Image source={item.asset.source} style={styles.inventoryItemImage} resizeMode="contain" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  )
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
  cancelButton: {
    width: 40,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22
  },
  actionButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 22
  },
  iconButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.94 }]
  },
  saveButton: {
    paddingHorizontal: 20,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    borderRadius: 20,
    shadowColor: "#FF6B6B",
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
    letterSpacing: 0.3
  },
  titleBlock: {
    flex: 1
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
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
  topBarSpacer: {
    width: 40
  },
  stageWrap: {
    height: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.sm
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
  inventoryItemPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    transform: [{ scale: 0.94 }]
  },
  inventoryItemImage: {
    width: "100%",
    height: "100%"
  }
})
