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
  onRetryConnect: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
  onSendReaction: (reaction: ReactionType) => void
}

export function MiniRoomHud(props: MiniRoomHudProps) {
  const {
    connectionStatus,
    localMedia,
    canSendReaction,
    leaveDisabled,
    onLeave,
    onRetryConnect,
    onToggleMic,
    onToggleCamera,
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
            <Pressable
              onPress={onToggleCamera}
              disabled={mediaDisabled}
              style={({ pressed }) => [
                styles.mediaButton,
                localMedia.cameraEnabled ? styles.mediaButtonActive : null,
                mediaDisabled ? styles.disabled : null,
                pressed ? styles.pressed : null
              ]}
            >
              <Text style={styles.mediaText}>{localMedia.cameraEnabled ? "Cam" : "Off"}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.bottomHud} pointerEvents="box-none">
        <View style={styles.reactionDock}>
          {REACTIONS.map((reaction) => (
            <Pressable
              key={reaction}
              disabled={!canSendReaction}
              onPress={() => onSendReaction(reaction)}
              style={({ pressed }) => [
                styles.reactionButton,
                !canSendReaction ? styles.disabled : null,
                pressed ? styles.reactionPressed : null
              ]}
            >
              <Text style={styles.reactionText}>{REACTION_EMOJI[reaction]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  topHud: {
    position: "absolute",
    top: uiTheme.spacing.md,
    left: uiTheme.spacing.md,
    right: uiTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  bottomHud: {
    position: "absolute",
    left: uiTheme.spacing.md,
    right: uiTheme.spacing.md,
    bottom: uiTheme.spacing.md
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(42, 24, 34, 0.56)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)"
  },
  circleButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900"
  },
  topRightDock: {
    minWidth: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: uiTheme.spacing.xs
  },
  retryButton: {
    minHeight: 38,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)"
  },
  retryText: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  reactionDock: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.xs,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 218, 233, 0.9)"
  },
  reactionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)"
  },
  reactionPressed: {
    transform: [{ scale: 0.92 }],
    backgroundColor: uiTheme.colors.primarySoft
  },
  reactionText: {
    fontSize: 20
  },
  mediaDock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(42, 24, 34, 0.52)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)"
  },
  mediaButton: {
    minWidth: 46,
    minHeight: 34,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  mediaButtonActive: {
    backgroundColor: uiTheme.colors.primary
  },
  mediaText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.caption,
    fontWeight: "900"
  },
  disabled: {
    opacity: 0.42
  },
  pressed: {
    opacity: 0.78
  }
})
