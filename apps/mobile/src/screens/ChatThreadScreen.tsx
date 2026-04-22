import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useChatStore } from "../features/chat/chatStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { ReportModal } from "../components/ReportModal"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { TypingIndicator } from "../ui/typingIndicator"
import { uiTheme } from "../ui/theme"
import { hapticLight } from "../ui/haptics"
import { useSessionState } from "../features/session/useSessionState"

type ChatThreadScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ChatThread"
>

function formatMessageTime(isoDate: string): string {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return ""
  const hours = d.getHours().toString().padStart(2, "0")
  const mins = d.getMinutes().toString().padStart(2, "0")
  return `${hours}:${mins}`
}

function formatDateSeparator(date: Date): string {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now.getTime() - 86_400_000).toDateString()
  const ds = date.toDateString()
  if (ds === today) return "Today"
  if (ds === yesterday) return "Yesterday"
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

export function ChatThreadScreen(props: ChatThreadScreenProps) {
  const { navigation, route } = props
  const { threadId, partnerId: pendingPartnerId, partnerName: pendingPartnerName } = route.params
  const { threads, getMessages, findThreadForPartner, addOptimisticMessage, setActiveThread } = useChatStore()
  const { sessionActor } = useSessionState()
  const [inputText, setInputText] = useState("")
  const scrollViewRef = useRef<ScrollView>(null)
  const [reportVisible, setReportVisible] = useState(false)

  const thread = useMemo(() => {
    if (threadId) return threads.find((t) => t.threadId === threadId)
    if (pendingPartnerId) return findThreadForPartner(pendingPartnerId)
    return undefined
  }, [threadId, pendingPartnerId, threads, findThreadForPartner])

  const resolvedThreadId = thread?.threadId ?? threadId
  const messages = resolvedThreadId ? getMessages(resolvedThreadId) : []

  const currentUserId = sessionActor?.profile.userId ?? ""
  
  const partnerSummary = useMemo(() => {
    if (!thread) return null
    return (
      thread.participants.find((p) => p.userId !== currentUserId) ??
      thread.participants[0] ??
      null
    )
  }, [currentUserId, thread])

  const partnerName = partnerSummary?.displayName ?? pendingPartnerName ?? "Someone"
  const partnerUserId = partnerSummary?.userId ?? pendingPartnerId ?? ""

  // Request messages from server when entering thread
  useEffect(() => {
    const requestMessages = route.params.requestMessages
    if (requestMessages && resolvedThreadId) {
      requestMessages(resolvedThreadId)
    }
  }, [route.params.requestMessages, resolvedThreadId])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 80)
    }
  }, [messages.length])

  // Mark thread as active for unread tracking
  useEffect(() => {
    if (resolvedThreadId) {
      setActiveThread(resolvedThreadId)
    }
    return () => setActiveThread(null)
  }, [resolvedThreadId, setActiveThread])

  const handleSend = useCallback(() => {
    const body = inputText.trim()
    if (!body || !resolvedThreadId) return

    // Optimistic local echo — appears instantly, replaced by server confirmation
    if (currentUserId) {
      addOptimisticMessage({
        threadId: resolvedThreadId,
        senderUserId: currentUserId,
        body
      })
    }

    // Send via the sendChatMessage callback injected through navigation params.
    // This keeps the WS ownership in RootNavigator.
    const sendChatMessage = route.params.sendChatMessage
    if (sendChatMessage) {
      sendChatMessage(resolvedThreadId, body)
    }
    setInputText("")
    hapticLight()
  }, [addOptimisticMessage, currentUserId, inputText, route.params.sendChatMessage, resolvedThreadId])

  if (!thread && !pendingPartnerId) {
    return (
      <View style={styles.root}>
        <SoftBlobBackground variant="lobby" />
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <TopBar
            title="Chat"
            titleAlign="start"
            leftSlot={
              <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
                ←
              </ActionButtonCircle>
            }
          />
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              This thread is no longer available.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    )
  }

  // If we have a pendingPartnerId but no thread yet, it means the server is still creating it.
  // We'll show an empty chat screen until it arrives.
  const isPendingThread = !thread && !!pendingPartnerId

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <TopBar
          title={partnerName}
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              ←
            </ActionButtonCircle>
          }
          rightSlot={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Avatar name={partnerName} seed={partnerUserId} size={34} ring="soft" />
              <Pressable
                onPress={() => setReportVisible(true)}
                hitSlop={8}
                style={{ width: 28, alignItems: "center" }}
              >
                <Text style={{ color: uiTheme.colors.textMuted, fontSize: 18, fontWeight: "800" }}>⋯</Text>
              </Pressable>
            </View>
          }
        />

        <ReportModal
          visible={reportVisible}
          targetUserId={partnerUserId}
          targetDisplayName={partnerName}
          onClose={() => setReportVisible(false)}
        />

          <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          {messages.length === 0 || isPendingThread ? (
            <View style={styles.emptyChat}>
              <Avatar name={partnerName} seed={partnerUserId} size={72} ring="soft" />
              <Text style={styles.emptyChatTitle}>
                {isPendingThread ? "Opening thread..." : "Start of your conversation"}
              </Text>
              <Text style={styles.emptyChatBody}>
                {isPendingThread ? "Setting up a private space." : "Say hello. Keep it real."}
              </Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageListContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((item, index) => {
                const isMe = item.senderUserId === currentUserId
                const isOptimistic = item.messageId.startsWith("__local_")

                // Day separator
                const itemDate = new Date(item.sentAt)
                const prevDate = index > 0 ? new Date(messages[index - 1].sentAt) : null
                const showDateSep =
                  !prevDate ||
                  itemDate.toDateString() !== prevDate.toDateString()
                const dateLabel = showDateSep ? formatDateSeparator(itemDate) : null

                return (
                  <View key={item.messageId}>
                    {dateLabel ? (
                      <View style={bubbleStyles.dateSep}>
                        <Text style={bubbleStyles.dateSepText}>{dateLabel}</Text>
                      </View>
                    ) : null}
                    <View
                      style={[
                        bubbleStyles.row,
                        isMe ? bubbleStyles.rowMe : bubbleStyles.rowThem,
                        isOptimistic ? { opacity: 0.65 } : null
                      ]}
                    >
                    {!isMe ? (
                      <Avatar name={partnerName} seed={partnerUserId} size={28} />
                    ) : null}
                    <View
                      style={[
                        bubbleStyles.bubble,
                        isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem
                      ]}
                    >
                      <Text
                        style={[
                          bubbleStyles.body,
                          isMe ? bubbleStyles.bodyMe : null
                        ]}
                      >
                        {item.body}
                      </Text>
                      <Text
                        style={[
                          bubbleStyles.time,
                          isMe ? bubbleStyles.timeMe : null
                        ]}
                      >
                        {formatMessageTime(item.sentAt)}
                      </Text>
                    </View>
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          )}

          {/* Typing indicator — placeholder heuristic. Replace with server typing event. */}
          <TypingIndicator visible={false} />

          <SafeAreaView edges={["bottom"]} style={styles.composerSafe}>
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Message…"
                placeholderTextColor={uiTheme.colors.textMuted}
                multiline
                maxLength={500}
              />
              <Pressable
                onPress={handleSend}
                disabled={inputText.trim().length === 0 || isPendingThread}
                style={({ pressed }) => [
                  styles.sendButton,
                  (inputText.trim().length === 0 || isPendingThread)
                    ? styles.sendButtonDisabled
                    : null,
                  pressed ? styles.sendButtonPressed : null
                ]}
              >
                <Text style={styles.sendButtonText}>↑</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm
  },
  flex: {
    flex: 1
  },
  messageListContainer: {
    flex: 1,
    paddingVertical: uiTheme.spacing.md
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: uiTheme.spacing.xl
  },
  emptyText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    textAlign: "center"
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xxxl
  },
  emptyChatTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    marginTop: uiTheme.spacing.sm
  },
  emptyChatBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    textAlign: "center"
  },
  composerSafe: {
    backgroundColor: "transparent"
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: uiTheme.spacing.xs,
    paddingVertical: uiTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: uiTheme.colors.border
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    fontSize: uiTheme.typography.body,
    color: uiTheme.colors.textPrimary
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonDisabled: {
    backgroundColor: uiTheme.colors.primaryDisabled
  },
  sendButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800"
  }
})

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: uiTheme.spacing.xs,
    marginBottom: uiTheme.spacing.xxs
  },
  rowMe: {
    justifyContent: "flex-end"
  },
  rowThem: {
    justifyContent: "flex-start"
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: uiTheme.radius.lg,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderWidth: 1
  },
  bubbleMe: {
    backgroundColor: uiTheme.colors.primary,
    borderColor: uiTheme.colors.primaryDeep,
    borderBottomRightRadius: uiTheme.radius.xs
  },
  bubbleThem: {
    backgroundColor: uiTheme.colors.surface,
    borderColor: uiTheme.colors.border,
    borderBottomLeftRadius: uiTheme.radius.xs,
    ...uiTheme.shadow.soft
  },
  body: {
    fontSize: uiTheme.typography.body,
    color: uiTheme.colors.textPrimary,
    lineHeight: 22
  },
  bodyMe: {
    color: "#FFFFFF"
  },
  time: {
    fontSize: uiTheme.typography.micro,
    color: uiTheme.colors.textMuted,
    marginTop: 3,
    alignSelf: "flex-end"
  },
  timeMe: {
    color: "rgba(255, 255, 255, 0.7)"
  },
  dateSep: {
    alignItems: "center",
    paddingVertical: uiTheme.spacing.sm,
    marginVertical: uiTheme.spacing.xs
  },
  dateSepText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    backgroundColor: uiTheme.colors.surfaceMuted,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: 3,
    borderRadius: uiTheme.radius.full,
    overflow: "hidden"
  }
})
