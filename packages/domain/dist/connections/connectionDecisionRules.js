"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTION_DECISION_DENIAL_REASONS = void 0;
exports.canRecordConnectionDecision = canRecordConnectionDecision;
exports.CONNECTION_DECISION_DENIAL_REASONS = [
    "actor_not_participant",
    "partner_not_participant",
    "partner_mismatch",
];
function canRecordConnectionDecision(params) {
    const { miniRoom, actorUserId, partnerUserId } = params;
    const participants = miniRoom.participantUserIds;
    if (!participants.includes(actorUserId)) {
        return { allowed: false, reason: "actor_not_participant" };
    }
    if (!participants.includes(partnerUserId)) {
        return { allowed: false, reason: "partner_not_participant" };
    }
    const expectedPartnerUserId = participants.find((userId) => userId !== actorUserId);
    if (expectedPartnerUserId !== partnerUserId) {
        return { allowed: false, reason: "partner_mismatch" };
    }
    return { allowed: true };
}
