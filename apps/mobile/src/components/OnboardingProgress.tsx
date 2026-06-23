import { StyleSheet, Text, View } from "react-native"
import { uiTheme } from "../ui/theme"

const STEPS = ["Profile", "Avatar", "Room"] as const

interface OnboardingProgressProps {
  activeStep: 0 | 1 | 2
}

export function OnboardingProgress({
  activeStep
}: OnboardingProgressProps) {
  return (
    <View
      accessibilityLabel={`Setup step ${activeStep + 1} of ${STEPS.length}: ${STEPS[activeStep]}`}
      style={styles.root}
    >
      {STEPS.map((step, index) => (
        <View key={step} style={styles.step}>
          <View
            style={[
              styles.dot,
              index <= activeStep ? styles.dotActive : null
            ]}
          />
          <Text
            style={[
              styles.label,
              index === activeStep ? styles.labelActive : null
            ]}
          >
            {step}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    justifyContent: "center",
    gap: uiTheme.spacing.lg
  },
  step: {
    alignItems: "center",
    gap: uiTheme.spacing.xxs
  },
  dot: {
    width: 30,
    height: 5,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.borderStrong
  },
  dotActive: {
    backgroundColor: uiTheme.colors.primary
  },
  label: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textMuted
  },
  labelActive: {
    color: uiTheme.colors.primaryDeep
  }
})
