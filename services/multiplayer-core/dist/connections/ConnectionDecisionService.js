"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionDecisionService = void 0;
function decisionKey(miniRoomId, actorUserId) {
    return `${miniRoomId}:${actorUserId}`;
}
class ConnectionDecisionService {
    decisionsByKey = new Map();
    matchedMiniRoomIds = new Set();
    recordDecision(input) {
        const existingDecision = this.decisionsByKey.get(decisionKey(input.miniRoom.miniRoomId, input.actorUserId));
        if (this.matchedMiniRoomIds.has(input.miniRoom.miniRoomId) && existingDecision) {
            return { decision: existingDecision };
        }
        const decision = {
            miniRoomId: input.miniRoom.miniRoomId,
            actorUserId: input.actorUserId,
            partnerUserId: input.partnerUserId,
            status: input.status,
            decidedAt: new Date().toISOString(),
        };
        this.decisionsByKey.set(decisionKey(decision.miniRoomId, decision.actorUserId), decision);
        const match = this.createMatchIfMutual(input.miniRoom);
        return match ? { decision, match } : { decision };
    }
    createMatchIfMutual(miniRoom) {
        if (this.matchedMiniRoomIds.has(miniRoom.miniRoomId)) {
            return undefined;
        }
        const [firstUserId, secondUserId] = miniRoom.participantUserIds;
        const firstDecision = this.decisionsByKey.get(decisionKey(miniRoom.miniRoomId, firstUserId));
        const secondDecision = this.decisionsByKey.get(decisionKey(miniRoom.miniRoomId, secondUserId));
        if (firstDecision?.status !== "saved" || secondDecision?.status !== "saved") {
            return undefined;
        }
        this.matchedMiniRoomIds.add(miniRoom.miniRoomId);
        return {
            miniRoomId: miniRoom.miniRoomId,
            participantUserIds: miniRoom.participantUserIds,
            matchedAt: new Date().toISOString(),
        };
    }
}
exports.ConnectionDecisionService = ConnectionDecisionService;
