export declare const REACTION_TYPES: readonly ["wave", "heart", "laugh", "fire"];
export type ReactionType = (typeof REACTION_TYPES)[number];
export interface ReactionEvent {
    roomId: string;
    actorUserId: string;
    targetUserId?: string;
    reaction: ReactionType;
    createdAt: string;
}
//# sourceMappingURL=ReactionEvent.d.ts.map