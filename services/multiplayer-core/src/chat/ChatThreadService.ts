import type {
  ChatMessage,
  ChatMessageList,
  ChatParticipantSummary,
  ChatThread,
  ChatThreadList,
  ConnectionMatch,
} from "@datevibe/contracts";

export interface CreateThreadForMatchInput {
  match: ConnectionMatch;
  participants: [ChatParticipantSummary, ChatParticipantSummary];
}

export interface SendChatMessageInput {
  threadId: string;
  senderUserId: string;
  body: string;
}

function createThreadId(miniRoomId: string): string {
  return `thread_${miniRoomId}`;
}

function createMessageId(threadId: string): string {
  return `msg_${threadId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeBody(body: string): string {
  return body.trim().replace(/\s+/g, " ");
}

export class ChatThreadService {
  private readonly threadsById = new Map<string, ChatThread>();
  private readonly threadIdsByMiniRoomId = new Map<string, string>();
  private readonly messagesByThreadId = new Map<string, ChatMessage[]>();

  public createThreadForMatch(input: CreateThreadForMatchInput): ChatThread {
    const existingThreadId = this.threadIdsByMiniRoomId.get(input.match.miniRoomId);
    if (existingThreadId) {
      const existingThread = this.threadsById.get(existingThreadId);
      if (existingThread) {
        return existingThread;
      }
    }

    const thread: ChatThread = {
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

  public getThread(threadId: string): ChatThread | undefined {
    return this.threadsById.get(threadId);
  }

  public listThreadsForUser(userId: string): ChatThreadList {
    return {
      userId,
      threads: Array.from(this.threadsById.values())
        .filter((thread) => thread.participantUserIds.includes(userId))
        .sort((a, b) => this.getThreadSortTime(b) - this.getThreadSortTime(a)),
    };
  }

  public listMessagesForUser(input: {
    threadId: string;
    userId: string;
  }): ChatMessageList | undefined {
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

  public sendMessage(input: SendChatMessageInput): ChatMessage | undefined {
    const thread = this.threadsById.get(input.threadId);
    if (!thread || !thread.participantUserIds.includes(input.senderUserId)) {
      return undefined;
    }

    const body = normalizeBody(input.body);
    if (body.length === 0 || body.length > 500) {
      return undefined;
    }

    const message: ChatMessage = {
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

  private getThreadSortTime(thread: ChatThread): number {
    const timestamp = thread.lastMessage?.sentAt ?? thread.createdAt;
    return new Date(timestamp).getTime();
  }
}
