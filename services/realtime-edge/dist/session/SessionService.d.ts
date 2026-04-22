import type { AuthSession, AvatarSelection, UserProfile } from "@datevibe/contracts";
import { InMemorySessionStore } from "./InMemorySessionStore";
export interface CreateSessionInput {
    displayName: string;
    avatarPresetId?: string;
    avatar?: AvatarSelection;
}
export interface SessionActor {
    session: AuthSession;
    profile: UserProfile;
}
export interface SessionServiceOptions {
    sessionTtlMs?: number;
    now?: () => Date;
    generateUserId?: () => string;
    generateSessionToken?: () => string;
}
export declare class SessionService {
    private readonly sessionStore;
    private readonly sessionTtlMs;
    private readonly now;
    private readonly generateUserId;
    private readonly generateSessionToken;
    constructor(sessionStore: InMemorySessionStore, options?: SessionServiceOptions);
    createSession(input: CreateSessionInput): SessionActor;
    verifySessionToken(sessionToken: string): AuthSession | undefined;
    resolveActor(sessionToken: string): SessionActor | undefined;
    resolveActorProfile(sessionToken: string): UserProfile | undefined;
    revokeSession(sessionToken: string): boolean;
    revokeUser(userId: string): number;
}
//# sourceMappingURL=SessionService.d.ts.map