"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiplayerCoreApp = void 0;
const domain_1 = require("@datevibe/domain");
const LobbyRoom_1 = require("./lobby/LobbyRoom");
const publicLobby_1 = require("./lobby/layouts/publicLobby");
const SpotProximityService_1 = require("./proximity/SpotProximityService");
const SafetyService_1 = require("./safety/SafetyService");
const LivekitHandoffService_1 = require("./media/LivekitHandoffService");
const MiniRoomSpace_1 = require("./miniRooms/MiniRoomSpace");
class MultiplayerCoreApp {
    lobbyRoom = new LobbyRoom_1.LobbyRoom(publicLobby_1.PUBLIC_LOBBY_LAYOUT);
    safetyService = new SafetyService_1.SafetyService();
    proximityService = new SpotProximityService_1.SpotProximityService(this.safetyService);
    miniRoomSpace = new MiniRoomSpace_1.MiniRoomSpace(new LivekitHandoffService_1.LivekitHandoffService());
    handleClientEvent(actor, event) {
        switch (event.type) {
            case "room.join": {
                if (event.payload.roomId !== this.lobbyRoom.getLayout().roomId) {
                    return [];
                }
                let joined;
                try {
                    joined = this.lobbyRoom.joinFromProfile(actor, event.payload.initialSpotId);
                }
                catch {
                    return [];
                }
                return [
                    { type: "room.joined", payload: joined },
                    { type: "presence.snapshot", payload: this.lobbyRoom.snapshot() },
                    ...this.createNearbyEventsForAllUsers()
                ];
            }
            case "room.leave": {
                if (event.payload.roomId !== this.lobbyRoom.getLayout().roomId) {
                    return [];
                }
                this.lobbyRoom.leave(actor.userId);
                return [
                    { type: "room.left", payload: { roomId: event.payload.roomId } },
                    { type: "presence.snapshot", payload: this.lobbyRoom.snapshot() },
                    ...this.createNearbyEventsForAllUsers()
                ];
            }
            case "presence.move_to_spot": {
                if (event.payload.roomId !== this.lobbyRoom.getLayout().roomId) {
                    return [];
                }
                const moved = this.lobbyRoom.moveToSpot(actor.userId, event.payload.spotId);
                if (!moved) {
                    return [];
                }
                return [
                    { type: "presence.snapshot", payload: this.lobbyRoom.snapshot() },
                    ...this.createNearbyEventsForAllUsers()
                ];
            }
            case "mini_room.invite": {
                if (event.payload.roomId !== this.lobbyRoom.getLayout().roomId) {
                    return [];
                }
                const sender = this.lobbyRoom.getUser(actor.userId);
                const recipient = this.lobbyRoom.getUser(event.payload.recipientUserId);
                if (!sender || !recipient) {
                    return [];
                }
                const nearbyUsers = this.proximityService.listNearbyUsers(this.lobbyRoom.getLayout(), this.lobbyRoom.getUsers(), sender.userId);
                const eligibility = (0, domain_1.canInviteUser)({
                    senderUserId: sender.userId,
                    recipientUserId: recipient.userId,
                    nearbyUsers,
                    senderInMiniRoom: sender.inMiniRoom,
                    recipientInMiniRoom: recipient.inMiniRoom
                });
                if (!eligibility.allowed) {
                    return [];
                }
                const invite = this.miniRoomSpace.createInvite({
                    roomId: event.payload.roomId,
                    senderUserId: sender.userId,
                    senderSpotId: sender.spotId,
                    recipientUserId: recipient.userId
                });
                return [{ type: "mini_room.invite_received", payload: invite }];
            }
            case "mini_room.invite_decision": {
                const invite = this.miniRoomSpace.getInvite(event.payload.inviteId);
                if (!invite) {
                    return [];
                }
                if ((event.payload.status === "accepted" || event.payload.status === "declined") &&
                    actor.userId !== invite.recipientUserId) {
                    return [];
                }
                const decision = this.miniRoomSpace.decideInvite(event.payload.inviteId, event.payload.status);
                if (!decision) {
                    return [];
                }
                const events = [{ type: "mini_room.invite_decided", payload: decision }];
                if (decision.status === "accepted") {
                    const ready = this.miniRoomSpace.createReadySession(event.payload.inviteId, actor.userId);
                    if (ready) {
                        const participants = ready.miniRoom.participantUserIds;
                        this.lobbyRoom.setInMiniRoom(participants[0], true);
                        this.lobbyRoom.setInMiniRoom(participants[1], true);
                        events.push({
                            type: "mini_room.ready",
                            payload: {
                                miniRoom: ready.miniRoom,
                                mediaSession: ready.mediaSession
                            }
                        });
                        events.push({ type: "presence.snapshot", payload: this.lobbyRoom.snapshot() });
                        events.push(...this.createNearbyEventsForAllUsers());
                    }
                }
                return events;
            }
            case "reaction.send": {
                if (event.payload.roomId !== this.lobbyRoom.getLayout().roomId) {
                    return [];
                }
                if (!this.lobbyRoom.hasUser(actor.userId)) {
                    return [];
                }
                if (event.payload.targetUserId) {
                    if (!this.lobbyRoom.hasUser(event.payload.targetUserId)) {
                        return [];
                    }
                    if (this.safetyService.isBlocked(actor.userId, event.payload.targetUserId)) {
                        return [];
                    }
                }
                const reactionEvent = {
                    roomId: event.payload.roomId,
                    actorUserId: actor.userId,
                    targetUserId: event.payload.targetUserId,
                    reaction: event.payload.reaction,
                    createdAt: new Date().toISOString()
                };
                return [{ type: "reaction.received", payload: reactionEvent }];
            }
            case "safety.block": {
                const blocked = this.safetyService.block(actor.userId, event.payload.blockedUserId);
                if (!blocked) {
                    return [];
                }
                return [{ type: "safety.user_blocked", payload: { blockedUserId: event.payload.blockedUserId } }];
            }
            case "safety.report": {
                this.safetyService.report({
                    actorUserId: actor.userId,
                    reportedUserId: event.payload.reportedUserId,
                    reason: event.payload.reason,
                    note: event.payload.note
                });
                return [];
            }
            default: {
                const _exhaustive = event;
                return _exhaustive;
            }
        }
    }
    getLobbySnapshot() {
        return { type: "presence.snapshot", payload: this.lobbyRoom.snapshot() };
    }
    createNearbyEvent(userId) {
        return {
            type: "presence.nearby",
            payload: {
                roomId: this.lobbyRoom.getLayout().roomId,
                userId,
                nearbyUsers: this.proximityService.listNearbyUsers(this.lobbyRoom.getLayout(), this.lobbyRoom.getUsers(), userId)
            }
        };
    }
    createNearbyEventsForAllUsers() {
        return this.lobbyRoom.getUsers().map((user) => this.createNearbyEvent(user.userId));
    }
}
exports.MultiplayerCoreApp = MultiplayerCoreApp;
