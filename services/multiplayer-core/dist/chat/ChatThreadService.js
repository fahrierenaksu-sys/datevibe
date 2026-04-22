"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatThreadService = void 0;
function createThreadId(miniRoomId) {
    return `thread_${miniRoomId}`;
}
function createMessageId(threadId) {
    return `msg_${threadId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
function normalizeBody(body) {
    return body.trim().replace(/\s+/g, " ");
}
class ChatThreadService {
    threadsById = new Map();
    threadIdsByMiniRoomId = new Map();
    messagesByThreadId = new Map();
    createThreadForMatch(input) {
        const existingThreadId = this.threadIdsByMiniRoomId.get(input.match.miniRoomId);
        if (existingThreadId) {
            const existingThread = this.threadsById.get(existingThreadId);
            if (existingThread) {
                return existingThread;
            }
        }
        const thread = {
            threadId: createThreadId(input.match.miniRoomId),
            miniRoomId: input.match.miniRoomId,
            participantUserIds: input.match.participantUserIds,
            participants: input.participants,
            createdAt: input.match.matchedAt,
        };
        this.threadsById.set(thread.threadId, thread);
        this.threadIdsByMiniRoomId.set(thread.miniRoomId, thread.threadId);
        this.messagesByThreadId.set(thread.threadId, []);
        return thread;
    }
    getThread(threadId) {
        return this.threadsById.get(threadId);
    }
    listThreadsForUser(userId) {
        return {
            userId,
            threads: Array.from(this.threadsById.values())
                .filter((thread) => thread.participantUserIds.includes(userId))
                .sort((a, b) => this.getThreadSortTime(b) - this.getThreadSortTime(a)),
        };
    }
    listMessagesForUser(input) {
        const thread = this.threadsById.get(input.threadId);
        if (!thread || !thread.participantUserIds.includes(input.userId)) {
            return undefined;
        }
        return {
            userId: input.userId,
            threadId: input.threadId,
            messages: [...(this.messagesByThreadId.get(input.threadId) ?? [])],
        };
    }
    sendMessage(input) {
        const thread = this.threadsById.get(input.threadId);
        if (!thread || !thread.participantUserIds.includes(input.senderUserId)) {
            return undefined;
        }
        const body = normalizeBody(input.body);
        if (body.length === 0 || body.length > 500) {
            return undefined;
        }
        const message = {
            messageId: createMessageId(thread.threadId),
            threadId: thread.threadId,
            senderUserId: input.senderUserId,
            body,
            sentAt: new Date().toISOString(),
        };
        const messages = this.messagesByThreadId.get(thread.threadId) ?? [];
        messages.push(message);
        this.messagesByThreadId.set(thread.threadId, messages);
        this.threadsById.set(thread.threadId, {
            ...thread,
            lastMessage: message,
        });
        return message;
    }
    getThreadSortTime(thread) {
        const timestamp = thread.lastMessage?.sentAt ?? thread.createdAt;
        return new Date(timestamp).getTime();
    }
}
exports.ChatThreadService = ChatThreadService;
