import type { NearbyUser, PresenceUser, RoomLayout } from "@datevibe/contracts";
import { SafetyService } from "../safety/SafetyService";
export declare class SpotProximityService {
    private readonly safetyService;
    constructor(safetyService: SafetyService);
    listNearbyUsers(layout: RoomLayout, users: readonly PresenceUser[], currentUserId: string): NearbyUser[];
}
//# sourceMappingURL=SpotProximityService.d.ts.map