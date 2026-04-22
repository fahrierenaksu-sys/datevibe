import { useEffect, useRef } from "react"
import { Animated, Easing, StyleSheet, View } from "react-native"
import { uiTheme } from "./theme"

interface TypingIndicatorProps {
  visible: boolean
}

/**
 * Three-dot bouncing animation to indicate partner is typing.
 * Mount with `visible={true}` when you receive a server typing signal.
 */
export function TypingIndicator(props: TypingIndicatorProps) {
  const { visible } = props
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) {
      dot1.setValue(0)
      dot2.setValue(0)
      dot3.setValue(0)
      return
    }

    const createDotAnimation = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true
          }),
          Animated.delay(600 - delay)
        ])
      )

    const anim = Animated.parallel([
      createDotAnimation(dot1, 0),
      createDotAnimation(dot2, 150),
      createDotAnimation(dot3, 300)
    ])

    anim.start()
    return () => anim.stop()
  }, [dot1, dot2, dot3, visible])

  if (!visible) return null

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                }),
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.xs,
    alignItems: "flex-start"
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.secondary,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: uiTheme.colors.textMuted
  }
})
