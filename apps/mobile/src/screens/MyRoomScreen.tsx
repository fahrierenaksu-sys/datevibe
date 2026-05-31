import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useMemo, useState } from "react"
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAvatarV2 } from "../features/avatarV2/state/AvatarV2Provider"
import { ROOM_AVATAR_CATALOG } from "../features/avatarV2/room/avatarRoom.mock"
import { projectAvatarV2ToRoomAvatarAppearance } from "../features/avatarV2/room/avatarRoomProjection"
import { createRoomAvatarRenderItem } from "../features/avatarV2/room/avatarRoomSelectors"
import { RoomRenderer2D } from "../features/roomV2/components/RoomRenderer2D"
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
import type {
  FurnitureItem,
  PlacedRoomItem,
  RoomFurnitureRotation
} from "../features/roomV2/roomV2.types"
import type { SessionActor } from "../features/session/sessionApi"
import type { RootStackParamList } from "../navigation/RootNavigator"

type MyRoomNavProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>
  route: { key: string; name: string }
}

type MyRoomScreenProps = MyRoomNavProps & {
  sessionActor: SessionActor
}

const MY_ROOM_STAGE_CAMERA = {
  rendererWidth: "164%"
} as const

export function MyRoomScreen({ navigation, sessionActor }: MyRoomScreenProps) {
  const { userRoomDecor } = useRoomV2()
  const { avatar, catalog } = useAvatarV2()


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

  const projectedRoomAvatar = useMemo(
    () =>
      projectAvatarV2ToRoomAvatarAppearance({
        avatar,
        avatarCatalog: catalog,
        roomAvatarCatalog: ROOM_AVATAR_CATALOG
      }).appearance,
    [avatar, catalog]
  )

  const roomAvatar = useMemo(
    () =>
      createRoomAvatarRenderItem({
        avatarId: "my-room-owner",
        name: sessionActor.profile.displayName,
        appearance: projectedRoomAvatar,
        x: 0.47,
        y: 0.76,
        width: 0.13,
        height: 0.42,
        renderId: "my_room_owner_avatar"
      }),
    [projectedRoomAvatar, sessionActor.profile.displayName]
  )

  const renderItems = useMemo(
    () => [...roomScene.renderItems, roomAvatar].sort(compareRoomV2RenderItems),
    [roomAvatar, roomScene.renderItems]
  )

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Room</Text>
            <Text style={styles.subtitle}>{sessionActor.profile.displayName}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => navigation.navigate("You")}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFEAF4" />
          </Pressable>
        </View>

        <View style={styles.stageCard}>
          <View style={styles.stageBackdrop} pointerEvents="none" />
          <View style={styles.stageTopScrim} pointerEvents="none" />
          <RoomRenderer2D
            shell={roomScene.shell}
            renderItems={renderItems}
            testID="my-room-production-stage"
            style={[styles.stageRenderer, { width: MY_ROOM_STAGE_CAMERA.rendererWidth }]}
          />
          <View style={styles.stageHeaderPill}>
            <Ionicons name="heart" size={13} color="#FF7AB8" />
            <Text style={styles.stageHeaderText}>Cozy room</Text>
          </View>
          <View style={styles.stageDecorPill}>
            <Ionicons name="cube" size={13} color="#FAD7E8" />
            <Text style={styles.stageHeaderText}>{userRoomDecor.placedItems.length} decor</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate("WardrobeV2")}>
            <Ionicons name="shirt" size={20} color="#FF4F98" />
            <Text style={styles.actionText}>Wardrobe</Text>
          </Pressable>
          <Pressable style={styles.actionButtonPrimary} onPress={() => navigation.navigate("MyRoomV2Preview")}>
            <Ionicons name="brush" size={20} color="#FFFFFF" />
            <Text style={styles.actionTextPrimary}>Edit Room</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={() => navigation.navigate("RoomShop")}>
            <Ionicons name="sparkles" size={20} color="#FF4F98" />
            <Text style={styles.actionText}>Room Shop</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

type RoomShopScreenProps = NativeStackScreenProps<RootStackParamList, "RoomShop">

export function RoomShopScreen({ navigation }: RoomShopScreenProps) {
  const { addPlacedItem } = useRoomV2()
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null)

  const addFurnitureToRoom = useCallback(
    (item: FurnitureItem): void => {
      const placedItem = createRoomShopPlacedItem(item)
      addPlacedItem(placedItem)
      setLastAddedItemId(item.id)
    },
    [addPlacedItem]
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
                  style={[
                    styles.addDecorButton,
                    justAdded ? styles.addDecorButtonAdded : null
                  ]}
                  onPress={() => addFurnitureToRoom(item)}
                >
                  <Ionicons
                    name={justAdded ? "checkmark" : "add"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.addDecorButtonText}>
                    {justAdded ? "Added" : "Add"}
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
    backgroundColor: "#070B1D"
  },
  content: {
    paddingBottom: 104
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900"
  },
  subtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "700"
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)"
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28
  },
  placeholderIcon: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"
  },
  placeholderTitle: {
    marginTop: 20,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  placeholderCopy: {
    marginTop: 10,
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center"
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 8,
    borderRadius: 19,
    backgroundColor: "#FFF1F7",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.58)",
    shadowColor: "#FF4F98",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 8,
    borderRadius: 19,
    backgroundColor: "#FF4F98",
    shadowColor: "#FF4F98",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  },
  actionText: {
    color: "#20162A",
    fontSize: 13,
    fontWeight: "900"
  },
  actionTextPrimary: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28
  },
  emptyTitle: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center"
  },
  emptyCopy: {
    marginTop: 10,
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center"
  },
  shopContent: {
    paddingHorizontal: 16,
    paddingBottom: 34,
    gap: 16
  },
  shopHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "rgba(255, 234, 244, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  shopHeroIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFE2EE"
  },
  shopHeroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900"
  },
  shopHeroCopy: {
    marginTop: 4,
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18
  },
  shopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  shopCard: {
    width: "48%",
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 234, 244, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 183, 217, 0.16)"
  },
  shopPreview: {
    height: 104,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255, 241, 247, 0.09)",
    overflow: "hidden"
  },
  shopPreviewImage: {
    width: "86%",
    height: "86%"
  },
  shopPreviewFallback: {
    width: "86%",
    height: "86%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(255, 143, 189, 0.12)"
  },
  shopItemName: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  shopItemMeta: {
    marginTop: 3,
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize"
  },
  addDecorButton: {
    marginTop: 12,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: "#FF4F98"
  },
  addDecorButtonAdded: {
    backgroundColor: "#31B67A"
  },
  addDecorButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900"
  },
  stageCard: {
    marginHorizontal: 14,
    height: 430,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "#080715",
    borderWidth: 1,
    borderColor: "rgba(255, 183, 217, 0.18)",
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8
  },
  stageBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#0B0815"
  },
  stageTopScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 86,
    backgroundColor: "rgba(255, 111, 174, 0.09)"
  },
  stageRenderer: {
    backgroundColor: "#0B0815"
  },
  stageHeaderPill: {
    position: "absolute",
    left: 14,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(9,13,34,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)"
  },
  stageDecorPill: {
    position: "absolute",
    right: 14,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(9,13,34,0.74)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)"
  },
  stageHeaderText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"
  },
  statValue: {
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  },
  statLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "800"
  }
})
