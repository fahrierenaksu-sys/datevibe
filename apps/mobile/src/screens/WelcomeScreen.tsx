import { useCallback, useEffect, useRef, useState } from "react"
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
import { LinearGradient } from "../ui/linearGradient"
import { uiTheme } from "../ui/theme"

interface WelcomeScreenProps {
  onComplete: () => void
}

const STEPS = [
  {
    icon: "◎",
    title: "Lead with your avatar",
    body: "Your DateVibe identity starts as an avatar, a name, and a vibe. No photo grid, no generic profile stack."
  },
  {
    icon: "✺",
    title: "Make a room yours",
    body: "Customize your personal room with decor you own. It is the cozy space people remember after they meet you."
  },
  {
    icon: "♡",
    title: "Match into a private room",
    body: "When mutual interest lands, the conversation moves toward a shared mini room instead of endless profile browsing."
  },
  {
    icon: "✦",
    title: "Express yourself",
    body: "Unlock avatar wearables and room decor the app can actually show. Your look and your room should feel like yours."
  }
]

/* ─── Animated dot component ─────────────────────────────────── */

function AnimatedDot({ active }: { active: boolean }) {
  const widthAnim = useRef(new Animated.Value(active ? 28 : 8)).current
  const opacityAnim = useRef(new Animated.Value(active ? 1 : 0.45)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(widthAnim, {
        toValue: active ? 28 : 8,
        damping: uiTheme.animation.spring.damping,
        stiffness: uiTheme.animation.spring.stiffness,
        mass: uiTheme.animation.spring.mass,
        useNativeDriver: false
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.45,
        duration: uiTheme.animation.durationNormal,
        useNativeDriver: false
      })
    ]).start()
  }, [active, widthAnim, opacityAnim])

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: widthAnim,
          opacity: opacityAnim
        }
      ]}
    >
      {active ? (
        <LinearGradient
          colors={uiTheme.gradients.primary}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.dotGradient}
        />
      ) : (
        <View style={styles.dotInactive} />
      )}
    </Animated.View>
  )
}

/* ─── Main screen ─────────────────────────────────────────────── */

export function WelcomeScreen(props: WelcomeScreenProps) {
  const { onComplete } = props
  const { width } = useWindowDimensions()
  const [currentStep, setCurrentStep] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

  // Step card entrance: scale + opacity spring
  const cardScale = useRef(new Animated.Value(1)).current
  const cardOpacity = useRef(new Animated.Value(1)).current

  // Brand row entrance animation
  const brandTranslateY = useRef(new Animated.Value(-18)).current
  const brandOpacity = useRef(new Animated.Value(0)).current

  // Button press scale
  const buttonScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(brandTranslateY, {
        toValue: 0,
        damping: uiTheme.animation.springGentle.damping,
        stiffness: uiTheme.animation.springGentle.stiffness,
        mass: uiTheme.animation.springGentle.mass,
        useNativeDriver: true
      }),
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: uiTheme.animation.durationEntrance,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })
    ]).start()
  }, [brandTranslateY, brandOpacity])

  const animateCardEntrance = useCallback(() => {
    cardScale.setValue(0.92)
    cardOpacity.setValue(0)
    Animated.parallel([
      Animated.spring(cardScale, {
        toValue: 1,
        damping: uiTheme.animation.springBouncy.damping,
        stiffness: uiTheme.animation.springBouncy.stiffness,
        mass: uiTheme.animation.springBouncy.mass,
        useNativeDriver: true
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: uiTheme.animation.durationNormal,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })
    ]).start()
  }, [cardScale, cardOpacity])

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
        animateCardEntrance()
      })
    },
    [fadeAnim, width, animateCardEntrance]
  )

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1)
    } else {
      onComplete()
    }
  }, [currentStep, goToStep, onComplete])

  const handleButtonPressIn = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: uiTheme.animation.scalePress,
      damping: uiTheme.animation.spring.damping,
      stiffness: uiTheme.animation.spring.stiffness,
      useNativeDriver: true
    }).start()
  }, [buttonScale])

  const handleButtonPressOut = useCallback(() => {
    Animated.spring(buttonScale, {
      toValue: 1,
      damping: uiTheme.animation.spring.damping,
      stiffness: uiTheme.animation.spring.stiffness,
      useNativeDriver: true
    }).start()
  }, [buttonScale])

  const isLast = currentStep === STEPS.length - 1

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        {/* Brand row with entrance animation */}
        <Animated.View
          style={[
            styles.brandRow,
            {
              opacity: brandOpacity,
              transform: [{ translateY: brandTranslateY }]
            }
          ]}
        >
          <BrandMark size={36} />
          <Text style={styles.brandText}>DateVibe</Text>
        </Animated.View>

        {/* Step card with scale + opacity spring entrance */}
        <Animated.View
          style={[
            styles.contentWrap,
            {
              opacity: fadeAnim,
              transform: [{ scale: cardScale }]
            }
          ]}
        >
          <Animated.View style={[styles.stepCard, { opacity: cardOpacity }]}>
            {/* Gradient icon circle with glow */}
            <View style={styles.iconCircleOuter}>
              <LinearGradient
                colors={uiTheme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Text style={styles.iconText}>{STEPS[currentStep].icon}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
            <Text style={styles.stepBody}>{STEPS[currentStep].body}</Text>
          </Animated.View>
        </Animated.View>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <AnimatedDot key={i} active={i === currentStep} />
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Animated.View
            style={[
              styles.primaryButtonWrap,
              { transform: [{ scale: buttonScale }] }
            ]}
          >
            <Pressable
              onPress={handleNext}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed ? styles.primaryButtonPressed : null
              ]}
            >
              <LinearGradient
                colors={uiTheme.gradients.primary}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>
                  {isLast ? "Build my vibe" : "Next"}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

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
    ...uiTheme.font.heading,
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
    ...uiTheme.shadow.deep
  },
  iconCircleOuter: {
    borderRadius: 44,
    ...uiTheme.shadow.glow
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: {
    fontSize: 34,
    color: uiTheme.colors.textInverted,
    fontWeight: "800"
  },
  stepTitle: {
    color: uiTheme.colors.textPrimary,
    ...uiTheme.font.title,
    textAlign: "center"
  },
  stepBody: {
    color: uiTheme.colors.textSecondary,
    ...uiTheme.font.body,
    textAlign: "center",
    paddingHorizontal: uiTheme.spacing.sm
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: uiTheme.spacing.lg
  },
  dot: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden"
  },
  dotGradient: {
    flex: 1,
    borderRadius: 4,
    ...uiTheme.shadow.glowSubtle
  },
  dotInactive: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.border
  },
  actions: {
    gap: uiTheme.spacing.md,
    alignItems: "center",
    paddingBottom: uiTheme.spacing.lg
  },
  primaryButtonWrap: {
    width: "100%",
    ...uiTheme.shadow.glow
  },
  primaryButton: {
    width: "100%",
    borderRadius: uiTheme.radius.full,
    overflow: "hidden"
  },
  primaryButtonPressed: {
    opacity: 0.88
  },
  primaryButtonGradient: {
    width: "100%",
    minHeight: 56,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: uiTheme.spacing.md
  },
  primaryButtonText: {
    color: "#FFFFFF",
    ...uiTheme.font.bodyBold,
    fontWeight: "800"
  },
  skipText: {
    color: uiTheme.colors.textMuted,
    ...uiTheme.font.bodySmall,
    fontWeight: "600"
  }
})
