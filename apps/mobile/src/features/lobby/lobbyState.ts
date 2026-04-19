import type { NearbyUser, RoomPresenceSnapshot } from "@datevibe/contracts"
import type { ServerEvent } from "@datevibe/realtime-client"
import { PUBLIC_LOBBY_ROOM_ID } from "./publicLobby"

export interface LobbyState {
  roomId: string
  isJoined: boolean
  currentUserId?: string
  assignedSpotId?: string
  snapshot: RoomPresenceSnapshot | null
  nearbyUsers: NearbyUser[]
}

export function createInitialLobbyState(roomId = PUBLIC_LOBBY_ROOM_ID): LobbyState {
  return {
    roomId,
    isJoined: false,
    currentUserId: undefined,
    assignedSpotId: undefined,
    snapshot: null,
    nearbyUsers: []
  }
}

export function applyServerEventToLobbyState(
  state: LobbyState,
  event: ServerEvent,
  actorUserId: string
): LobbyState {
  switch (event.type) {
    case "room.joined": {
      return {
        ...state,
        roomId: event.payload.roomId,
        isJoined: true,
        currentUserId: event.payload.currentUserId,
        assignedSpotId: event.payload.assignedSpotId
      }
    }
    case "room.left": {
      return {
        ...state,
        roomId: event.payload.roomId,
        isJoined: false,
        currentUserId: undefined,
        assignedSpotId: undefined,
        nearbyUsers: []
      }
    }
    case "presence.snapshot": {
      if (event.payload.roomId !== state.roomId) {
        return state
      }
      return {
        ...state,
        snapshot: event.payload
      }
    }
    case "presence.nearby": {
      if (event.payload.userId !== actorUserId) {
        return state
      }
      return {
        ...state,
        nearbyUsers: event.payload.nearbyUsers
      }
    }
    default:
      return state
  }
}
