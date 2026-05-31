import { Pressable, StyleSheet, Text, View } from "react-native"
import { uiTheme } from "../ui/theme"

export type ReactionBarReaction = "wave" | "heart" | "laugh" | "fire"

const REACTION_EMOJI: Record<ReactionBarReaction, string> = {
  wave: "👋",
  heart: "❤️",
  laugh: "😂",
  fire: "🔥"
}

const REACTIONS: readonly ReactionBarReaction[] = ["wave", "heart", "laugh", "fire"]

interface ReactionBarProps {
  disabled: boolean
  onSendReaction: (reaction: ReactionBarReaction) => void
}

export function ReactionBar(props: ReactionBarProps) {
  const { disabled, onSendReaction } = props

  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction) => (
        <Pressable
          key={reaction}
          style={({ pressed }) => [
            styles.button,
            disabled ? styles.buttonDisabled : styles.buttonActive,
            pressed && !disabled ? styles.buttonPressed : null
          ]}
          disabled={disabled}
          onPress={() => {
            onSendReaction(reaction)
          }}
        >
          <Text style={styles.emoji}>{REACTION_EMOJI[reaction]}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: uiTheme.spacing.sm
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1
  },
  buttonActive: {
    backgroundColor: uiTheme.colors.nightSurface,
    borderColor: uiTheme.colors.nightBorder
  },
  buttonDisabled: {
    backgroundColor: uiTheme.colors.nightSurfaceSoft,
    borderColor: "transparent",
    opacity: 0.35
  },
  buttonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    transform: [{ scale: 0.92 }]
  },
  emoji: {
    fontSize: 22
  }
})
