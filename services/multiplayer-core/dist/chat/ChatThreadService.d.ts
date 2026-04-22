import type { ChatMessage, ChatMessageList, ChatParticipantSummary, ChatThread, ChatThreadList, ConnectionMatch } from "@datevibe/contracts";
export interface CreateThreadForMatchInput {
    match: ConnectionMatch;
    participants: [ChatParticipantSummary, ChatParticipantSummary];
}
export interface SendChatMessageInput {
    threadId: string;
    senderUserId: string;
    body: string;
}
export declare class ChatThreadService {
    private readonly threadsById;
    private readonly threadIdsByMiniRoomId;
    private readonly messagesByThreadId;
    createThreadForMatch(input: CreateThreadForMatchInput): ChatThread;
    getThread(threadId: string): ChatThread | undefined;
    listThreadsForUser(userId: string): ChatThreadList;
    listMessagesForUser(input: {
        threadId: string;
        userId: string;
    }): ChatMessageList | undefined;
    sendMessage(input: SendChatMessageInput): ChatMessage | undefined;
    private getThreadSortTime;
}
//# sourceMappingURL=ChatThreadService.d.ts.map