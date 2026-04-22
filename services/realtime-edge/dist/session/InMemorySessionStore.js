"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemorySessionStore = void 0;
class InMemorySessionStore {
    recordsByToken = new Map();
    tokensByUserId = new Map();
    set(record) {
        this.recordsByToken.set(record.session.sessionToken, record);
        const existingTokens = this.tokensByUserId.get(record.session.userId) ?? new Set();
        existingTokens.add(record.session.sessionToken);
        this.tokensByUserId.set(record.session.userId, existingTokens);
    }
    getByToken(sessionToken) {
        return this.recordsByToken.get(sessionToken);
    }
    deleteByToken(sessionToken) {
        const existing = this.recordsByToken.get(sessionToken);
        if (!existing) {
            return false;
        }
        this.recordsByToken.delete(sessionToken);
        const userTokens = this.tokensByUserId.get(existing.session.userId);
        if (!userTokens) {
            return true;
        }
        userTokens.delete(sessionToken);
        if (userTokens.size === 0) {
            this.tokensByUserId.delete(existing.session.userId);
        }
        return true;
    }
    deleteByUserId(userId) {
        const userTokens = this.tokensByUserId.get(userId);
        if (!userTokens) {
            return 0;
        }
        let deletedCount = 0;
        for (const token of userTokens) {
            if (this.recordsByToken.delete(token)) {
                deletedCount += 1;
            }
        }
        this.tokensByUserId.delete(userId);
        return deletedCount;
    }
}
exports.InMemorySessionStore = InMemorySessionStore;
