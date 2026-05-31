import { Component, type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { uiTheme } from "./theme"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Graceful error boundary — catches unhandled React errors
 * and shows a branded recovery screen instead of crashing.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Future: send to error reporting service
    // eslint-disable-next-line no-console
    console.error("[DateVibe ErrorBoundary]", error, info.componentStack)
  }

  private handleRecover = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <View style={styles.card}>
            <Text style={styles.emoji}>💫</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.body}>
              DateVibe hit an unexpected problem. Your data is safe.
            </Text>
            {this.state.error ? (
              <Text style={styles.errorDetail} numberOfLines={3}>
                {this.state.error.message}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.recoverButton,
                pressed ? { opacity: 0.88 } : null
              ]}
              onPress={this.handleRecover}
            >
              <Text style={styles.recoverText}>Try Again</Text>
            </Pressable>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.background,
    paddingHorizontal: uiTheme.spacing.xl
  },
  card: {
    width: "100%",
    borderRadius: uiTheme.radius.xxl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.xl,
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    ...uiTheme.shadow.card
  },
  emoji: {
    fontSize: 48,
    marginBottom: uiTheme.spacing.xs
  },
  title: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800",
    textAlign: "center"
  },
  body: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    textAlign: "center",
    lineHeight: 20
  },
  errorDetail: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontFamily: "monospace",
    backgroundColor: uiTheme.colors.surfaceMuted,
    borderRadius: uiTheme.radius.md,
    padding: uiTheme.spacing.sm,
    alignSelf: "stretch",
    overflow: "hidden"
  },
  recoverButton: {
    paddingHorizontal: uiTheme.spacing.xxl,
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    marginTop: uiTheme.spacing.sm
  },
  recoverText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  }
})
