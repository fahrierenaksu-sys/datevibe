export interface MiniRoomLeaveCommand {
    miniRoomId: string;
}
export interface MiniRoomEnded {
    miniRoomId: string;
    lobbyRoomId: string;
    participantUserIds: [string, string];
    endedByUserId: string;
    endedAt: string;
}
//# sourceMappingURL=MiniRoomEnd.d.ts.map