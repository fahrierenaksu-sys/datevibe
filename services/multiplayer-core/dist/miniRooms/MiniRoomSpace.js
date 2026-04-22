"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniRoomSpace = void 0;
function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
class MiniRoomSpace {
    livekitHandoffService;
    invites = new Map();
    inviteDecisions = new Map();
    miniRoomsByInviteId = new Map();
    constructor(livekitHandoffService) {
        this.livekitHandoffService = livekitHandoffService;
    }
    createInvite(input) {
        const invite = {
            inviteId: createId("invite"),
            roomId: input.roomId,
            senderUserId: input.senderUserId,
            recipientUserId: input.recipientUserId,
            senderSpotId: input.senderSpotId,
            createdAt: new Date().toISOString()
        };
        this.invites.set(invite.inviteId, invite);
        return invite;
    }
    getInvite(inviteId) {
        return this.invites.get(inviteId);
    }
    decideInvite(inviteId, status) {
        const invite = this.invites.get(inviteId);
        if (!invite) {
            return undefined;
        }
        const existingDecision = this.inviteDecisions.get(inviteId);
        if (existingDecision) {
            return existingDecision;
        }
        const decision = {
            inviteId,
            status,
            decidedAt: new Date().toISOString()
        };
        this.inviteDecisions.set(inviteId, decision);
        return decision;
    }
    createReadySession(inviteId, requestingUserId) {
        const invite = this.invites.get(inviteId);
        const decision = this.inviteDecisions.get(inviteId);
        if (!invite || !decision || decision.status !== "accepted") {
            return undefined;
        }
        let miniRoom = this.miniRoomsByInviteId.get(inviteId);
        if (!miniRoom) {
            miniRoom = {
                miniRoomId: createId("mini_room"),
                lobbyRoomId: invite.roomId,
                participantUserIds: [invite.senderUserId, invite.recipientUserId],
                livekitRoomName: createId("livekit_room")
            };
            this.miniRoomsByInviteId.set(inviteId, miniRoom);
        }
        if (!miniRoom.participantUserIds.includes(requestingUserId)) {
            return undefined;
        }
        return {
            miniRoom,
            mediaSession: this.livekitHandoffService.issueToken(miniRoom, requestingUserId)
        };
    }
}
exports.MiniRoomSpace = MiniRoomSpace;
