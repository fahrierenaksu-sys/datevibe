import type {
  ClientEvent,
  ReactionEvent,
  ServerEvent,
  UserProfile,
} from "@datevibe/contracts";
import { canInviteUser } from "@datevibe/domain";
import { LobbyRoom } from "./lobby/LobbyRoom";
import { PUBLIC_LOBBY_LAYOUT } from "./lobby/layouts/publicLobby";
import { SpotProximityService } from "./proximity/SpotProximityService";
import { SafetyService } from "./safety/SafetyService";
import { LivekitHandoffService } from "./media/LivekitHandoffService";
import { MiniRoomSpace } from "./miniRooms/MiniRoomSpace";

export class MultiplayerCoreApp {
  private readonly lobbyRoom = new LobbyRoom(PUBLIC_LOBBY_LAYOUT);
  private readonly safetyService = new SafetyService();
  private readonly proximityService = new SpotProximityService(this.safetyService);
  private readonly miniRoomSpace = new MiniRoomSpace(new LivekitHandoffService());

  public handleClientEvent(actor: UserProfile, event: ClientEvent): ServerEvent[] {
    switch (event.type) {
      case "room.join": {
        if (event.payload.roomId !== this.lobbyRoom.getLayout().roomId) {
          return [];
        }
        let joined: ReturnType<LobbyRoom["joinFromProfile"]>;
        try {
          joined = this.lobbyRoom.joinFromProfile(actor, event.payload.initialSpotId);
        } catch {
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

        const nearbyUsers = this.proximityService.listNearbyUsers(
          this.lobbyRoom.getLayout(),
          this.lobbyRoom.getUsers(),
          sender.userId
        );

        const eligibility = canInviteUser({
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

        if (
          (event.payload.status === "accepted" || event.payload.status === "declined") &&
          actor.userId !== invite.recipientUserId
        ) {
          return [];
        }

        const decision = this.miniRoomSpace.decideInvite(
          event.payload.inviteId,
          event.payload.status
        );
        if (!decision) {
          return [];
        }

        const events: ServerEvent[] = [{ type: "mini_room.invite_decided", payload: decision }];

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

        const reactionEvent: ReactionEvent = {
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
        const _exhaustive: never = event;
        return _exhaustive;
      }
    }
  }

  public getLobbySnapshot(): ServerEvent {
    return { type: "presence.snapshot", payload: this.lobbyRoom.snapshot() };
  }

  private createNearbyEvent(userId: string): ServerEvent {
    return {
      type: "presence.nearby",
      payload: {
        roomId: this.lobbyRoom.getLayout().roomId,
        userId,
        nearbyUsers: this.proximityService.listNearbyUsers(
          this.lobbyRoom.getLayout(),
          this.lobbyRoom.getUsers(),
          userId
        )
      }
    };
  }

  private createNearbyEventsForAllUsers(): ServerEvent[] {
    return this.lobbyRoom.getUsers().map((user) => this.createNearbyEvent(user.userId));
  }
}
