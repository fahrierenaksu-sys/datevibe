"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyRoom = void 0;
const domain_1 = require("@datevibe/domain");
function nowIso() {
    return new Date().toISOString();
}
class LobbyRoom {
    roomLayout;
    users = new Map();
    constructor(roomLayout) {
        this.roomLayout = roomLayout;
    }
    getLayout() {
        return this.roomLayout;
    }
    hasUser(userId) {
        return this.users.has(userId);
    }
    getUser(userId) {
        return this.users.get(userId);
    }
    getUsers() {
        return Array.from(this.users.values());
    }
    join(identity, initialSpotId) {
        const existing = this.users.get(identity.userId);
        if (existing) {
            return {
                roomId: this.roomLayout.roomId,
                currentUserId: identity.userId,
                assignedSpotId: existing.spotId,
                layout: this.roomLayout,
                snapshot: this.snapshot()
            };
        }
        const assignedSpotId = (initialSpotId &&
            (0, domain_1.canOccupySpot)(this.roomLayout, this.getUsers(), initialSpotId, identity.userId) &&
            initialSpotId) ||
            (0, domain_1.getFirstAvailableSpot)(this.roomLayout, this.getUsers());
        if (!assignedSpotId) {
            throw new Error("No available spot in lobby");
        }
        this.users.set(identity.userId, {
            userId: identity.userId,
            displayName: identity.displayName,
            avatar: identity.avatar,
            spotId: assignedSpotId,
            inMiniRoom: false
        });
        return {
            roomId: this.roomLayout.roomId,
            currentUserId: identity.userId,
            assignedSpotId,
            layout: this.roomLayout,
            snapshot: this.snapshot()
        };
    }
    joinFromProfile(profile, initialSpotId) {
        return this.join({
            userId: profile.userId,
            displayName: profile.displayName,
            avatar: profile.avatar
        }, initialSpotId);
    }
    leave(userId) {
        return this.users.delete(userId);
    }
    moveToSpot(userId, spotId) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        if (user.inMiniRoom) {
            return false;
        }
        if (!(0, domain_1.canOccupySpot)(this.roomLayout, this.getUsers(), spotId, userId)) {
            return false;
        }
        this.users.set(userId, { ...user, spotId });
        return true;
    }
    setInMiniRoom(userId, inMiniRoom) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        this.users.set(userId, { ...user, inMiniRoom });
        return true;
    }
    snapshot() {
        return {
            roomId: this.roomLayout.roomId,
            users: this.getUsers(),
            updatedAt: nowIso()
        };
    }
}
exports.LobbyRoom = LobbyRoom;
