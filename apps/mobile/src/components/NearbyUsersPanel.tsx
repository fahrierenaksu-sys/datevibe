import { Pressable, StyleSheet, Text, View } from "react-native"
import { uiTheme } from "../ui/theme"

export interface NearbyUsersPanelUser {
  userId: string
  displayName: string
  spotId: string
  distance: number
  canInvite: boolean
  blocked: boolean
}

interface NearbyUsersPanelProps {
  users: NearbyUsersPanelUser[]
  isLobbyJoined: boolean
  isConnected: boolean
  onSendInvite: (recipientUserId: string) => void
}

function formatDistance(distance: number): string {
  if (!Number.isFinite(distance)) {
    return "-"
  }
  if (Number.isInteger(distance)) {
    return String(distance)
  }
  return distance.toFixed(1)
}

export function NearbyUsersPanel(props: NearbyUsersPanelProps) {
  const { users, isLobbyJoined, isConnected, onSendInvite } = props

  if (users.length === 0) {
    return <Text style={styles.empty}>No nearby users.</Text>
  }

  return (
    <View style={styles.container}>
      {users.map((user, index) => {
        const canSendInvite = isConnected && isLobbyJoined && user.canInvite
        return (
          <View key={user.userId}>
            <View style={styles.row}>
              <View style={styles.metaContainer}>
                <Text style={styles.name}>{user.displayName}</Text>
                <Text style={styles.meta}>
                  spot {user.spotId} · distance {formatDistance(user.distance)}
                </Text>
                <Text style={styles.meta}>
                  {user.blocked ? "interaction blocked" : user.canInvite ? "can invite" : "invite unavailable"}
                </Text>
              </View>
              <Pressable
                style={[styles.inviteButton, !canSendInvite && styles.inviteButtonDisabled]}
                disabled={!canSendInvite}
                onPress={() => {
                  onSendInvite(user.userId)
                }}
              >
                <Text style={[styles.inviteButtonText, !canSendInvite && styles.inviteButtonTextDisabled]}>
                  Invite
                </Text>
              </Pressable>
            </View>
            {index < users.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: uiTheme.spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
  },
  metaContainer: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textPrimary,
    fontWeight: "700",
  },
  meta: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textMuted,
  },
  inviteButton: {
    borderWidth: 1.5,
    borderColor: uiTheme.colors.primary,
    borderRadius: uiTheme.radius.full,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.xs,
    backgroundColor: uiTheme.colors.chipBackground,
  },
  inviteButtonDisabled: {
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surfaceMuted,
  },
  inviteButtonText: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.primary,
  },
  inviteButtonTextDisabled: {
    color: uiTheme.colors.textMuted,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: uiTheme.colors.divider,
  },
  empty: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textMuted,
  },
})
