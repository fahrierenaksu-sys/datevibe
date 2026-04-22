export declare const MINI_ROOM_INVITE_DECISIONS: readonly ["accepted", "declined", "cancelled"];
export type MiniRoomInviteDecisionStatus = (typeof MINI_ROOM_INVITE_DECISIONS)[number];
export interface MiniRoomInviteDecision {
    inviteId: string;
    status: MiniRoomInviteDecisionStatus;
    decidedAt: string;
}
//# sourceMappingURL=MiniRoomInviteDecision.d.ts.map