import type WebSocket from "ws"

export interface RealtimeConnectionRecord {
  connectionId: string
  userId: string
  socket: WebSocket
  roomId?: string
}

export class ConnectionRegistry {
  private readonly connectionsById = new Map<string, RealtimeConnectionRecord>()
  private readonly connectionIdsByUserId = new Map<string, Set<string>>()
  private readonly connectionIdsByRoomId = new Map<string, Set<string>>()

  public registerConnection(record: {
    connectionId: string
    userId: string
    socket: WebSocket
  }): void {
    const nextRecord: RealtimeConnectionRecord = {
      connectionId: record.connectionId,
      userId: record.userId,
      socket: record.socket
    }
    this.connectionsById.set(record.connectionId, nextRecord)
    this.addConnectionToUser(record.userId, record.connectionId)
  }

  public getSocket(connectionId: string): WebSocket | undefined {
    return this.connectionsById.get(connectionId)?.socket
  }

  public getConnectionRoom(connectionId: string): string | undefined {
    return this.connectionsById.get(connectionId)?.roomId
  }

  public setConnectionRoom(connectionId: string, roomId: string | undefined): boolean {
    const connection = this.connectionsById.get(connectionId)
    if (!connection) {
      return false
    }

    if (connection.roomId) {
      this.removeConnectionFromRoom(connection.roomId, connectionId)
    }

    connection.roomId = roomId
    if (roomId) {
      this.addConnectionToRoom(roomId, connectionId)
    }

    return true
  }

  public getConnectionIdsForUser(userId: string): string[] {
    return [...(this.connectionIdsByUserId.get(userId) ?? [])]
  }

  public getConnectionIdsForRoom(roomId: string): string[] {
    return [...(this.connectionIdsByRoomId.get(roomId) ?? [])]
  }

  public unregisterConnection(connectionId: string): boolean {
    const existing = this.connectionsById.get(connectionId)
    if (!existing) {
      return false
    }

    this.connectionsById.delete(connectionId)
    this.removeConnectionFromUser(existing.userId, connectionId)
    if (existing.roomId) {
      this.removeConnectionFromRoom(existing.roomId, connectionId)
    }
    return true
  }

  private addConnectionToUser(userId: string, connectionId: string): void {
    const existingIds = this.connectionIdsByUserId.get(userId) ?? new Set<string>()
    existingIds.add(connectionId)
    this.connectionIdsByUserId.set(userId, existingIds)
  }

  private removeConnectionFromUser(userId: string, connectionId: string): void {
    const existingIds = this.connectionIdsByUserId.get(userId)
    if (!existingIds) {
      return
    }
    existingIds.delete(connectionId)
    if (existingIds.size === 0) {
      this.connectionIdsByUserId.delete(userId)
    }
  }

  private addConnectionToRoom(roomId: string, connectionId: string): void {
    const existingIds = this.connectionIdsByRoomId.get(roomId) ?? new Set<string>()
    existingIds.add(connectionId)
    this.connectionIdsByRoomId.set(roomId, existingIds)
  }

  private removeConnectionFromRoom(roomId: string, connectionId: string): void {
    const existingIds = this.connectionIdsByRoomId.get(roomId)
    if (!existingIds) {
      return
    }
    existingIds.delete(connectionId)
    if (existingIds.size === 0) {
      this.connectionIdsByRoomId.delete(roomId)
    }
  }
}
