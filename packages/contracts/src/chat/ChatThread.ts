export interface ChatParticipantSummary {
  userId: string;
  displayName?: string;
}

export interface ChatMessage {
  messageId: string;
  threadId: string;
  senderUserId: string;
  body: string;
  sentAt: string;
}

export interface ChatThread {
  threadId: string;
  miniRoomId: string;
  participantUserIds: [string, string];
  participants: [ChatParticipantSummary, ChatParticipantSummary];
  createdAt: string;
  lastMessage?: ChatMessage;
}

export interface ChatThreadList {
  userId: string;
  threads: ChatThread[];
}

export interface ChatMessageList {
  userId: string;
  threadId: string;
  messages: ChatMessage[];
}

export interface ChatListThreadsCommand {}

export interface ChatListMessagesCommand {
  threadId: string;
}

export interface ChatSendMessageCommand {
  threadId: string;
  body: string;
}
