import { SafeAreaProvider } from "react-native-safe-area-context"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { ErrorBoundary } from "./src/ui/errorBoundary"

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
