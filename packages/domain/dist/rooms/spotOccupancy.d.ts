import type { PresenceUser, RoomLayout } from "@datevibe/contracts";
export declare function isSpotOccupied(users: PresenceUser[], spotId: string, excludeUserId?: string): boolean;
export declare function canOccupySpot(layout: RoomLayout, users: PresenceUser[], spotId: string, userId?: string): boolean;
export declare function getFirstAvailableSpot(layout: RoomLayout, users: PresenceUser[]): string | undefined;
//# sourceMappingURL=spotOccupancy.d.ts.map