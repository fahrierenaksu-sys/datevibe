import type { ConnectionDecisionRecord, ConnectionDecisionStatus, ConnectionMatch, MiniRoom } from "@datevibe/contracts";
export interface RecordConnectionDecisionInput {
    miniRoom: MiniRoom;
    actorUserId: string;
    partnerUserId: string;
    status: ConnectionDecisionStatus;
}
export interface RecordConnectionDecisionResult {
    decision: ConnectionDecisionRecord;
    match?: ConnectionMatch;
}
export declare class ConnectionDecisionService {
    private readonly decisionsByKey;
    private readonly matchedMiniRoomIds;
    recordDecision(input: RecordConnectionDecisionInput): RecordConnectionDecisionResult;
    private createMatchIfMutual;
}
//# sourceMappingURL=ConnectionDecisionService.d.ts.map