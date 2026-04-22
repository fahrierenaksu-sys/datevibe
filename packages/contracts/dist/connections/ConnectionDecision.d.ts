export declare const CONNECTION_DECISION_STATUSES: readonly ["saved", "passed"];
export type ConnectionDecisionStatus = (typeof CONNECTION_DECISION_STATUSES)[number];
export interface ConnectionDecisionCommand {
    miniRoomId: string;
    partnerUserId: string;
    status: ConnectionDecisionStatus;
}
export interface ConnectionDecisionRecord {
    miniRoomId: string;
    actorUserId: string;
    partnerUserId: string;
    status: ConnectionDecisionStatus;
    decidedAt: string;
}
export interface ConnectionMatch {
    miniRoomId: string;
    participantUserIds: [string, string];
    matchedAt: string;
}
//# sourceMappingURL=ConnectionDecision.d.ts.map