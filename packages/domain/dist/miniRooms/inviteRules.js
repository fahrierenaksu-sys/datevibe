"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INVITE_DENIAL_REASONS = void 0;
exports.canInviteUser = canInviteUser;
exports.INVITE_DENIAL_REASONS = [
    "self",
    "not_nearby",
    "blocked",
    "sender_busy",
    "recipient_busy",
];
function canInviteUser(params) {
    const { senderUserId, recipientUserId, nearbyUsers, senderInMiniRoom, recipientInMiniRoom, } = params;
    if (senderUserId === recipientUserId) {
        return { allowed: false, reason: "self" };
    }
    if (senderInMiniRoom) {
        return { allowed: false, reason: "sender_busy" };
    }
    if (recipientInMiniRoom) {
        return { allowed: false, reason: "recipient_busy" };
    }
    const nearbyUser = nearbyUsers.find((user) => user.userId === recipientUserId);
    if (!nearbyUser) {
        return { allowed: false, reason: "not_nearby" };
    }
    if (nearbyUser.blocked) {
        return { allowed: false, reason: "blocked" };
    }
    if (!nearbyUser.canInvite) {
        return { allowed: false, reason: "not_nearby" };
    }
    return { allowed: true };
}
