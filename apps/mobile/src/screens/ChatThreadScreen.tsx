import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Animated,
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
import { readCandidateAvatarSnapshot } from "../components/DiscoverCard"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { TypingIndicator } from "../ui/typingIndicator"
import { uiTheme } from "../ui/theme"
import { hapticLight } from "../ui/haptics"
import type { SessionActor } from "../features/session/sessionModel"

type ChatThreadScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ChatThread"
> & {
  sessionActor: SessionActor
}

const ROOM_INVITE_SENTINEL = "__room_invite__"

function isRoomInviteMessage(body: string): boolean {
  return body.trim() === ROOM_INVITE_SENTINEL
}

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
  const { navigation, route, sessionActor } = props
  const { threadId, partnerId: pendingPartnerId, partnerName: pendingPartnerName } = route.params
  const { threads, getMessages, findThreadForPartner, addOptimisticMessage, setActiveThread } = useChatStore()
  const [inputText, setInputText] = useState("")
  const scrollViewRef = useRef<ScrollView>(null)
  const [reportVisible, setReportVisible] = useState(false)
  const sendScaleAnim = useRef(new Animated.Value(1)).current

  const thread = useMemo(() => {
    if (threadId) return threads.find((t) => t.threadId === threadId)
    if (pendingPartnerId) return findThreadForPartner(pendingPartnerId)
    return undefined
  }, [threadId, pendingPartnerId, threads, findThreadForPartner])

  const resolvedThreadId = thread?.threadId ?? threadId
  const messages = resolvedThreadId ? getMessages(resolvedThreadId) : []

  const currentUserId = sessionActor.profile.userId
  
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
  const partnerAvatarSnapshot = readCandidateAvatarSnapshot(partnerSummary, {
    userId: partnerUserId || partnerName,
    displayName: partnerName
  })

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

  const handleJoinRoom = useCallback((): void => {
    if (!partnerUserId) return
    const now = Date.now()
    const miniRoomId = `demo-invite-${now}`
    hapticLight()
    navigation.navigate("MiniRoom", {
      readyMiniRoom: {
        miniRoom: {
          miniRoomId,
          lobbyRoomId: "demo-lobby",
          participantUserIds: [
            sessionActor.profile.userId,
            partnerUserId
          ] as [string, string],
          livekitRoomName: `demo-room-${now}`
        },
        mediaSession: {
          miniRoomId,
          livekitUrl: "wss://demo.livekit.invalid",
          token: "demo",
          issuedAt: new Date().toISOString()
        }
      },
      participants: {
        you: {
          userId: sessionActor.profile.userId,
          displayName: sessionActor.profile.displayName
        },
        partner: {
          userId: partnerUserId,
          displayName: partnerName,
          avatarSnapshot: partnerAvatarSnapshot
        }
      }
    })
  }, [navigation, partnerAvatarSnapshot, partnerName, partnerUserId, sessionActor])

  const handleSendInvite = useCallback((): void => {
    if (!resolvedThreadId || !currentUserId) return
    addOptimisticMessage({
      threadId: resolvedThreadId,
      senderUserId: currentUserId,
      body: ROOM_INVITE_SENTINEL
    })
    const sendChatMessage = route.params.sendChatMessage
    if (sendChatMessage) {
      sendChatMessage(resolvedThreadId, ROOM_INVITE_SENTINEL)
    }
    hapticLight()
  }, [addOptimisticMessage, currentUserId, resolvedThreadId, route.params.sendChatMessage])

  const handleSend = useCallback(() => {
    const body = inputText.trim()
    if (!body || !resolvedThreadId) return

    if (currentUserId) {
      addOptimisticMessage({
        threadId: resolvedThreadId,
        senderUserId: currentUserId,
        body
      })
    }

    const sendChatMessage = route.params.sendChatMessage
    if (sendChatMessage) {
      sendChatMessage(resolvedThreadId, body)
    }
    setInputText("")
    hapticLight()
  }, [addOptimisticMessage, currentUserId, inputText, route.params.sendChatMessage, resolvedThreadId])

  const handleSendPressIn = () => {
    Animated.spring(sendScaleAnim, {
      toValue: 0.85,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handleSendPressOut = () => {
    Animated.spring(sendScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
  }

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
            <View style={styles.headerRightRow}>
              <View style={styles.headerAvatarWrap}>
                <Avatar
                  name={partnerAvatarSnapshot.displayName}
                  seed={partnerAvatarSnapshot.previewSeed}
                  size={36}
                  ring="soft"
                />
                {partnerAvatarSnapshot.source === "preview_fallback" ? (
                  <Text style={styles.headerAvatarSource}>Preview</Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => setReportVisible(true)}
                hitSlop={8}
                style={styles.moreButton}
              >
                <Text style={styles.moreButtonText}>⋯</Text>
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
              <View style={styles.emptyChatGlow} pointerEvents="none" />
              <Avatar
                name={partnerAvatarSnapshot.displayName}
                seed={partnerAvatarSnapshot.previewSeed}
                size={80}
                ring="soft"
              />
              {partnerAvatarSnapshot.source === "preview_fallback" ? (
                <Text style={styles.emptyAvatarSource}>
                  {partnerAvatarSnapshot.label}
                </Text>
              ) : null}
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

                const isInvite = isRoomInviteMessage(item.body)

                return (
                  <View key={item.messageId}>
                    {dateLabel ? (
                      <View style={bubbleStyles.dateSep}>
                        <View style={bubbleStyles.dateSepPill}>
                          <Text style={bubbleStyles.dateSepText}>{dateLabel}</Text>
                        </View>
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
                      <Avatar
                        name={partnerAvatarSnapshot.displayName}
                        seed={partnerAvatarSnapshot.previewSeed}
                        size={28}
                      />
                    ) : null}
                    {isInvite ? (
                      <View style={inviteStyles.card}>
                        <LinearGradient
                          colors={[uiTheme.colors.primarySoft, "#FFF5F9"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={inviteStyles.cardGradient}
                        >
                          <View style={inviteStyles.headerRow}>
                            <LinearGradient
                              colors={uiTheme.gradients.primary as [string, string]}
                              style={inviteStyles.iconCircle}
                            >
                              <Text style={inviteStyles.iconText}>⌂</Text>
                            </LinearGradient>
                            <View style={inviteStyles.headerText}>
                              <Text style={inviteStyles.title}>
                                {isMe ? "MiniRoom invite sent" : `${partnerName} invited you to MiniRoom`}
                              </Text>
                              <Text style={inviteStyles.subtitle}>
                                Shared avatar room after mutual match
                              </Text>
                            </View>
                          </View>
                          <Pressable
                            onPress={handleJoinRoom}
                            style={({ pressed }) => [
                              inviteStyles.joinButton,
                              pressed ? inviteStyles.joinButtonPressed : null
                            ]}
                          >
                            <LinearGradient
                              colors={uiTheme.gradients.primary as [string, string]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={inviteStyles.joinButtonGradient}
                            >
                              <Text style={inviteStyles.joinButtonText}>Enter MiniRoom →</Text>
                            </LinearGradient>
                          </Pressable>
                          <Text style={inviteStyles.time}>
                            {formatMessageTime(item.sentAt)}
                          </Text>
                        </LinearGradient>
                      </View>
                    ) : (
                      <View
                        style={[
                          bubbleStyles.bubble,
                          isMe ? bubbleStyles.bubbleMe : bubbleStyles.bubbleThem
                        ]}
                      >
                        {isMe ? (
                          <LinearGradient
                            colors={uiTheme.gradients.primary as [string, string]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: uiTheme.radius.lg }]}
                          />
                        ) : null}
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
                    )}
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
              <Pressable
                onPress={handleSendInvite}
                disabled={isPendingThread}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.inviteButton,
                  isPendingThread ? styles.inviteButtonDisabled : null,
                  pressed ? styles.inviteButtonPressed : null
                ]}
              >
                <Text style={styles.inviteButtonIcon}>⌂</Text>
              </Pressable>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Message…"
                  placeholderTextColor={uiTheme.colors.textMuted}
                  multiline
                  maxLength={500}
                />
              </View>
              <Animated.View style={{ transform: [{ scale: sendScaleAnim }] }}>
                <Pressable
                  onPress={handleSend}
                  onPressIn={handleSendPressIn}
                  onPressOut={handleSendPressOut}
                  disabled={inputText.trim().length === 0 || isPendingThread}
                  style={({ pressed }) => [
                    styles.sendButton,
                    (inputText.trim().length === 0 || isPendingThread)
                      ? styles.sendButtonDisabled
                      : null,
                    pressed ? styles.sendButtonPressed : null
                  ]}
                >
                  <LinearGradient
                    colors={
                      inputText.trim().length === 0 || isPendingThread
                        ? [uiTheme.colors.primaryDisabled, uiTheme.colors.primaryDisabled]
                        : uiTheme.gradients.primary as [string, string]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButtonGradient}
                  >
                    <Text style={styles.sendButtonText}>↑</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
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
    backgroundColor: uiTheme.colors.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAvatarWrap: {
    alignItems: "center",
    gap: 2,
  },
  headerAvatarSource: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted,
    fontSize: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.secondary,
  },
  moreButtonText: {
    color: uiTheme.colors.textMuted,
    fontSize: 18,
    fontWeight: "800",
  },
  messageListContainer: {
    flex: 1,
    paddingVertical: uiTheme.spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: uiTheme.spacing.xl,
  },
  emptyText: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary,
    textAlign: "center",
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xxxl,
    position: "relative",
  },
  emptyChatGlow: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: uiTheme.colors.accentGlow,
  },
  emptyChatTitle: {
    ...uiTheme.font.subheading,
    color: uiTheme.colors.textPrimary,
    marginTop: uiTheme.spacing.sm,
  },
  emptyAvatarSource: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted,
    fontSize: 10,
  },
  emptyChatBody: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    textAlign: "center",
  },
  composerSafe: {
    backgroundColor: "transparent",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: uiTheme.spacing.xs,
    paddingVertical: uiTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: uiTheme.colors.border,
  },
  inputWrap: {
    flex: 1,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glassStrong,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    overflow: "hidden",
  },
  input: {
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    ...uiTheme.font.body,
    color: uiTheme.colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    ...uiTheme.shadow.glowSubtle,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonPressed: {
    opacity: 0.9,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  inviteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1.5,
    borderColor: uiTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButtonDisabled: {
    opacity: 0.4,
  },
  inviteButtonPressed: {
    backgroundColor: uiTheme.colors.chipBackground,
    borderColor: uiTheme.colors.primary,
  },
  inviteButtonIcon: {
    fontSize: 20,
  },
})

