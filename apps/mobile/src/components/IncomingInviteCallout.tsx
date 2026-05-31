import { Pressable, StyleSheet, Text, View } from "react-native"
import { Avatar } from "../ui/avatar"
import { uiTheme } from "../ui/theme"

interface IncomingInviteCalloutProps {
  senderDisplayName: string
  senderUserId: string
  onAccept: () => void
  onDecline: () => void
}

export function IncomingInviteCallout(props: IncomingInviteCalloutProps) {
  const { senderDisplayName, senderUserId, onAccept, onDecline } = props

  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.row}>
        <Avatar name={senderDisplayName} seed={senderUserId} size={52} ring="soft" />
        <View style={styles.textBlock}>
          <Text style={styles.eyebrow}>New invite</Text>
          <Text style={styles.title}>{senderDisplayName} wants to connect</Text>
          <Text style={styles.body}>
            Step into the mini room while the vibe is fresh.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.declineButton,
            pressed ? styles.declineButtonPressed : null
          ]}
          onPress={onDecline}
        >
          <Text style={styles.declineText}>Not now</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.acceptButton,
            pressed ? styles.acceptButtonPressed : null
          ]}
          onPress={onAccept}
        >
          <Text style={styles.acceptText}>Let&apos;s go</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FADAE8",
    padding: uiTheme.spacing.md,
    gap: uiTheme.spacing.sm,
    position: "relative",
    overflow: "hidden",
    ...uiTheme.shadow.lift
  },
  glow: {
    position: "absolute",
    right: -70,
    top: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: uiTheme.colors.primarySoft,
    opacity: 0.7
  },
  row: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
    alignItems: "center"
  },
  textBlock: {
    flex: 1,
    gap: 2
  },
  eyebrow: {
    color: uiTheme.colors.primary,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  title: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800"
  },
  body: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 20
  },
  actions: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
    marginTop: uiTheme.spacing.xs
  },
  declineButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center"
  },
  declineButtonPressed: {
    backgroundColor: uiTheme.colors.surfaceMuted
  },
  declineText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    fontWeight: "700"
  },
  acceptButton: {
    flex: 1.4,
    minHeight: 48,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...uiTheme.shadow.lift
  },
  acceptButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  acceptText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  }
})
