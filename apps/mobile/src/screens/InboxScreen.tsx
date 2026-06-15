import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useRef } from "react"
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useChatStore } from "../features/chat/chatStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { MyAvatar } from "../ui/myAvatar"
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

/* ── Animated conversation card ─────────────────────────────── */

interface ConversationCardProps {
  partnerName: string
  partnerUserId: string
  lastBody: string | undefined
  lastTime: string
  hasUnread: boolean
  onPress: () => void
}

function ConversationCard(props: ConversationCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!props.hasUnread) return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.45,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [props.hasUnread, pulseAnim])

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start()
  }, [scaleAnim])

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start()
  }, [scaleAnim])

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        style={cardStyles.card}
        onPress={props.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Gradient left accent */}
        <LinearGradient
          colors={uiTheme.gradients.primary}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={cardStyles.leftAccent}
        />

        {/* Avatar with online dot */}
        <View style={cardStyles.avatarWrap}>
          <Avatar
            name={props.partnerName}
            seed={props.partnerUserId}
            size={56}
            ring="soft"
          />
          <View style={cardStyles.onlineDotOuter}>
            <View style={cardStyles.onlineDot} />
          </View>
        </View>

        <View style={cardStyles.body}>
          <View style={cardStyles.nameRow}>
            <Text style={cardStyles.name} numberOfLines={1}>
              {props.partnerName}
            </Text>
            {props.lastTime ? (
              <Text style={cardStyles.time}>{props.lastTime}</Text>
            ) : null}
          </View>
          {props.lastBody ? (
            <Text style={cardStyles.preview} numberOfLines={2}>
              {props.lastBody}
            </Text>
          ) : (
            <Text style={cardStyles.previewEmpty}>
              No messages yet
            </Text>
          )}
        </View>

        <View style={cardStyles.chevronWrap}>
          {props.hasUnread ? (
            <View style={cardStyles.unreadWrap}>
              <Animated.View
                style={[
                  cardStyles.unreadGlow,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              />
              <LinearGradient
                colors={uiTheme.gradients.primary}
                style={cardStyles.unreadDot}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </View>
          ) : (
            <Text style={cardStyles.chevron}>›</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

/* ── Main InboxScreen ───────────────────────────────────────── */

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
          {/* Gradient underline */}
          <LinearGradient
            colors={[uiTheme.colors.primary, uiTheme.colors.primarySoft, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerUnderline}
          />
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
              const rawLastBody = thread.lastMessage?.body
              const lastBody =
                rawLastBody?.trim() === "__room_invite__"
                  ? "MiniRoom invite"
                  : rawLastBody
              const lastTime = formatTimeAgo(thread.lastMessage?.sentAt)

              return (
                <ConversationCard
                  key={thread.threadId}
                  partnerName={partnerName}
                  partnerUserId={partnerUserId}
                  lastBody={lastBody}
                  lastTime={lastTime}
                  hasUnread={getThreadUnreadCount(thread.threadId) > 0}
                  onPress={() => openThread(thread.threadId)}
                />
              )
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

/* ── Empty Inbox ────────────────────────────────────────────── */

interface EmptyInboxProps {
  isLoading: boolean
  myDisplayName?: string
  myUserId?: string
  onGoDiscover?: () => void
}

function EmptyInbox(props: EmptyInboxProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(24)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: uiTheme.animation.durationEntrance,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: uiTheme.animation.durationEntrance,
        useNativeDriver: true
      })
    ]).start()
  }, [fadeAnim, slideAnim])

  if (props.isLoading) {
    return (
      <Animated.View
        style={[
          emptyStyles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={emptyStyles.body}>Loading conversations…</Text>
      </Animated.View>
    )
  }
  return (
    <Animated.View
      style={[
        emptyStyles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      {/* Gradient glow orb */}
      <LinearGradient
        colors={[uiTheme.colors.accentGlowStrong, uiTheme.colors.primarySoft, "transparent"]}
        style={emptyStyles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      {props.myDisplayName ? (
        <MyAvatar
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
            emptyStyles.ctaOuter,
            pressed ? { opacity: 0.85 } : null
          ]}
        >
          <LinearGradient
            colors={uiTheme.gradients.warm}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={emptyStyles.ctaGradient}
          >
            <Text style={emptyStyles.ctaText}>Go Discover →</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </Animated.View>
  )
}

/* ── Styles ─────────────────────────────────────────────────── */

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
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary
  },
  headerTitle: {
    ...uiTheme.font.title,
    color: uiTheme.colors.textPrimary
  },
  headerSubhead: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    marginTop: 2
  },
  headerUnderline: {
    height: 3,
    borderRadius: 2,
    width: "40%",
    marginTop: uiTheme.spacing.xs
  },
  scroll: {
    gap: uiTheme.spacing.sm + 2,
    paddingBottom: uiTheme.spacing.xxl
  }
})

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.md,
    padding: uiTheme.spacing.md,
    paddingLeft: uiTheme.spacing.md + 4,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.float
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 2.5,
    borderRadius: 2
  },
  avatarWrap: {
    position: "relative"
  },
  onlineDotOuter: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: uiTheme.colors.surface,
    alignItems: "center",
    justifyContent: "center"
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.success
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
    ...uiTheme.font.subheading
  },
  time: {
    color: uiTheme.colors.textMuted,
    ...uiTheme.font.caption
  },
  preview: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.bodySmall
  },
  previewEmpty: {
    color: uiTheme.colors.textMuted,
    ...uiTheme.font.bodySmall,
    fontStyle: "italic"
  },
  chevronWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center"
  },
  chevron: {
    color: uiTheme.colors.textMuted,
    fontSize: 22,
    fontWeight: "700"
  },
  unreadWrap: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  unreadGlow: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: uiTheme.colors.accentGlow
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5
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
    ...uiTheme.shadow.float
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -100,
    right: -80,
    opacity: 0.6
  },
  title: {
    color: uiTheme.colors.textPrimary,
    ...uiTheme.font.subheading,
    fontWeight: "800",
    textAlign: "center"
  },
  body: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.bodySmall,
    textAlign: "center",
    paddingHorizontal: uiTheme.spacing.sm
  },
  ctaOuter: {
    marginTop: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    overflow: "hidden"
  },
  ctaGradient: {
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  ctaText: {
    color: "#FFFFFF",
    ...uiTheme.font.bodySmall,
    fontWeight: "800"
  }
})
