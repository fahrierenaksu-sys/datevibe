import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { LobbyScreen } from "../screens/LobbyScreen"
import { SessionBootstrapScreen } from "../screens/SessionBootstrapScreen"
import { useSessionState } from "../features/session/useSessionState"

type RootStackParamList = {
  SessionBootstrap: undefined
  Lobby: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator(): JSX.Element {
  const {
    sessionActor,
    isHydrating,
    isBootstrapping,
    errorMessage,
    bootstrapSessionActor,
    clearSessionActor
  } = useSessionState()

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {sessionActor ? (
          <Stack.Screen name="Lobby" options={{ title: "Lobby" }}>
            {() => (
              <LobbyScreen
                sessionActor={sessionActor}
                onResetSession={clearSessionActor}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="SessionBootstrap"
            options={{ title: "Start Session" }}
          >
            {() => (
              <SessionBootstrapScreen
                isSubmitting={isBootstrapping}
                errorMessage={errorMessage}
                onBootstrap={bootstrapSessionActor}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
})
