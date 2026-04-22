"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const crypto_1 = require("crypto");
const DEFAULT_AVATAR_PRESET_ID = "default";
class SessionService {
    sessionStore;
    sessionTtlMs;
    now;
    generateUserId;
    generateSessionToken;
    constructor(sessionStore, options = {}) {
        this.sessionStore = sessionStore;
        this.sessionTtlMs = options.sessionTtlMs ?? 1000 * 60 * 60 * 24;
        this.now = options.now ?? (() => new Date());
        this.generateUserId = options.generateUserId ?? (() => (0, crypto_1.randomUUID)());
        this.generateSessionToken = options.generateSessionToken ?? (() => (0, crypto_1.randomUUID)());
    }
    createSession(input) {
        const displayName = input.displayName.trim();
        if (displayName.length === 0) {
            throw new Error("displayName cannot be empty");
        }
        const userId = this.generateUserId();
        const sessionToken = this.generateSessionToken();
        const now = this.now();
        const expiresAt = new Date(now.getTime() + this.sessionTtlMs).toISOString();
        const avatar = input.avatar ?? {
            presetId: input.avatarPresetId?.trim() || DEFAULT_AVATAR_PRESET_ID
        };
        const profile = {
            userId,
            displayName,
            avatar
        };
        const session = {
            userId,
            sessionToken,
            expiresAt
        };
        const actor = { session, profile };
        this.sessionStore.set(actor);
        return actor;
    }
    verifySessionToken(sessionToken) {
        const actor = this.resolveActor(sessionToken);
        return actor?.session;
    }
    resolveActor(sessionToken) {
        const existing = this.sessionStore.getByToken(sessionToken);
        if (!existing) {
            return undefined;
        }
        if (new Date(existing.session.expiresAt).getTime() <= this.now().getTime()) {
            this.sessionStore.deleteByToken(sessionToken);
            return undefined;
        }
        return existing;
    }
    resolveActorProfile(sessionToken) {
        return this.resolveActor(sessionToken)?.profile;
    }
    revokeSession(sessionToken) {
        return this.sessionStore.deleteByToken(sessionToken);
    }
    revokeUser(userId) {
        return this.sessionStore.deleteByUserId(userId);
    }
}
exports.SessionService = SessionService;
