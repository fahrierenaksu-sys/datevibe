import { SafeAreaProvider } from "react-native-safe-area-context"
import { AvatarV2Provider } from "./src/features/avatarV2/state/AvatarV2Provider"
import { RoomV2Provider } from "./src/features/roomV2/state/RoomV2Provider"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { ErrorBoundary } from "./src/ui/errorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AvatarV2Provider>
          <RoomV2Provider>
            <RootNavigator />
          </RoomV2Provider>
        </AvatarV2Provider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
