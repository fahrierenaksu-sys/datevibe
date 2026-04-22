import type { ClientEvent, ServerEvent, UserProfile } from "@datevibe/contracts";
export declare class MultiplayerCoreApp {
    private readonly lobbyRoom;
    private readonly safetyService;
    private readonly proximityService;
    private readonly miniRoomSpace;
    handleClientEvent(actor: UserProfile, event: ClientEvent): ServerEvent[];
    getLobbySnapshot(): ServerEvent;
    private createNearbyEvent;
    private createNearbyEventsForAllUsers;
}
//# sourceMappingURL=app.d.ts.map