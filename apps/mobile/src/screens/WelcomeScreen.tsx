import { useCallback, useRef, useState } from "react"
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BrandMark } from "../ui/brandMark"
import { uiTheme } from "../ui/theme"

interface WelcomeScreenProps {
  onComplete: () => void
}

const STEPS = [
  {
    icon: "◎",
    title: "Discover nearby",
    body: "See who's around you right now. Avatars, not photos — it's about presence, not appearance."
  },
  {
    icon: "✺",
    title: "Mini rooms",
    body: "When two people vibe, a private mini room opens. A short, real-time moment together."
  },
  {
    icon: "♡",
    title: "Save the moment",
    body: "After a room, decide to save or pass. Mutual saves create a private thread."
  },
  {
    icon: "✦",
    title: "Express yourself",
    body: "Earn coins from matches and rooms. Spend them on hats, frames, and effects in the Avatar Shop."
  }
]

export function WelcomeScreen(props: WelcomeScreenProps) {
  const { onComplete } = props
  const { width } = useWindowDimensions()
  const [currentStep, setCurrentStep] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const goToStep = useCallback(
    (step: number) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true
      }).start(() => {
        setCurrentStep(step)
        scrollRef.current?.scrollTo({ x: step * width, animated: true })
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true
        }).start()
      })
    },
    [fadeAnim, width]
  )

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1)
    } else {
      onComplete()
    }
  }, [currentStep, goToStep, onComplete])

  const isLast = currentStep === STEPS.length - 1

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.brandRow}>
          <BrandMark size={36} />
          <Text style={styles.brandText}>DateVibe</Text>
        </View>

        <Animated.View style={[styles.contentWrap, { opacity: fadeAnim }]}>
          <View style={styles.stepCard}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>{STEPS[currentStep].icon}</Text>
            </View>
            <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
            <Text style={styles.stepBody}>{STEPS[currentStep].body}</Text>
          </View>
        </Animated.View>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep ? styles.dotActive : null
              ]}
            />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </Pressable>

          {!isLast ? (
            <Pressable onPress={onComplete} hitSlop={8}>
              <Text style={styles.skipText}>Skip intro</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
  safe: {
    flex: 1,
    paddingHorizontal: uiTheme.spacing.lg
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingTop: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.md
  },
  brandText: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.heading,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  contentWrap: {
    flex: 1,
    justifyContent: "center"
  },
  stepCard: {
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.surface,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    padding: uiTheme.spacing.xl,
    alignItems: "center",
    gap: uiTheme.spacing.md,
    ...uiTheme.shadow.card
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: uiTheme.colors.chipBackground,
    borderWidth: 1,
    borderColor: "#F4A9CA",
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: {
    fontSize: 32,
    color: uiTheme.colors.primary,
    fontWeight: "800"
  },
  stepTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3
  },
  stepBody: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: uiTheme.spacing.sm
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingVertical: uiTheme.spacing.lg
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.border
  },
  dotActive: {
    width: 24,
    backgroundColor: uiTheme.colors.primary,
    borderRadius: 4
  },
  actions: {
    gap: uiTheme.spacing.md,
    alignItems: "center",
    paddingBottom: uiTheme.spacing.lg
  },
  primaryButton: {
    width: "100%",
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center"
  },
  primaryButtonPressed: {
    opacity: 0.88
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  },
  skipText: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600"
  }
})
