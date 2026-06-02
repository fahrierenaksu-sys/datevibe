"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNearbyUsers = getNearbyUsers;
function getSpot(layout, spotId) {
    return layout.spots.find((spot) => spot.spotId === spotId);
}
function getDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
function getNearbyUsers(layout, users, currentUserId, blockedInteractionUserIds = []) {
    const currentUser = users.find((user) => user.userId === currentUserId);
    if (!currentUser) {
        return [];
    }
    const currentSpot = getSpot(layout, currentUser.spotId);
    if (!currentSpot) {
        return [];
    }
    return users
        .filter((user) => user.userId !== currentUserId)
        .map((user) => {
        const otherSpot = getSpot(layout, user.spotId);
        if (!otherSpot) {
            return undefined;
        }
        const distance = getDistance(currentSpot, otherSpot);
        const blocked = blockedInteractionUserIds.includes(user.userId);
        return {
            userId: user.userId,
            spotId: user.spotId,
            distance,
            blocked,
            canInvite: !blocked && !user.inMiniRoom && distance <= layout.proximityRadius,
        };
    })
        .filter((user) => user !== undefined)
        .filter((user) => user.distance <= layout.proximityRadius);
}
