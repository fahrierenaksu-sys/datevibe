import { randomUUID } from "crypto"
import type { AuthSession, AvatarSelection, UserProfile } from "@contracts"
import { InMemorySessionStore } from "./InMemorySessionStore"

export interface CreateSessionInput {
  displayName: string
  avatarPresetId?: string
  avatar?: AvatarSelection
}

export interface SessionActor {
  session: AuthSession
  profile: UserProfile
}

export interface SessionServiceOptions {
  sessionTtlMs?: number
  now?: () => Date
  generateUserId?: () => string
  generateSessionToken?: () => string
}

const DEFAULT_AVATAR_PRESET_ID = "default"

export class SessionService {
  private readonly sessionTtlMs: number
  private readonly now: () => Date
  private readonly generateUserId: () => string
  private readonly generateSessionToken: () => string

  public constructor(
    private readonly sessionStore: InMemorySessionStore,
    options: SessionServiceOptions = {}
  ) {
    this.sessionTtlMs = options.sessionTtlMs ?? 1000 * 60 * 60 * 24
    this.now = options.now ?? (() => new Date())
    this.generateUserId = options.generateUserId ?? (() => randomUUID())
    this.generateSessionToken = options.generateSessionToken ?? (() => randomUUID())
  }

  public createSession(input: CreateSessionInput): SessionActor {
    const displayName = input.displayName.trim()
    if (displayName.length === 0) {
      throw new Error("displayName cannot be empty")
    }

    const userId = this.generateUserId()
    const sessionToken = this.generateSessionToken()
    const now = this.now()
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs).toISOString()

    const avatar: AvatarSelection = input.avatar ?? {
      presetId: input.avatarPresetId?.trim() || DEFAULT_AVATAR_PRESET_ID
    }

    const profile: UserProfile = {
      userId,
      displayName,
      avatar
    }

    const session: AuthSession = {
      userId,
      sessionToken,
      expiresAt
    }

    const actor: SessionActor = { session, profile }
    this.sessionStore.set(actor)
    return actor
  }

  public verifySessionToken(sessionToken: string): AuthSession | undefined {
    const actor = this.resolveActor(sessionToken)
    return actor?.session
  }

  public resolveActor(sessionToken: string): SessionActor | undefined {
    const existing = this.sessionStore.getByToken(sessionToken)
    if (!existing) {
      return undefined
    }

    if (new Date(existing.session.expiresAt).getTime() <= this.now().getTime()) {
      this.sessionStore.deleteByToken(sessionToken)
      return undefined
    }

    return existing
  }

  public resolveActorProfile(sessionToken: string): UserProfile | undefined {
    return this.resolveActor(sessionToken)?.profile
  }

  public revokeSession(sessionToken: string): boolean {
    return this.sessionStore.deleteByToken(sessionToken)
  }

  public revokeUser(userId: string): number {
    return this.sessionStore.deleteByUserId(userId)
  }
}
