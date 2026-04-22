import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useChatStore } from "../features/chat/chatStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { useSessionState } from "../features/session/useSessionState"

type InboxScreenProps = NativeStackScreenProps<RootStackParamList, "Inbox">

function formatTimeAgo(isoDate: string | undefined): string {
  if (!isoDate) return ""
  const ts = Date.parse(isoDate)
  if (!Number.isFinite(ts)) return ""
  const deltaMs = Math.max(0, Date.now() - ts)
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return days === 1 ? "1d" : `${days}d`
}

export function InboxScreen(props: InboxScreenProps) {
  const { navigation } = props
  const { threads, threadsFetched, getThreadUnreadCount } = useChatStore()
  const { sessionActor } = useSessionState()
  const currentUserId = sessionActor?.profile.userId

  const now = useMemo(() => Date.now(), [threads])

  const openThread = useCallback(
    (threadId: string) => {
      navigation.navigate("ChatThread", { threadId })
    },
    [navigation]
  )

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <TopBar
          title="Chats"
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              ←
            </ActionButtonCircle>
          }
          rightSlot={<View style={styles.topRightSpacer} />}
        />

        <View style={styles.header}>
          <Text style={styles.eyebrow}>Conversations</Text>
          <Text style={styles.headerTitle}>
            {threads.length === 0
              ? "Your inbox"
              : threads.length === 1
                ? "1 conversation"
                : `${threads.length} conversations`}
          </Text>
          <Text style={styles.headerSubhead}>
            Threads from mutual connections.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {threads.length === 0 ? (
            <EmptyInbox
              isLoading={!threadsFetched}
              myDisplayName={sessionActor?.profile.displayName}
              myUserId={sessionActor?.profile.userId}
              onGoDiscover={() => navigation.goBack()}
            />
          ) : (
            threads.map((thread) => {
              const partnerSummary = thread.participants.find(
                (p) => p.userId !== currentUserId
              ) ?? thread.participants[0]
              const partnerName = partnerSummary?.displayName ?? "Someone"
              const partnerUserId = partnerSummary?.userId ?? ""
              const lastBody = thread.lastMessage?.body
              const lastTime = formatTimeAgo(thread.lastMessage?.sentAt)

              return (
                <Pressable
                  key={thread.threadId}
                  style={({ pressed }) => [
                    cardStyles.card,
                    pressed ? cardStyles.cardPressed : null
                  ]}
                  onPress={() => openThread(thread.threadId)}
                >
                  <Avatar
                    name={partnerName}
                    seed={partnerUserId}
                    size={52}
                    ring="soft"
                  />
                  <View style={cardStyles.body}>
                    <View style={cardStyles.nameRow}>
                      <Text style={cardStyles.name} numberOfLines={1}>
                        {partnerName}
                      </Text>
                      {lastTime ? (
                        <Text style={cardStyles.time}>{lastTime}</Text>
                      ) : null}
                    </View>
                    {lastBody ? (
                      <Text style={cardStyles.preview} numberOfLines={2}>
                        {lastBody}
                      </Text>
                    ) : (
                      <Text style={cardStyles.previewEmpty}>
                        No messages yet
                      </Text>
                    )}
                  </View>
                  <View style={cardStyles.chevronWrap}>
                    {getThreadUnreadCount(thread.threadId) > 0 ? (
                      <View style={cardStyles.unreadDot} />
                    ) : (
                      <Text style={cardStyles.chevron}>›</Text>
                    )}
                  </View>
                </Pressable>
              )
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

interface EmptyInboxProps {
  isLoading: boolean
  myDisplayName?: string
  myUserId?: string
  onGoDiscover?: () => void
}

function EmptyInbox(props: EmptyInboxProps) {
  if (props.isLoading) {
    return (
      <View style={emptyStyles.card}>
        <Text style={emptyStyles.body}>Loading conversations…</Text>
      </View>
    )
  }
  return (
    <View style={emptyStyles.card}>
      <View style={emptyStyles.glow} pointerEvents="none" />
      {props.myDisplayName ? (
        <Avatar
          name={props.myDisplayName}
          seed={props.myUserId ?? props.myDisplayName}
          size={80}
          ring="soft"
        />
      ) : null}
      <Text style={emptyStyles.title}>Your inbox is quiet</Text>
      <Text style={emptyStyles.body}>
        When you and someone both save a moment, a private thread opens here.
        Real conversations start from real connections.
      </Text>
      {props.onGoDiscover ? (
        <Pressable
          onPress={props.onGoDiscover}
          style={({ pressed }) => [
            emptyStyles.ctaButton,
            pressed ? { opacity: 0.85 } : null
          ]}
        >
          <Text style={emptyStyles.ctaText}>Go Discover →</Text>
        </Pressable>
      ) : null}
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
  topRightSpacer: {
    width: 40
  },
  header: {
    gap: uiTheme.spacing.xxs,
    paddingHorizontal: 2,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.md
  },
  eyebrow: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  headerTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.title,
    fontWeight: "800",
    letterSpacing: -0.4
  },
  headerSubhead: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 21,
    marginTop: 2
  },
  scroll: {
    gap: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xxl
  }
})

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.md,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    ...uiTheme.shadow.soft
  },
  cardPressed: {
    backgroundColor: uiTheme.colors.surfaceMuted
  },
  body: {
    flex: 1,
    gap: 3
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.xs
  },
  name: {
    flex: 1,
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  time: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600"
  },
  preview: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 19
  },
  previewEmpty: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.bodySmall,
    fontStyle: "italic"
  },
  chevronWrap: {
    width: 20,
    alignItems: "center"
  },
  chevron: {
    color: uiTheme.colors.textMuted,
    fontSize: 22,
    fontWeight: "700"
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: uiTheme.colors.primary
  }
})

const emptyStyles = StyleSheet.create({
  card: {
    marginTop: uiTheme.spacing.md,
    padding: uiTheme.spacing.xl,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    gap: uiTheme.spacing.sm,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.soft
  },
  glow: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: uiTheme.colors.primarySoft,
    top: -80,
    right: -60,
    opacity: 0.55
  },
  title: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    textAlign: "center"
  },
  body: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: uiTheme.spacing.sm
  },
  ctaButton: {
    marginTop: uiTheme.spacing.xs,
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  }
})
