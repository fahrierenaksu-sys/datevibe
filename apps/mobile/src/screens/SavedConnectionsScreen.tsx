import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useMemo, useRef } from "react"
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { LinearGradient } from "../ui/linearGradient"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  removeSavedConnection,
  useSavedConnections,
  type SavedConnection,
  type SavedConnectionStatus
} from "../features/connections/savedConnectionsStore"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import { ActionButtonCircle, TopBar } from "../ui/primitives"
import { uiTheme } from "../ui/theme"
import { findThreadForPartner } from "../features/chat/chatStore"

type SavedConnectionsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "SavedConnections"
>

function formatMetAt(savedAt: string, now: number): string {
  const ts = Date.parse(savedAt)
  if (!Number.isFinite(ts)) return "Met recently"
  const deltaMs = Math.max(0, now - ts)
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) return "Met just now"
  if (minutes < 60) return `Met ${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Met ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Met yesterday"
  if (days < 7) return `Met ${days} days ago`
  const date = new Date(ts)
  const month = date.toLocaleString(undefined, { month: "short" })
  return `Met ${month} ${date.getDate()}`
}

function formatDuration(totalSeconds: number | undefined): string | null {
  if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds)) {
    return null
  }
  const safe = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  if (minutes <= 0) return `${seconds}s together`
  if (seconds === 0) return `${minutes} min together`
  return `${minutes} min ${seconds}s together`
}

function formatMoment(entry: SavedConnection): string {
  const duration = formatDuration(entry.durationSeconds)
  if (entry.connected === false) {
    return "Saved after a room that never fully connected"
  }
  return duration ?? "Saved from a mini-room"
}

function getStatusCopy(status: SavedConnectionStatus | undefined): string {
  switch (status ?? "local-only") {
    case "pending":
      return "Waiting for mutual save"
    case "mutual":
      return "Mutual save confirmed"
    case "unmatched":
      return "Closed privately"
    case "local-only":
      return "Private on this device"
  }
}

export function SavedConnectionsScreen(props: SavedConnectionsScreenProps) {
  const { navigation } = props
  const { saved, isHydrating } = useSavedConnections()
  const now = useMemo(() => Date.now(), [saved])

  const count = saved.length

  const handleOpenChat = useCallback(
    (userId: string, displayName: string): void => {
      const thread = findThreadForPartner(userId)
      if (thread) {
        navigation.navigate("ChatThread", { threadId: thread.threadId })
      } else {
        navigation.navigate("ChatThread", { partnerId: userId, partnerName: displayName })
      }
    },
    [navigation]
  )

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <TopBar
          title="Saved"
          titleAlign="start"
          leftSlot={
            <ActionButtonCircle onPress={() => navigation.goBack()} size={40}>
              ←
            </ActionButtonCircle>
          }
          rightSlot={<View style={styles.topRightSpacer} />}
        />

        <View style={styles.header}>
          <Text style={styles.eyebrow}>People you met</Text>
          <Text style={styles.headerTitle}>
            {count === 0
              ? "Your memory shelf"
              : count === 1
                ? "1 person saved"
                : `${count} people saved`}
          </Text>
          <Text style={styles.headerSubhead}>
            Private moments saved on this device.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {count === 0 ? (
            <EmptyShelf isHydrating={isHydrating} />
          ) : (
            saved.map((entry) => (
              <SavedCard key={entry.userId} entry={entry} now={now} onOpenChat={handleOpenChat} />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

interface SavedCardProps {
  entry: SavedConnection
  now: number
  onOpenChat?: (userId: string, displayName: string) => void
}

function SavedCard(props: SavedCardProps) {
  const { entry, now, onOpenChat } = props
  const metLabel = formatMetAt(entry.savedAt, now)
  const momentLabel = formatMoment(entry)
  const status = entry.status ?? "local-only"
  const statusCopy = getStatusCopy(status)
  const isMutual = status === "mutual"
  const msgScaleAnim = useRef(new Animated.Value(1)).current

  const onRemove = (): void => {
    void removeSavedConnection({ userId: entry.userId })
  }

  const handleMessage = (): void => {
    if (onOpenChat) onOpenChat(entry.userId, entry.displayName)
  }

  const handleMsgPressIn = () => {
    Animated.spring(msgScaleAnim, {
      toValue: uiTheme.animation.scalePress,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handleMsgPressOut = () => {
    Animated.spring(msgScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
  }

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.avatarGlow}>
        <Avatar
          name={entry.displayName}
          seed={entry.userId}
          size={64}
          ring="soft"
        />
      </View>
      <View style={cardStyles.body}>
        <Text style={cardStyles.name} numberOfLines={1}>
          {entry.displayName}
        </Text>
        <Text style={cardStyles.met}>{metLabel}</Text>
        <Text style={cardStyles.moment}>{momentLabel}</Text>
        <View
          style={[
            cardStyles.privacyPill,
            isMutual ? cardStyles.privacyPillMutual : null
          ]}
        >
          <View
            style={[
              cardStyles.privacyDot,
              isMutual ? cardStyles.privacyDotMutual : null,
              status === "unmatched" ? cardStyles.privacyDotUnmatched : null
            ]}
          />
          <Text
            style={[
              cardStyles.privacyText,
              isMutual ? cardStyles.privacyTextMutual : null
            ]}
          >
            {statusCopy}
          </Text>
        </View>
      </View>
      <View style={cardStyles.actions}>
        {isMutual ? (
          <Animated.View style={{ transform: [{ scale: msgScaleAnim }] }}>
            <Pressable
              onPress={handleMessage}
              onPressIn={handleMsgPressIn}
              onPressOut={handleMsgPressOut}
              hitSlop={10}
              style={cardStyles.messageButton}
            >
              <LinearGradient
                colors={uiTheme.gradients.primary as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={cardStyles.messageGradient}
              >
                <Text style={cardStyles.messageText}>Message</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ) : null}
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={({ pressed }) => [
            cardStyles.removeButton,
            pressed ? cardStyles.removeButtonPressed : null
          ]}
        >
          <Text style={cardStyles.removeText}>Remove</Text>
        </Pressable>
      </View>
    </View>
  )
}

interface EmptyShelfProps {
  isHydrating: boolean
}

function EmptyShelf(props: EmptyShelfProps) {
  if (props.isHydrating) {
    return (
      <View style={emptyStyles.card}>
        <Text style={emptyStyles.body}>Opening your shelf…</Text>
      </View>
    )
  }
  return (
    <View style={emptyStyles.card}>
      <LinearGradient
        colors={["#FFFFFF", "#FFF8FB", "#FFF0F6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={emptyStyles.glow} pointerEvents="none" />
      <View style={emptyStyles.iconCircle}>
        <Text style={emptyStyles.iconText}>✦</Text>
      </View>
      <Text style={emptyStyles.title}>Nobody saved yet</Text>
      <Text style={emptyStyles.body}>
        When a mini-room ends, you choose who stays. The people you save will
        live here as private local memories.
      </Text>
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
  topRightSpacer: {
    width: 40,
  },
  header: {
    gap: uiTheme.spacing.xxs,
    paddingHorizontal: 2,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.md,
  },
  eyebrow: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  headerTitle: {
    ...uiTheme.font.title,
    color: uiTheme.colors.textPrimary,
  },
  headerSubhead: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    marginTop: 2,
  },
  scroll: {
    gap: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xxl,
  },
})

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.md,
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.float,
  },
  avatarGlow: {
    ...uiTheme.shadow.glowSubtle,
    borderRadius: 32,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    ...uiTheme.font.subheading,
    color: uiTheme.colors.textPrimary,
  },
  met: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
  },
  moment: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textPrimary,
    fontWeight: "700",
    lineHeight: 19,
  },
  privacyPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
  },
  privacyPillMutual: {
    backgroundColor: uiTheme.colors.successSoft,
    borderColor: "rgba(58, 192, 138, 0.28)",
  },
  privacyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.primary,
  },
  privacyDotMutual: {
    backgroundColor: uiTheme.colors.success,
  },
  privacyDotUnmatched: {
    backgroundColor: uiTheme.colors.textMuted,
  },
  privacyText: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted,
  },
  privacyTextMutual: {
    color: uiTheme.colors.successInk,
  },
  removeButton: {
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
  },
  removeButtonPressed: {
    backgroundColor: uiTheme.colors.surfaceMuted,
  },
  removeText: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
    letterSpacing: 0.3,
  },
  actions: {
    gap: uiTheme.spacing.xs,
    alignItems: "flex-end",
  },
  messageButton: {
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glowSubtle,
  },
  messageGradient: {
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
  },
  messageText: {
    ...uiTheme.font.captionBold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
})

const emptyStyles = StyleSheet.create({
  card: {
    marginTop: uiTheme.spacing.md,
    padding: uiTheme.spacing.xl,
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    gap: uiTheme.spacing.md,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.float,
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: uiTheme.colors.accentGlow,
    top: -100,
    right: -70,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: uiTheme.colors.chipBackground,
    alignItems: "center",
    justifyContent: "center",
    ...uiTheme.shadow.soft,
  },
  iconText: {
    fontSize: 24,
    color: uiTheme.colors.primary,
  },
  title: {
    ...uiTheme.font.subheading,
    color: uiTheme.colors.textPrimary,
    textAlign: "center",
  },
  body: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: uiTheme.spacing.sm,
  },
})
