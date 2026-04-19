import type { JoinRoomResponse } from "../rooms/JoinRoom";
import type { RoomPresenceSnapshot } from "../presence/RoomPresenceSnapshot";
import type { NearbyUser } from "../presence/NearbyUser";
import type { MiniRoomInvite } from "../miniRooms/MiniRoomInvite";
import type { MiniRoomInviteDecision } from "../miniRooms/MiniRoomInviteDecision";
import type { MiniRoom } from "../miniRooms/MiniRoom";
import type { MediaSessionToken } from "../miniRooms/MediaSessionToken";
import type { ReactionEvent } from "../reactions/ReactionEvent";

export type ServerEvent =
  | { type: "room.joined"; payload: JoinRoomResponse }
  | { type: "room.left"; payload: { roomId: string } }
  | { type: "presence.snapshot"; payload: RoomPresenceSnapshot }
  | {
      type: "presence.nearby";
      payload: {
        roomId: string;
        userId: string;
        nearbyUsers: NearbyUser[];
      };
    }
  | { type: "mini_room.invite_received"; payload: MiniRoomInvite }
  | { type: "mini_room.invite_decided"; payload: MiniRoomInviteDecision }
  | {
      type: "mini_room.ready";
      payload: {
        miniRoom: MiniRoom;
        mediaSession: MediaSessionToken;
      };
    }
  | { type: "reaction.received"; payload: ReactionEvent }
  | { type: "safety.user_blocked"; payload: { blockedUserId: string } };
