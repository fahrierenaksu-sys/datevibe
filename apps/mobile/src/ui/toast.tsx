/**
 * In-app toast notification system.
 *
 * Usage:
 *   showToast({ title: "New match!", body: "You matched with Luna", type: "success" })
 *
 * Renders at the top of the app — slides in, auto-dismisses after 3s.
 */

import { useEffect, useRef, useState } from "react"
import { Animated, Pressable, StyleSheet, Text, View } from "react-native"
import { uiTheme } from "./theme"

type ToastType = "info" | "success" | "warning"

interface ToastData {
  id: string
  title: string
  body?: string
  type: ToastType
  durationMs?: number
}

// ── Global toast state ──────────────────────────────────────
type ToastListener = (toast: ToastData | null) => void
const listeners: Set<ToastListener> = new Set()
let currentToast: ToastData | null = null
let toastCounter = 0
let dismissTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(opts: Omit<ToastData, "id">): void {
  if (dismissTimer) clearTimeout(dismissTimer)
  toastCounter += 1
  const toast: ToastData = { ...opts, id: `toast_${toastCounter}` }
  currentToast = toast
  for (const l of listeners) l(toast)

  dismissTimer = setTimeout(() => {
    currentToast = null
    for (const l of listeners) l(null)
    dismissTimer = null
  }, opts.durationMs ?? 3000)
}

export function dismissToast(): void {
  if (dismissTimer) clearTimeout(dismissTimer)
  currentToast = null
  for (const l of listeners) l(null)
}

// ── UI Component ────────────────────────────────────────────

const TYPE_CONFIG: Record<ToastType, { bg: string; border: string; icon: string; textColor: string }> = {
  success: {
    bg: uiTheme.colors.successSoft,
    border: "rgba(58, 192, 138, 0.3)",
    icon: "✓",
    textColor: uiTheme.colors.successInk
  },
  info: {
    bg: uiTheme.colors.primarySoft,
    border: "#F4A9CA",
    icon: "◆",
    textColor: uiTheme.colors.primaryDeep
  },
  warning: {
    bg: uiTheme.colors.warning,
    border: "#F5D090",
    icon: "!",
    textColor: "#78350F"
  }
}

export function ToastContainer() {
  const [toast, setToast] = useState<ToastData | null>(currentToast)
  const slideAnim = useRef(new Animated.Value(-100)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const listener: ToastListener = (t) => setToast(t)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 250
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start()
    }
  }, [toast, slideAnim, opacityAnim])

  if (!toast) return null

  const config = TYPE_CONFIG[toast.type]

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <Pressable style={styles.content} onPress={dismissToast}>
        <View style={[styles.iconCircle, { borderColor: config.border }]}>
          <Text style={[styles.icon, { color: config.textColor }]}>
            {config.icon}
          </Text>
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: config.textColor }]} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.body ? (
            <Text style={[styles.body, { color: config.textColor }]} numberOfLines={2}>
              {toast.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: uiTheme.spacing.md,
    right: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    zIndex: 200,
    ...uiTheme.shadow.card
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.5)"
  },
  icon: {
    fontSize: 14,
    fontWeight: "800"
  },
  textWrap: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  body: {
    fontSize: uiTheme.typography.caption,
    fontWeight: "600",
    opacity: 0.85
  }
})
