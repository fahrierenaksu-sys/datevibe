import type { PresenceUser } from "@datevibe/contracts"
import { StyleSheet, Text, View } from "react-native"

interface PresenceListProps {
  users: PresenceUser[]
}

function renderPresenceItem(user: PresenceUser) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{user.displayName}</Text>
      <Text style={styles.meta}>{user.spotId}</Text>
    </View>
  )
}

export function PresenceList(props: PresenceListProps) {
  const { users } = props

  if (users.length === 0) {
    return <Text style={styles.empty}>No users in presence snapshot yet.</Text>
  }

  return (
    <View style={styles.listContent}>
      {users.map((user, index) => (
        <View key={user.userId}>
          {renderPresenceItem(user)}
          {index < users.length - 1 ? <View style={styles.separator} /> : null}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 4
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 2
  },
  name: {
    fontSize: 15,
    fontWeight: "500"
  },
  meta: {
    fontSize: 13,
    color: "#6b7280"
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
