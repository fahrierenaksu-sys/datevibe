import type { ChatMessage } from "@datevibe/contracts"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useChatStore } from "../chat/chatStore"
import {
  useGlobalRealtime,
  useGlobalRealtimeEvents
} from "../realtime/globalRealtimeProvider"
import type { ServerEvent } from "@datevibe/realtime-client"

const ROOM_INVITE_SENTINEL = "__room_invite__"

export interface InRoomChatMessageEvent {
  messageId: string
  senderUserId: string
  body: string
  sentAt: number
}

export interface UseInRoomChatResult {
  threadId: string | undefined
  canSend: boolean
  sendRoomMessage: (body: string) => boolean
  newMessages: InRoomChatMessageEvent[]
  consume: (messageId: string) => void
}

/**
 * Bridges the real chat thread for this miniRoom into the scene.
 * Emits only NEW messages (after mount) as events so the scene can
 * render them as avatar-anchored speech bubbles — not as a thread list.
 */
export function useInRoomChat(options: {
  miniRoomId: string
  localUserId: string
  partnerUserId: string
}): UseInRoomChatResult {
  const { localUserId, partnerUserId } = options
  const { threads, findThreadForPartner, getMessages, addOptimisticMessage } = useChatStore()
  const { connectionStatus, send } = useGlobalRealtime()

  const thread = useMemo(() => {
    const byPartner = findThreadForPartner(partnerUserId)
    if (byPartner) return byPartner
    return threads.find((t) =>
      t.participantUserIds.includes(partnerUserId) &&
      t.participantUserIds.includes(localUserId)
    )
  }, [findThreadForPartner, localUserId, partnerUserId, threads])

  const threadId = thread?.threadId
  const requestedRef = useRef<string | null>(null)
  const baselineRef = useRef<number>(Date.now())
  const seenRef = useRef<Set<string>>(new Set())
  const [pendingEvents, setPendingEvents] = useState<InRoomChatMessageEvent[]>([])

  useEffect(() => {
    if (!threadId) return
    if (connectionStatus !== "connected") return
    if (requestedRef.current === threadId) return
    requestedRef.current = threadId
    baselineRef.current = Date.now()

    for (const message of getMessages(threadId)) {
      seenRef.current.add(message.messageId)
    }

    send({
      type: "chat.list_messages",
      payload: { threadId }
    })
  }, [connectionStatus, getMessages, send, threadId])

  const handleIncoming = useCallback(
    (message: ChatMessage) => {
      if (!threadId || message.threadId !== threadId) return
      if (seenRef.current.has(message.messageId)) return
      seenRef.current.add(message.messageId)
      if (message.body.trim() === ROOM_INVITE_SENTINEL) return
      const sentAtMs = Date.parse(message.sentAt)
      if (!Number.isFinite(sentAtMs)) return
      if (sentAtMs < baselineRef.current - 250) return
      setPendingEvents((current) => [
        ...current,
        {
          messageId: message.messageId,
          senderUserId: message.senderUserId,
          body: message.body,
          sentAt: sentAtMs
        }
      ])
    },
    [threadId]
  )

  const handleServerEvent = useCallback(
    (event: ServerEvent) => {
      if (event.type !== "chat.message_received") return
      handleIncoming(event.payload)
    },
    [handleIncoming]
  )
  useGlobalRealtimeEvents(handleServerEvent)

  const consume = useCallback((messageId: string) => {
    setPendingEvents((current) => current.filter((entry) => entry.messageId !== messageId))
  }, [])

  const sendRoomMessage = useCallback(
    (body: string): boolean => {
      const trimmed = body.trim()
      if (!trimmed) return false
      if (!threadId) return false
      if (connectionStatus !== "connected") return false
      addOptimisticMessage({
        threadId,
        senderUserId: localUserId,
        body: trimmed
      })
      send({
        type: "chat.send_message",
        payload: { threadId, body: trimmed }
      })
      return true
    },
    [addOptimisticMessage, connectionStatus, localUserId, send, threadId]
  )

  return {
    threadId,
    canSend: Boolean(threadId) && connectionStatus === "connected",
    sendRoomMessage,
    newMessages: pendingEvents,
    consume
  }
}
