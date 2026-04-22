"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBridge = void 0;
class EventBridge {
    multiplayerCore;
    connectionRegistry;
    inviteParticipantsByInviteId = new Map();
    constructor(multiplayerCore, connectionRegistry) {
        this.multiplayerCore = multiplayerCore;
        this.connectionRegistry = connectionRegistry;
    }
    handleClientEvent(input) {
        const serverEvents = this.multiplayerCore.handleClientEvent(input.actor, input.event);
        for (const serverEvent of serverEvents) {
            this.routeEvent(serverEvent, input);
        }
    }
    routeEvent(serverEvent, input) {
        switch (serverEvent.type) {
            case "room.joined": {
                this.connectionRegistry.setConnectionRoom(input.connectionId, serverEvent.payload.roomId);
                input.emit(input.connectionId, serverEvent);
                return;
            }
            case "room.left": {
                input.emit(input.connectionId, serverEvent);
                this.connectionRegistry.setConnectionRoom(input.connectionId, undefined);
                return;
            }
            case "presence.snapshot": {
                this.emitToRoom(serverEvent.payload.roomId, serverEvent, input.emit);
                return;
            }
            case "presence.nearby": {
                this.emitToUser(serverEvent.payload.userId, serverEvent, input.emit);
                return;
            }
            case "mini_room.invite_received": {
                this.inviteParticipantsByInviteId.set(serverEvent.payload.inviteId, {
                    senderUserId: serverEvent.payload.senderUserId,
                    recipientUserId: serverEvent.payload.recipientUserId
                });
                this.emitToUser(serverEvent.payload.recipientUserId, serverEvent, input.emit);
                return;
            }
            case "mini_room.invite_decided": {
                this.emitToUsers([serverEvent.payload.senderUserId, serverEvent.payload.recipientUserId], serverEvent, input.emit);
                this.inviteParticipantsByInviteId.delete(serverEvent.payload.inviteId);
                return;
            }
            case "mini_room.ready": {
                this.emitToUsers(serverEvent.payload.miniRoom.participantUserIds, serverEvent, input.emit);
                return;
            }
            case "mini_room.ended": {
                this.emitToUsers(serverEvent.payload.participantUserIds, serverEvent, input.emit);
                return;
            }
            case "connection.decision_recorded": {
                this.emitToUser(serverEvent.payload.actorUserId, serverEvent, input.emit);
                return;
            }
            case "connection.matched": {
                this.emitToUsers(serverEvent.payload.participantUserIds, serverEvent, input.emit);
                return;
            }
            case "chat.thread_created": {
                this.emitToUsers(serverEvent.payload.participantUserIds, serverEvent, input.emit);
                return;
            }
            case "chat.thread_listed": {
                this.emitToUser(serverEvent.payload.userId, serverEvent, input.emit);
                return;
            }
            case "chat.message_listed": {
                this.emitToUser(serverEvent.payload.userId, serverEvent, input.emit);
                return;
            }
            case "chat.message_received": {
                const thread = this.multiplayerCore.getChatThread(serverEvent.payload.threadId);
                if (thread) {
                    this.emitToUsers(thread.participantUserIds, serverEvent, input.emit);
                }
                return;
            }
            case "reaction.received": {
                this.emitToRoom(serverEvent.payload.roomId, serverEvent, input.emit);
                return;
            }
            case "safety.user_blocked": {
                input.emit(input.connectionId, serverEvent);
                return;
            }
            default: {
                const _exhaustive = serverEvent;
                return _exhaustive;
            }
        }
    }
    emitToUser(userId, serverEvent, emit) {
        const connectionIds = this.connectionRegistry.getConnectionIdsForUser(userId);
        for (const connectionId of connectionIds) {
            emit(connectionId, serverEvent);
        }
    }
    emitToUsers(userIds, serverEvent, emit) {
        const uniqueConnectionIds = new Set();
        for (const userId of userIds) {
            const connectionIds = this.connectionRegistry.getConnectionIdsForUser(userId);
            for (const connectionId of connectionIds) {
                uniqueConnectionIds.add(connectionId);
            }
        }
        for (const connectionId of uniqueConnectionIds) {
            emit(connectionId, serverEvent);
        }
    }
    emitToRoom(roomId, serverEvent, emit) {
        const connectionIds = this.connectionRegistry.getConnectionIdsForRoom(roomId);
        for (const connectionId of connectionIds) {
            emit(connectionId, serverEvent);
        }
    }
}
exports.EventBridge = EventBridge;
