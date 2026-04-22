import type {
  MediaSessionToken,
  MiniRoom,
  MiniRoomEnded,
  MiniRoomInvite,
  MiniRoomInviteDecision,
  MiniRoomInviteDecisionStatus
} from "@datevibe/contracts";
import { LivekitHandoffService } from "../media/LivekitHandoffService";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface CreateInviteInput {
  roomId: string;
  senderUserId: string;
  senderSpotId: string;
  recipientUserId: string;
}

export class MiniRoomSpace {
  private readonly invites = new Map<string, MiniRoomInvite>();
  private readonly inviteDecisions = new Map<string, MiniRoomInviteDecision>();
  private readonly miniRoomsByInviteId = new Map<string, MiniRoom>();
  private readonly miniRoomsById = new Map<string, MiniRoom>();
  private readonly endedMiniRoomsById = new Map<string, MiniRoomEnded>();

  public constructor(private readonly livekitHandoffService: LivekitHandoffService) {}

  public createInvite(input: CreateInviteInput): MiniRoomInvite {
    const invite: MiniRoomInvite = {
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

  public getInvite(inviteId: string): MiniRoomInvite | undefined {
    return this.invites.get(inviteId);
  }

  public decideInvite(
    inviteId: string,
    status: MiniRoomInviteDecisionStatus
  ): MiniRoomInviteDecision | undefined {
    const invite = this.invites.get(inviteId);
    if (!invite) {
      return undefined;
    }

    const existingDecision = this.inviteDecisions.get(inviteId);
    if (existingDecision) {
      return existingDecision;
    }

    const decision: MiniRoomInviteDecision = {
      inviteId,
      senderUserId: invite.senderUserId,
      recipientUserId: invite.recipientUserId,
      status,
      decidedAt: new Date().toISOString()
    };

    this.inviteDecisions.set(inviteId, decision);
    return decision;
  }

  public createReadySession(
    inviteId: string,
    requestingUserId: string
  ): { miniRoom: MiniRoom; mediaSession: MediaSessionToken } | undefined {
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
      this.miniRoomsById.set(miniRoom.miniRoomId, miniRoom);
    }

    if (!miniRoom.participantUserIds.includes(requestingUserId)) {
      return undefined;
    }

    if (this.endedMiniRoomsById.has(miniRoom.miniRoomId)) {
      return undefined;
    }

    return {
      miniRoom,
      mediaSession: this.livekitHandoffService.issueToken(miniRoom, requestingUserId)
    };
  }

  public getMiniRoom(miniRoomId: string): MiniRoom | undefined {
    return this.miniRoomsById.get(miniRoomId);
  }

  public endMiniRoom(miniRoomId: string, endedByUserId: string): MiniRoomEnded | undefined {
    const miniRoom = this.miniRoomsById.get(miniRoomId);
    if (!miniRoom || !miniRoom.participantUserIds.includes(endedByUserId)) {
      return undefined;
    }

    const existingEnd = this.endedMiniRoomsById.get(miniRoomId);
    if (existingEnd) {
      return existingEnd;
    }

    const ended: MiniRoomEnded = {
      miniRoomId,
      lobbyRoomId: miniRoom.lobbyRoomId,
      participantUserIds: miniRoom.participantUserIds,
      endedByUserId,
      endedAt: new Date().toISOString()
    };

    this.endedMiniRoomsById.set(miniRoomId, ended);
    return ended;
  }
}
