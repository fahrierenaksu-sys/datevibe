import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { ConnectionStatusChip } from "../components/ConnectionStatusChip"
import { PresenceList } from "../components/PresenceList"
import { useLobbyFlow } from "../features/lobby/useLobbyFlow"
import type { SessionActor } from "../features/session/sessionApi"

interface LobbyScreenProps {
  sessionActor: SessionActor
  onResetSession: () => Promise<void>
}

export function LobbyScreen(props: LobbyScreenProps): JSX.Element {
  const { sessionActor, onResetSession } = props

  const { connectionStatus, lobbyState } = useLobbyFlow({
    sessionActor,
    onInvalidSession: () => {
      void onResetSession()
    }
  })

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Public Lobby</Text>
      <ConnectionStatusChip status={connectionStatus} />

      <View style={styles.card}>
        <Text style={styles.label}>User</Text>
        <Text style={styles.value}>
          {sessionActor.profile.displayName} ({sessionActor.profile.userId})
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Room ID</Text>
        <Text style={styles.value}>{lobbyState.roomId}</Text>
        <Text style={styles.label}>Joined</Text>
        <Text style={styles.value}>{lobbyState.isJoined ? "yes" : "no"}</Text>
        <Text style={styles.label}>Assigned spot</Text>
        <Text style={styles.value}>{lobbyState.assignedSpotId ?? "-"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Presence Snapshot</Text>
        <PresenceList users={lobbyState.snapshot?.users ?? []} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nearby Users</Text>
        <Text style={styles.value}>{lobbyState.nearbyUsers.length}</Text>
      </View>

      <Pressable
        style={styles.resetButton}
        onPress={() => {
          void onResetSession()
        }}
      >
        <Text style={styles.resetButtonText}>Reset Session</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: "#ffffff"
  },
  title: {
    fontSize: 24,
    fontWeight: "700"
  },
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
    color: "#111827",
    marginBottom: 4
  },
  resetButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600"
  }
})
