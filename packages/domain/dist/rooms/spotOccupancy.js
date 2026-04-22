"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSpotOccupied = isSpotOccupied;
exports.canOccupySpot = canOccupySpot;
exports.getFirstAvailableSpot = getFirstAvailableSpot;
function hasSpot(layout, spotId) {
    return layout.spots.some((spot) => spot.spotId === spotId);
}
function isSpotOccupied(users, spotId, excludeUserId) {
    return users.some((user) => user.spotId === spotId && user.userId !== excludeUserId);
}
function canOccupySpot(layout, users, spotId, userId) {
    return hasSpot(layout, spotId) && !isSpotOccupied(users, spotId, userId);
}
function getFirstAvailableSpot(layout, users) {
    return layout.spots.find((spot) => !isSpotOccupied(users, spot.spotId))?.spotId;
}
