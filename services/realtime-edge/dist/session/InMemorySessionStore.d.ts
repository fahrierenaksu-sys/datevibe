import type { AuthSession, UserProfile } from "@datevibe/contracts";
export interface StoredSessionActor {
    session: AuthSession;
    profile: UserProfile;
}
export declare class InMemorySessionStore {
    private readonly recordsByToken;
    private readonly tokensByUserId;
    set(record: StoredSessionActor): void;
    getByToken(sessionToken: string): StoredSessionActor | undefined;
    deleteByToken(sessionToken: string): boolean;
    deleteByUserId(userId: string): number;
}
//# sourceMappingURL=InMemorySessionStore.d.ts.map