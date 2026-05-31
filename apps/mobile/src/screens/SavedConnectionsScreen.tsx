import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useMemo } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
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

  const onRemove = (): void => {
    void removeSavedConnection({ userId: entry.userId })
  }

  const handleMessage = (): void => {
    if (onOpenChat) onOpenChat(entry.userId, entry.displayName)
  }

  return (
    <View style={cardStyles.card}>
      <Avatar
        name={entry.displayName}
        seed={entry.userId}
        size={64}
        ring="soft"
      />
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
          <Pressable
            onPress={handleMessage}
            hitSlop={10}
            style={({ pressed }) => [
              cardStyles.messageButton,
              pressed ? cardStyles.messageButtonPressed : null
            ]}
          >
            <Text style={cardStyles.messageText}>Message</Text>
          </Pressable>
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
      <View style={emptyStyles.glow} pointerEvents="none" />
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
  body: {
    flex: 1,
    gap: 4
  },
  name: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    letterSpacing: -0.2
  },
  met: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "600"
  },
  moment: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700",
    lineHeight: 19
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
    borderColor: uiTheme.colors.border
  },
  privacyPillMutual: {
    backgroundColor: uiTheme.colors.successSoft,
    borderColor: "rgba(58, 192, 138, 0.28)"
  },
  privacyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.primary
  },
  privacyDotMutual: {
    backgroundColor: uiTheme.colors.success
  },
  privacyDotUnmatched: {
    backgroundColor: uiTheme.colors.textMuted
  },
  privacyText: {
    color: uiTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  privacyTextMutual: {
    color: uiTheme.colors.successInk
  },
  removeButton: {
    paddingHorizontal: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full
  },
  removeButtonPressed: {
    backgroundColor: uiTheme.colors.surfaceMuted
  },
  removeText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.3
  },
  actions: {
    gap: uiTheme.spacing.xs,
    alignItems: "flex-end"
  },
  messageButton: {
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary
  },
  messageButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.3
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
  }
})
