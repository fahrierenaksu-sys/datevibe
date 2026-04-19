import type { ClientEvent, ServerEvent, UserProfile } from "@contracts"
import { MultiplayerCoreApp } from "@datevibe/multiplayer-core"
import { ConnectionRegistry } from "./ConnectionRegistry"

interface InviteParticipants {
  senderUserId: string
  recipientUserId: string
}

export interface HandleClientEventInput {
  connectionId: string
  actor: UserProfile
  event: ClientEvent
  emit: (connectionId: string, event: ServerEvent) => void
}

export class EventBridge {
  private readonly inviteParticipantsByInviteId = new Map<string, InviteParticipants>()

  public constructor(
    private readonly multiplayerCore: MultiplayerCoreApp,
    private readonly connectionRegistry: ConnectionRegistry
  ) {}

  public handleClientEvent(input: HandleClientEventInput): void {
    const serverEvents = this.multiplayerCore.handleClientEvent(input.actor, input.event)
    for (const serverEvent of serverEvents) {
      this.routeEvent(serverEvent, input)
    }
  }

  private routeEvent(serverEvent: ServerEvent, input: HandleClientEventInput): void {
    switch (serverEvent.type) {
      case "room.joined": {
        this.connectionRegistry.setConnectionRoom(input.connectionId, serverEvent.payload.roomId)
        input.emit(input.connectionId, serverEvent)
        return
      }
      case "room.left": {
        input.emit(input.connectionId, serverEvent)
        this.connectionRegistry.setConnectionRoom(input.connectionId, undefined)
        return
      }
      case "presence.snapshot": {
        this.emitToRoom(serverEvent.payload.roomId, serverEvent, input.emit)
        return
      }
      case "presence.nearby": {
        this.emitToUser(serverEvent.payload.userId, serverEvent, input.emit)
        return
      }
      case "mini_room.invite_received": {
        this.inviteParticipantsByInviteId.set(serverEvent.payload.inviteId, {
          senderUserId: serverEvent.payload.senderUserId,
          recipientUserId: serverEvent.payload.recipientUserId
        })
        this.emitToUser(serverEvent.payload.recipientUserId, serverEvent, input.emit)
        return
      }
      case "mini_room.invite_decided": {
        const participants = this.inviteParticipantsByInviteId.get(serverEvent.payload.inviteId)
        if (participants) {
          this.emitToUsers(
            [participants.senderUserId, participants.recipientUserId],
            serverEvent,
            input.emit
          )
          this.inviteParticipantsByInviteId.delete(serverEvent.payload.inviteId)
        } else {
          input.emit(input.connectionId, serverEvent)
        }
        return
      }
      case "mini_room.ready": {
        this.emitToUsers(serverEvent.payload.miniRoom.participantUserIds, serverEvent, input.emit)
        return
      }
      case "reaction.received": {
        this.emitToRoom(serverEvent.payload.roomId, serverEvent, input.emit)
        return
      }
      case "safety.user_blocked": {
        input.emit(input.connectionId, serverEvent)
        return
      }
      default: {
        const _exhaustive: never = serverEvent
        return _exhaustive
      }
    }
  }

  private emitToUser(
    userId: string,
    serverEvent: ServerEvent,
    emit: (connectionId: string, event: ServerEvent) => void
  ): void {
    const connectionIds = this.connectionRegistry.getConnectionIdsForUser(userId)
    for (const connectionId of connectionIds) {
      emit(connectionId, serverEvent)
    }
  }

  private emitToUsers(
    userIds: readonly string[],
    serverEvent: ServerEvent,
    emit: (connectionId: string, event: ServerEvent) => void
  ): void {
    const uniqueConnectionIds = new Set<string>()
    for (const userId of userIds) {
      const connectionIds = this.connectionRegistry.getConnectionIdsForUser(userId)
      for (const connectionId of connectionIds) {
        uniqueConnectionIds.add(connectionId)
      }
    }
    for (const connectionId of uniqueConnectionIds) {
      emit(connectionId, serverEvent)
    }
  }

  private emitToRoom(
    roomId: string,
    serverEvent: ServerEvent,
    emit: (connectionId: string, event: ServerEvent) => void
  ): void {
    const connectionIds = this.connectionRegistry.getConnectionIdsForRoom(roomId)
    for (const connectionId of connectionIds) {
      emit(connectionId, serverEvent)
    }
  }
}
