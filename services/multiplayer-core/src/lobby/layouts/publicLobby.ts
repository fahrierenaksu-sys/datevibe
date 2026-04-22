import type { RoomLayout } from "@datevibe/contracts";

export const PUBLIC_LOBBY_LAYOUT: RoomLayout = {
  roomId: "public-lobby",
  proximityRadius: 180,
  spots: [
    { spotId: "seat-a1", kind: "seat", x: 120, y: 180, label: "A1" },
    { spotId: "seat-a2", kind: "seat", x: 220, y: 180, label: "A2" },
    { spotId: "seat-a3", kind: "seat", x: 320, y: 180, label: "A3" },
    { spotId: "seat-a4", kind: "seat", x: 420, y: 180, label: "A4" },
    { spotId: "seat-b1", kind: "seat", x: 120, y: 300, label: "B1" },
    { spotId: "seat-b2", kind: "seat", x: 220, y: 300, label: "B2" },
    { spotId: "seat-b3", kind: "seat", x: 320, y: 300, label: "B3" },
    { spotId: "seat-b4", kind: "seat", x: 420, y: 300, label: "B4" },
    { spotId: "hotspot-north", kind: "hotspot", x: 270, y: 90, label: "North" },
    { spotId: "hotspot-south", kind: "hotspot", x: 270, y: 390, label: "South" }
  ]
};
