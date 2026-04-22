"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionRegistry = void 0;
class ConnectionRegistry {
    connectionsById = new Map();
    connectionIdsByUserId = new Map();
    connectionIdsByRoomId = new Map();
    registerConnection(record) {
        const nextRecord = {
            connectionId: record.connectionId,
            userId: record.userId,
            socket: record.socket
        };
        this.connectionsById.set(record.connectionId, nextRecord);
        this.addConnectionToUser(record.userId, record.connectionId);
    }
    getSocket(connectionId) {
        return this.connectionsById.get(connectionId)?.socket;
    }
    getConnectionRoom(connectionId) {
        return this.connectionsById.get(connectionId)?.roomId;
    }
    setConnectionRoom(connectionId, roomId) {
        const connection = this.connectionsById.get(connectionId);
        if (!connection) {
            return false;
        }
        if (connection.roomId) {
            this.removeConnectionFromRoom(connection.roomId, connectionId);
        }
        connection.roomId = roomId;
        if (roomId) {
            this.addConnectionToRoom(roomId, connectionId);
        }
        return true;
    }
    getConnectionIdsForUser(userId) {
        return [...(this.connectionIdsByUserId.get(userId) ?? [])];
    }
    getConnectionIdsForRoom(roomId) {
        return [...(this.connectionIdsByRoomId.get(roomId) ?? [])];
    }
    unregisterConnection(connectionId) {
        const existing = this.connectionsById.get(connectionId);
        if (!existing) {
            return false;
        }
        this.connectionsById.delete(connectionId);
        this.removeConnectionFromUser(existing.userId, connectionId);
        if (existing.roomId) {
            this.removeConnectionFromRoom(existing.roomId, connectionId);
        }
        return true;
    }
    addConnectionToUser(userId, connectionId) {
        const existingIds = this.connectionIdsByUserId.get(userId) ?? new Set();
        existingIds.add(connectionId);
        this.connectionIdsByUserId.set(userId, existingIds);
    }
    removeConnectionFromUser(userId, connectionId) {
        const existingIds = this.connectionIdsByUserId.get(userId);
        if (!existingIds) {
            return;
        }
        existingIds.delete(connectionId);
        if (existingIds.size === 0) {
            this.connectionIdsByUserId.delete(userId);
        }
    }
    addConnectionToRoom(roomId, connectionId) {
        const existingIds = this.connectionIdsByRoomId.get(roomId) ?? new Set();
        existingIds.add(connectionId);
        this.connectionIdsByRoomId.set(roomId, existingIds);
    }
    removeConnectionFromRoom(roomId, connectionId) {
        const existingIds = this.connectionIdsByRoomId.get(roomId);
        if (!existingIds) {
            return;
        }
        existingIds.delete(connectionId);
        if (existingIds.size === 0) {
            this.connectionIdsByRoomId.delete(roomId);
        }
    }
}
exports.ConnectionRegistry = ConnectionRegistry;
