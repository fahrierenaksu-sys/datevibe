import { SafeAreaProvider } from "react-native-safe-area-context"
import { RootNavigator } from "./src/navigation/RootNavigator"

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  )
}
