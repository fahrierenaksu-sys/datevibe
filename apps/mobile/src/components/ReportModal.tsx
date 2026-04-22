import { useCallback, useState } from "react"
import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { type ReportReason, blockUser, submitReport } from "../features/safety/blockStore"
import { hapticMedium, hapticStrong } from "../ui/haptics"
import { showToast } from "../ui/toast"
import { uiTheme } from "../ui/theme"

interface ReportModalProps {
  visible: boolean
  targetUserId: string
  targetDisplayName: string
  onClose: () => void
}

const REASONS: { key: ReportReason; label: string; icon: string }[] = [
  { key: "inappropriate", label: "Inappropriate content", icon: "⚠" },
  { key: "harassment", label: "Harassment or bullying", icon: "🚫" },
  { key: "spam", label: "Spam or scam", icon: "✉" },
  { key: "underage", label: "Under 18", icon: "🔞" },
  { key: "other", label: "Something else", icon: "…" }
]

export function ReportModal(props: ReportModalProps) {
  const { visible, targetUserId, targetDisplayName, onClose } = props
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [step, setStep] = useState<"reason" | "confirm" | "done">("reason")

  const handleSelectReason = useCallback((reason: ReportReason) => {
    setSelectedReason(reason)
    hapticMedium()
    setStep("confirm")
  }, [])

  const handleBlock = useCallback(() => {
    blockUser(targetUserId)
    hapticStrong()
    showToast({ title: `${targetDisplayName} blocked`, type: "info" })
    onClose()
    resetState()
  }, [targetUserId, targetDisplayName, onClose])

  const handleReportAndBlock = useCallback(() => {
    if (!selectedReason) return
    submitReport({ targetUserId, reason: selectedReason })
    hapticStrong()
    showToast({
      title: "Report submitted",
      body: `${targetDisplayName} has been blocked`,
      type: "success"
    })
    setStep("done")
    setTimeout(() => {
      onClose()
      resetState()
    }, 800)
  }, [selectedReason, targetUserId, targetDisplayName, onClose])

  const resetState = () => {
    setSelectedReason(null)
    setStep("reason")
  }

  const handleClose = useCallback(() => {
    onClose()
    resetState()
  }, [onClose])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>
              {step === "done" ? "Done" : `Report ${targetDisplayName}`}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>

          {step === "reason" ? (
            <View style={styles.body}>
              <Text style={styles.subtitle}>
                Why are you reporting this person?
              </Text>
              {REASONS.map((r) => (
                <Pressable
                  key={r.key}
                  style={({ pressed }) => [
                    styles.reasonCard,
                    pressed ? styles.reasonCardPressed : null
                  ]}
                  onPress={() => handleSelectReason(r.key)}
                >
                  <Text style={styles.reasonIcon}>{r.icon}</Text>
                  <Text style={styles.reasonLabel}>{r.label}</Text>
                  <Text style={styles.reasonChevron}>›</Text>
                </Pressable>
              ))}

              <View style={styles.divider} />

              <Pressable
                style={({ pressed }) => [
                  styles.blockOnlyButton,
                  pressed ? { opacity: 0.85 } : null
                ]}
                onPress={handleBlock}
              >
                <Text style={styles.blockOnlyText}>
                  Just block — don't report
                </Text>
              </Pressable>
            </View>
          ) : step === "confirm" ? (
            <View style={styles.body}>
              <Text style={styles.subtitle}>
                This will report and block {targetDisplayName}. They won't be
                able to see you or contact you.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.reportButton,
                  pressed ? { opacity: 0.88 } : null
                ]}
                onPress={handleReportAndBlock}
              >
                <Text style={styles.reportButtonText}>
                  Report & Block
                </Text>
              </Pressable>
              <Pressable onPress={() => setStep("reason")} hitSlop={8}>
                <Text style={styles.backLink}>← Go back</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={styles.doneIcon}>✓</Text>
              <Text style={styles.doneText}>
                Thanks for keeping DateVibe safe.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)"
  },
  sheet: {
    borderTopLeftRadius: uiTheme.radius.xxl,
    borderTopRightRadius: uiTheme.radius.xxl,
    backgroundColor: uiTheme.colors.surface,
    paddingBottom: 40,
    ...uiTheme.shadow.card
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.md,
    paddingBottom: uiTheme.spacing.sm
  },
  handle: {
    position: "absolute",
    top: 8,
    left: "50%",
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: uiTheme.colors.border
  },
  title: {
    flex: 1,
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.subheading,
    fontWeight: "800"
  },
  closeButton: {
    color: uiTheme.colors.textMuted,
    fontSize: 18,
    fontWeight: "800"
  },
  body: {
    paddingHorizontal: uiTheme.spacing.lg,
    gap: uiTheme.spacing.sm
  },
  subtitle: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 21,
    marginBottom: uiTheme.spacing.xs
  },
  reasonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
    paddingVertical: uiTheme.spacing.sm,
    paddingHorizontal: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  reasonCardPressed: {
    backgroundColor: uiTheme.colors.chipBackground
  },
  reasonIcon: {
    fontSize: 18
  },
  reasonLabel: {
    flex: 1,
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  reasonChevron: {
    color: uiTheme.colors.textMuted,
    fontSize: 20,
    fontWeight: "700"
  },
  divider: {
    height: 1,
    backgroundColor: uiTheme.colors.border,
    marginVertical: uiTheme.spacing.xs
  },
  blockOnlyButton: {
    alignSelf: "center",
    paddingHorizontal: uiTheme.spacing.xl,
    paddingVertical: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  blockOnlyText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "700"
  },
  reportButton: {
    alignSelf: "stretch",
    paddingVertical: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.danger,
    alignItems: "center"
  },
  reportButtonText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800"
  },
  backLink: {
    alignSelf: "center",
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600",
    paddingVertical: uiTheme.spacing.xs
  },
  doneIcon: {
    alignSelf: "center",
    fontSize: 48,
    color: uiTheme.colors.successInk,
    marginVertical: uiTheme.spacing.md
  },
  doneText: {
    alignSelf: "center",
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    fontWeight: "700",
    textAlign: "center"
  }
})
