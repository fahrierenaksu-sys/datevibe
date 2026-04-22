import type {
  AvatarSelection,
  JoinRoomResponse,
  PresenceUser,
  RoomLayout,
  RoomPresenceSnapshot,
  UserProfile
} from "@datevibe/contracts";
import {
  canOccupySpot,
  getFirstAvailableSpot,
} from "@datevibe/domain";

function nowIso(): string {
  return new Date().toISOString();
}

export interface LobbyJoinIdentity {
  userId: string;
  displayName: string;
  avatar: AvatarSelection;
}

export class LobbyRoom {
  private readonly users = new Map<string, PresenceUser>();

  public constructor(private readonly roomLayout: RoomLayout) {}

  public getLayout(): RoomLayout {
    return this.roomLayout;
  }

  public hasUser(userId: string): boolean {
    return this.users.has(userId);
  }

  public getUser(userId: string): PresenceUser | undefined {
    return this.users.get(userId);
  }

  public getUsers(): PresenceUser[] {
    return Array.from(this.users.values());
  }

  public join(identity: LobbyJoinIdentity, initialSpotId?: string): JoinRoomResponse {
    const existing = this.users.get(identity.userId);

    if (existing) {
      return {
        roomId: this.roomLayout.roomId,
        currentUserId: identity.userId,
        assignedSpotId: existing.spotId,
        layout: this.roomLayout,
        snapshot: this.snapshot()
      };
    }

    const assignedSpotId =
      (initialSpotId &&
        canOccupySpot(this.roomLayout, this.getUsers(), initialSpotId, identity.userId) &&
        initialSpotId) ||
      getFirstAvailableSpot(this.roomLayout, this.getUsers());

    if (!assignedSpotId) {
      throw new Error("No available spot in lobby");
    }

    this.users.set(identity.userId, {
      userId: identity.userId,
      displayName: identity.displayName,
      avatar: identity.avatar,
      spotId: assignedSpotId,
      inMiniRoom: false
    });

    return {
      roomId: this.roomLayout.roomId,
      currentUserId: identity.userId,
      assignedSpotId,
      layout: this.roomLayout,
      snapshot: this.snapshot()
    };
  }

  public joinFromProfile(profile: UserProfile, initialSpotId?: string): JoinRoomResponse {
    return this.join(
      {
        userId: profile.userId,
        displayName: profile.displayName,
        avatar: profile.avatar
      },
      initialSpotId
    );
  }

  public leave(userId: string): boolean {
    return this.users.delete(userId);
  }

  public moveToSpot(userId: string, spotId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }

    if (user.inMiniRoom) {
      return false;
    }

    if (!canOccupySpot(this.roomLayout, this.getUsers(), spotId, userId)) {
      return false;
    }

    this.users.set(userId, { ...user, spotId });
    return true;
  }

  public setInMiniRoom(userId: string, inMiniRoom: boolean): boolean {
    const user = this.users.get(userId);
    if (!user) {
      return false;
    }
    this.users.set(userId, { ...user, inMiniRoom });
    return true;
  }

  public snapshot(): RoomPresenceSnapshot {
    return {
      roomId: this.roomLayout.roomId,
      users: this.getUsers(),
      updatedAt: nowIso()
    };
  }
}
