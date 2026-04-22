import type { MediaSessionToken, MiniRoom, MiniRoomInvite, MiniRoomInviteDecision, MiniRoomInviteDecisionStatus } from "@datevibe/contracts";
import { LivekitHandoffService } from "../media/LivekitHandoffService";
export interface CreateInviteInput {
    roomId: string;
    senderUserId: string;
    senderSpotId: string;
    recipientUserId: string;
}
export declare class MiniRoomSpace {
    private readonly livekitHandoffService;
    private readonly invites;
    private readonly inviteDecisions;
    private readonly miniRoomsByInviteId;
    constructor(livekitHandoffService: LivekitHandoffService);
    createInvite(input: CreateInviteInput): MiniRoomInvite;
    getInvite(inviteId: string): MiniRoomInvite | undefined;
    decideInvite(inviteId: string, status: MiniRoomInviteDecisionStatus): MiniRoomInviteDecision | undefined;
    createReadySession(inviteId: string, requestingUserId: string): {
        miniRoom: MiniRoom;
        mediaSession: MediaSessionToken;
    } | undefined;
}
//# sourceMappingURL=MiniRoomSpace.d.ts.map