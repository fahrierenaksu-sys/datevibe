import type WebSocket from "ws";
export interface RealtimeConnectionRecord {
    connectionId: string;
    userId: string;
    socket: WebSocket;
    roomId?: string;
}
export declare class ConnectionRegistry {
    private readonly connectionsById;
    private readonly connectionIdsByUserId;
    private readonly connectionIdsByRoomId;
    registerConnection(record: {
        connectionId: string;
        userId: string;
        socket: WebSocket;
    }): void;
    getSocket(connectionId: string): WebSocket | undefined;
    getConnectionRoom(connectionId: string): string | undefined;
    setConnectionRoom(connectionId: string, roomId: string | undefined): boolean;
    getConnectionIdsForUser(userId: string): string[];
    getConnectionIdsForRoom(roomId: string): string[];
    unregisterConnection(connectionId: string): boolean;
    private addConnectionToUser;
    private removeConnectionFromUser;
    private addConnectionToRoom;
    private removeConnectionFromRoom;
}
//# sourceMappingURL=ConnectionRegistry.d.ts.map