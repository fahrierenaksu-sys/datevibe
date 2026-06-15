import { roomV2Assets } from "./roomV2Assets"
import type {
  FurnitureItem,
  RoomShell,
  UserRoomDecor
} from "./roomV2.types"

export const DEFAULT_ROOM_V2_SHELL_ID =
  "room_v2_shell_datevibe_world_v1"

export const ROOM_V2_SHELL_CATALOG: RoomShell[] = [
  {
    id: DEFAULT_ROOM_V2_SHELL_ID,
    name: "DateVibe World Shell V1",
    asset: roomV2Assets.shells.datevibeWorldShellV1,
    canvasSize: { width: 1254, height: 714 },
    myRoomCamera: {
      compactRendererWidth: "190%",
      regularRendererWidth: "182%",
      rendererTranslateY: -36,
      stageHeightRatio: 0.45,
      minStageHeight: 390,
      maxStageHeight: 430
    },
    miniRoomCamera: {
      rendererWidth: "176%",
      rendererTranslateY: -10,
      backgroundColor: "#F8ECF2"
    },
    // Rectangular bounds stay useful for edit placement and lane snapping.
    placeableArea: {
      minX: 0.22,
      maxX: 0.78,
      minY: 0.45,
      maxY: 0.88
    },
    walkablePolygon: [
      { x: 0.48, y: 0.42 },
      { x: 0.8, y: 0.55 },
      { x: 0.83, y: 0.72 },
      { x: 0.7, y: 0.9 },
      { x: 0.3, y: 0.9 },
      { x: 0.17, y: 0.72 },
      { x: 0.2, y: 0.55 }
    ],
    placementLanes: [
      {
        id: "room_v2_world_lane_wall",
        label: "Wall line",
        y: 0.54,
        minX: 0.26,
        maxX: 0.74,
        snapRadius: 0.035
      },
      {
        id: "room_v2_world_lane_mid",
        label: "Middle",
        y: 0.66,
        minX: 0.24,
        maxX: 0.76,
        snapRadius: 0.045
      },
      {
        id: "room_v2_world_lane_social",
        label: "Social",
        y: 0.76,
        minX: 0.25,
        maxX: 0.75,
        snapRadius: 0.045
      },
      {
        id: "room_v2_world_lane_front",
        label: "Front",
        y: 0.86,
        minX: 0.28,
        maxX: 0.72,
        snapRadius: 0.04
      }
    ]
  }
]

export const ROOM_V2_FURNITURE_CATALOG: FurnitureItem[] = [
  {
    id: "room_v2_chair_blush",
    name: "Blush Lounge Chair",
    asset: roomV2Assets.furniture.datevibeWorldChairV1,
    category: "seating",
    layer: "furniture",
    width: 0.15,
    height: 0.29,
    footprint: { width: 0.13, height: 0.08 },
    blocksMovement: true,
    interactionType: "seat",
    seatPoints: [
      {
        id: "front_edge",
        x: 0,
        y: -0.24,
        facing: "front"
      }
    ],
    ownedByDefault: true
  },
  {
    id: "room_v2_table_round",
    name: "Cozy Round Table",
    asset: roomV2Assets.furniture.datevibeWorldTableV1,
    category: "table",
    layer: "furniture",
    width: 0.15,
    height: 0.2,
    footprint: { width: 0.12, height: 0.08 },
    blocksMovement: true,
    interactionType: "decor",
    ownedByDefault: true
  },
  {
    id: "room_v2_lamp_heart",
    name: "Heart Glow Lamp",
    asset: roomV2Assets.furniture.datevibeWorldDecorV1,
    category: "lighting",
    layer: "furniture",
    width: 0.08,
    height: 0.28,
    interactionType: "decor",
    ownedByDefault: true
  },
  {
    id: "room_v2_cozy_bed",
    name: "Pink Cloud Bed",
    asset: roomV2Assets.furniture.datevibeCozyBedV1,
    category: "seating",
    layer: "furniture",
    width: 0.35,
    height: 0.35,
    anchor: { x: 0.5, y: 0.85 },
    footprint: { width: 0.3, height: 0.2 },
    blocksMovement: true,
    interactionType: "seat",
    seatPoints: [
      {
        id: "left_edge",
        x: -0.18,
        y: -0.36,
        facing: "left"
      }
    ],
    locked: true
  },
  {
    id: "room_v2_cute_bookshelf",
    name: "Cozy Bookshelf",
    asset: roomV2Assets.furniture.datevibeBookshelfV1,
    category: "wallDecor",
    layer: "furniture",
    width: 0.2,
    height: 0.3,
    anchor: { x: 0.5, y: 0.88 },
    footprint: { width: 0.18, height: 0.08 },
    blocksMovement: true,
    interactionType: "decor",
    locked: true
  },
  {
    id: "room_v2_heart_rug",
    name: "Heart Cloud Rug",
    asset: roomV2Assets.furniture.datevibeHeartRugV1,
    category: "rug",
    layer: "floor",
    width: 0.25,
    height: 0.15,
    anchor: { x: 0.5, y: 0.75 },
    blocksMovement: false,
    interactionType: "decor",
    ownedByDefault: true
  },
  {
    id: "room_v2_side_table",
    name: "Petal Side Table",
    asset: roomV2Assets.furniture.datevibeSideTableV1,
    category: "table",
    layer: "furniture",
    width: 0.15,
    height: 0.18,
    anchor: { x: 0.5, y: 0.85 },
    footprint: { width: 0.12, height: 0.08 },
    blocksMovement: true,
    interactionType: "decor",
    locked: true
  }
]

export const MOCK_USER_ROOM_V2_DECOR: UserRoomDecor = {
  roomShellId: DEFAULT_ROOM_V2_SHELL_ID,
  placedItems: [
    {
      instanceId: "room_v2_placed_lamp_01",
      itemId: "room_v2_lamp_heart",
      x: 0.76,
      y: 0.66,
      rotation: "front"
    },
    {
      instanceId: "room_v2_placed_chair_01",
      itemId: "room_v2_chair_blush",
      x: 0.58,
      y: 0.86,
      rotation: "front"
    },
    {
      instanceId: "room_v2_placed_table_01",
      itemId: "room_v2_table_round",
      x: 0.42,
      y: 0.74,
      rotation: "front"
    },
    {
      instanceId: "room_v2_placed_rug_01",
      itemId: "room_v2_heart_rug",
      x: 0.75,
      y: 0.60,
      rotation: "front"
    }
  ]
}
