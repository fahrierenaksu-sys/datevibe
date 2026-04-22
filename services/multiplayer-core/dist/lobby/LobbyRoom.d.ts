import type { AvatarSelection, JoinRoomResponse, PresenceUser, RoomLayout, RoomPresenceSnapshot, UserProfile } from "@datevibe/contracts";
export interface LobbyJoinIdentity {
    userId: string;
    displayName: string;
    avatar: AvatarSelection;
}
export declare class LobbyRoom {
    private readonly roomLayout;
    private readonly users;
    constructor(roomLayout: RoomLayout);
    getLayout(): RoomLayout;
    hasUser(userId: string): boolean;
    getUser(userId: string): PresenceUser | undefined;
    getUsers(): PresenceUser[];
    join(identity: LobbyJoinIdentity, initialSpotId?: string): JoinRoomResponse;
    joinFromProfile(profile: UserProfile, initialSpotId?: string): JoinRoomResponse;
    leave(userId: string): boolean;
    moveToSpot(userId: string, spotId: string): boolean;
    setInMiniRoom(userId: string, inMiniRoom: boolean): boolean;
    snapshot(): RoomPresenceSnapshot;
}
//# sourceMappingURL=LobbyRoom.d.ts.map