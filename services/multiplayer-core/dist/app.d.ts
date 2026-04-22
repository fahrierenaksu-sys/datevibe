import type { ChatThread, ClientEvent, ServerEvent, UserProfile } from "@datevibe/contracts";
import type { LivekitHandoffOptions } from "./media/LivekitHandoffService";
export interface MultiplayerCoreAppOptions {
    livekit?: LivekitHandoffOptions;
}
export declare class MultiplayerCoreApp {
    private readonly lobbyRoom;
    private readonly safetyService;
    private readonly proximityService;
    private readonly miniRoomSpace;
    private readonly connectionDecisionService;
    private readonly chatThreadService;
    constructor(options?: MultiplayerCoreAppOptions);
    handleClientEvent(actor: UserProfile, event: ClientEvent): ServerEvent[];
    getLobbySnapshot(): ServerEvent;
    getChatThread(threadId: string): ChatThread | undefined;
    private createNearbyEvent;
    private createNearbyEventsForAllUsers;
    private createChatParticipants;
    private createChatParticipant;
}
//# sourceMappingURL=app.d.ts.map