export declare const ROOM_SPOT_KINDS: readonly ["seat", "hotspot"];
export type RoomSpotKind = (typeof ROOM_SPOT_KINDS)[number];
export interface RoomSpot {
    spotId: string;
    kind: RoomSpotKind;
    x: number;
    y: number;
    label?: string;
}
//# sourceMappingURL=RoomSpot.d.ts.map