const inviteStyles = StyleSheet.create({
  card: {
    maxWidth: "82%",
    borderRadius: uiTheme.radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 79, 152, 0.2)",
    ...uiTheme.shadow.soft,
  },
  cardGradient: {
    padding: uiTheme.spacing.md,
    gap: uiTheme.spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textPrimary,
    fontWeight: "800",
  },
  subtitle: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
  },
  joinButton: {
    alignSelf: "flex-start",
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glowSubtle,
  },
  joinButtonGradient: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
  },
  joinButtonPressed: {
    opacity: 0.85,
  },
  joinButtonText: {
    color: "#FFFFFF",
    ...uiTheme.font.bodySmall,
    fontWeight: "800",
  },
  time: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted,
    alignSelf: "flex-end",
  },
})

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: uiTheme.spacing.xs,
    marginBottom: uiTheme.spacing.xs,
  },
  rowMe: {
    justifyContent: "flex-end",
  },
  rowThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: uiTheme.radius.lg,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    borderWidth: 1,
    overflow: "hidden",
  },
  bubbleMe: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderBottomRightRadius: uiTheme.radius.xs,
    ...uiTheme.shadow.glowSubtle,
  },
  bubbleThem: {
    backgroundColor: uiTheme.colors.glassStrong,
    borderColor: uiTheme.colors.glassBorder,
    borderBottomLeftRadius: uiTheme.radius.xs,
    ...uiTheme.shadow.float,
  },
  body: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textPrimary,
    zIndex: 1,
  },
  bodyMe: {
    color: "#FFFFFF",
  },
  time: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted,
    marginTop: 3,
    alignSelf: "flex-end",
    fontSize: 10,
    zIndex: 1,
  },
  timeMe: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  dateSep: {
    alignItems: "center",
    paddingVertical: uiTheme.spacing.md,
  },
  dateSepPill: {
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: 5,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.soft,
  },
  dateSepText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
})
