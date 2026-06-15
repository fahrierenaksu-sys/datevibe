import type { ReactionType } from "@datevibe/contracts"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { MiniRoomConnectionStatus, MiniRoomLocalMediaState } from "../miniRoomMediaState"
import { ConnectionPill } from "../../../ui/connectionPill"
import { uiTheme } from "../../../ui/theme"

const REACTION_EMOJI: Record<ReactionType, string> = {
  wave: "👋",
  heart: "❤️",
  laugh: "😂",
  fire: "🔥"
}

const REACTIONS: readonly ReactionType[] = ["wave", "heart", "laugh", "fire"]

interface MiniRoomHudProps {
  connectionStatus: MiniRoomConnectionStatus
  localMedia: MiniRoomLocalMediaState
  canSendReaction: boolean
  leaveDisabled: boolean
  onLeave: () => void
  onOpenSafety: () => void
  onRetryConnect: () => void
  onToggleMic: () => void
  onSendReaction: (reaction: ReactionType) => void
}

export function MiniRoomHud(props: MiniRoomHudProps) {
  const {
    connectionStatus,
    localMedia,
    canSendReaction,
    leaveDisabled,
    onLeave,
    onOpenSafety,
    onRetryConnect,
    onToggleMic,
    onSendReaction
  } = props

  const mediaDisabled = connectionStatus !== "connected"

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.topHud} pointerEvents="box-none">
        <Pressable
          onPress={onLeave}
          disabled={leaveDisabled}
          style={({ pressed }) => [
            styles.circleButton,
            leaveDisabled ? styles.disabled : null,
            pressed ? styles.pressed : null
          ]}
        >
          <Text style={styles.circleButtonText}>←</Text>
        </Pressable>

        <ConnectionPill status={connectionStatus} tone="dark" />

        <View style={styles.topRightDock}>
          {connectionStatus === "error" ? (
            <Pressable
              onPress={onRetryConnect}
              style={({ pressed }) => [
                styles.retryButton,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
          <View style={styles.mediaDock}>
            <Pressable
              onPress={onToggleMic}
              disabled={mediaDisabled}
              style={({ pressed }) => [
                styles.mediaButton,
                localMedia.micEnabled ? styles.mediaButtonActive : null,
                mediaDisabled ? styles.disabled : null,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.mediaText}>{localMedia.micEnabled ? "Mic" : "Mute"}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={onOpenSafety}
            style={({ pressed }) => [
              styles.safetyButton,
              pressed ? styles.pressed : null
            ]}
          >
            <Text style={styles.safetyText}>Safety</Text>
          </Pressable>
        </View>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  topHud: {
    paddingTop: uiTheme.spacing.md,
    paddingHorizontal: uiTheme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomHud: {
    position: "absolute",
    left: uiTheme.spacing.lg,
    right: uiTheme.spacing.lg,
    bottom: uiTheme.spacing.lg,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30, 15, 24, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  circleButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  topRightDock: {
    minWidth: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: uiTheme.spacing.xs,
  },
  retryButton: {
    minHeight: 38,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
  },
  retryText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.primary,
  },
  reactionDock: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 200, 220, 0.5)",
    shadowColor: "#2A0A1A",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  reactionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  reactionPressed: {
    transform: [{ scale: 0.9 }],
    backgroundColor: uiTheme.colors.primarySoft,
  },
  reactionText: {
    fontSize: 22,
  },
  mediaDock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: "rgba(30, 15, 24, 0.52)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  mediaButton: {
    minWidth: 48,
    minHeight: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  mediaButtonActive: {
    backgroundColor: uiTheme.colors.primary,
  },
  safetyButton: {
    minHeight: 38,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 200, 220, 0.5)",
  },
  safetyText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.dangerInk,
  },
  mediaText: {
    ...uiTheme.font.captionBold,
    color: "#FFFFFF",
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
})
