import { Pressable, StyleSheet, Text, View } from "react-native"

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
                <Text style={styles.inviteButtonText}>Invite</Text>
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
    paddingVertical: 4
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 8
  },
  metaContainer: {
    flex: 1,
    gap: 2
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827"
  },
  meta: {
    fontSize: 12,
    color: "#6b7280"
  },
  inviteButton: {
    borderWidth: 1,
    borderColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  inviteButtonDisabled: {
    borderColor: "#d1d5db",
    backgroundColor: "#f3f4f6"
  },
  inviteButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827"
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#d1d5db"
  },
  empty: {
    fontSize: 13,
    color: "#6b7280"
  }
})
