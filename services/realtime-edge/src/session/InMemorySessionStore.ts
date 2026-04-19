import type { AuthSession, UserProfile } from "@contracts"

export interface StoredSessionActor {
  session: AuthSession
  profile: UserProfile
}

export class InMemorySessionStore {
  private readonly recordsByToken = new Map<string, StoredSessionActor>()
  private readonly tokensByUserId = new Map<string, Set<string>>()

  public set(record: StoredSessionActor): void {
    this.recordsByToken.set(record.session.sessionToken, record)

    const existingTokens = this.tokensByUserId.get(record.session.userId) ?? new Set<string>()
    existingTokens.add(record.session.sessionToken)
    this.tokensByUserId.set(record.session.userId, existingTokens)
  }

  public getByToken(sessionToken: string): StoredSessionActor | undefined {
    return this.recordsByToken.get(sessionToken)
  }

  public deleteByToken(sessionToken: string): boolean {
    const existing = this.recordsByToken.get(sessionToken)
    if (!existing) {
      return false
    }

    this.recordsByToken.delete(sessionToken)
    const userTokens = this.tokensByUserId.get(existing.session.userId)
    if (!userTokens) {
      return true
    }

    userTokens.delete(sessionToken)
    if (userTokens.size === 0) {
      this.tokensByUserId.delete(existing.session.userId)
    }

    return true
  }

  public deleteByUserId(userId: string): number {
    const userTokens = this.tokensByUserId.get(userId)
    if (!userTokens) {
      return 0
    }

    let deletedCount = 0
    for (const token of userTokens) {
      if (this.recordsByToken.delete(token)) {
        deletedCount += 1
      }
    }
    this.tokensByUserId.delete(userId)
    return deletedCount
  }
}
