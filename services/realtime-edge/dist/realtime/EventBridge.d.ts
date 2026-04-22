import type { ClientEvent, ServerEvent, UserProfile } from "@datevibe/contracts";
import { MultiplayerCoreApp } from "@datevibe/multiplayer-core";
import { ConnectionRegistry } from "./ConnectionRegistry";
export interface HandleClientEventInput {
    connectionId: string;
    actor: UserProfile;
    event: ClientEvent;
    emit: (connectionId: string, event: ServerEvent) => void;
}
export declare class EventBridge {
    private readonly multiplayerCore;
    private readonly connectionRegistry;
    private readonly inviteParticipantsByInviteId;
    constructor(multiplayerCore: MultiplayerCoreApp, connectionRegistry: ConnectionRegistry);
    handleClientEvent(input: HandleClientEventInput): void;
    private routeEvent;
    private emitToUser;
    private emitToUsers;
    private emitToRoom;
}
//# sourceMappingURL=EventBridge.d.ts.map