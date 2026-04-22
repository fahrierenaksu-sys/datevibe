import type { MiniRoomInvite, PresenceUser } from "@datevibe/contracts"
import { Pressable, StyleSheet, Text, View } from "react-native"

interface IncomingInviteCardProps {
  invite: MiniRoomInvite | null
  presenceUsers: PresenceUser[]
  disabled: boolean
  onAccept: () => void
  onDecline: () => void
}

function getSenderDisplayName(invite: MiniRoomInvite, users: PresenceUser[]): string {
  const sender = users.find((user) => user.userId === invite.senderUserId)
  return sender?.displayName ?? invite.senderUserId
}

export function IncomingInviteCard(props: IncomingInviteCardProps) {
  const { invite, presenceUsers, disabled, onAccept, onDecline } = props

  if (!invite) {
    return (
      <View style={styles.card}>
        <Text style={styles.label}>Incoming Invite</Text>
        <Text style={styles.value}>No incoming invite.</Text>
      </View>
    )
  }

  const senderDisplayName = getSenderDisplayName(invite, presenceUsers)

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Incoming Invite</Text>
      <Text style={styles.value}>{senderDisplayName} invited you to a private mini room.</Text>
      <Text style={styles.meta}>Invite ID: {invite.inviteId}</Text>
      <View style={styles.actions}>
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          disabled={disabled}
          onPress={onAccept}
        >
          <Text style={styles.buttonText}>Accept</Text>
        </Pressable>
        <Pressable
          style={[styles.button, disabled && styles.buttonDisabled]}
          disabled={disabled}
          onPress={onDecline}
        >
          <Text style={styles.buttonText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    gap: 4
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase"
  },
  value: {
    fontSize: 14,
    color: "#111827"
  },
  meta: {
    fontSize: 12,
    color: "#6b7280"
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  button: {
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  buttonDisabled: {
    borderColor: "#d1d5db",
    backgroundColor: "#f3f4f6"
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827"
  }
})
