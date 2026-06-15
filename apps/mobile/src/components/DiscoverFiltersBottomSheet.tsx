import { useEffect, useMemo, useState } from "react"
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { PrimaryButton, SecondaryButton } from "../ui/primitives"
import { uiTheme } from "../ui/theme"

type DiscoverIntent = "Dating" | "Friendship" | "Both"
type DiscoveryScope = "Local" | "Regional" | "Global"

export interface DiscoverFilters {
  intent: DiscoverIntent
  ageMin: number
  ageMax: number
  vibes: string[]
  scope: DiscoveryScope
}

const AGE_MIN = 18
const AGE_MAX = 60
const VIBE_OPTIONS = [
  "Coffee dates",
  "Slow burn",
  "Bookish",
  "Outdoors",
  "Creative",
  "Fitness",
  "Night owl",
  "Pets"
] as const
const INTENT_OPTIONS: readonly DiscoverIntent[] = ["Dating", "Friendship", "Both"]
const SCOPE_OPTIONS: readonly DiscoveryScope[] = ["Local", "Regional", "Global"]

export const DEFAULT_DISCOVER_FILTERS: DiscoverFilters = {
  intent: "Both",
  ageMin: 24,
  ageMax: 32,
  vibes: ["Coffee dates", "Slow burn"],
  scope: "Local"
}

interface DiscoverFiltersBottomSheetProps {
  visible: boolean
  initialFilters: DiscoverFilters
  onClose: () => void
  onApply: (filters: DiscoverFilters) => void
}

function clampAge(value: number): number {
  return Math.max(AGE_MIN, Math.min(AGE_MAX, value))
}

function toggleVibe(selectedVibes: string[], vibe: string): string[] {
  if (selectedVibes.includes(vibe)) {
    return selectedVibes.filter((current) => current !== vibe)
  }
  return [...selectedVibes, vibe]
}

export function DiscoverFiltersBottomSheet(props: DiscoverFiltersBottomSheetProps) {
  const { visible, initialFilters, onClose, onApply } = props
  const [draftFilters, setDraftFilters] = useState<DiscoverFilters>(initialFilters)

  useEffect(() => {
    if (visible) {
      setDraftFilters(initialFilters)
    }
  }, [initialFilters, visible])

  const ageSummary = useMemo(
    () => `${draftFilters.ageMin} - ${draftFilters.ageMax}`,
    [draftFilters.ageMax, draftFilters.ageMin]
  )

  const updateAgeMin = (step: number) => {
    setDraftFilters((previous) => {
      const nextMin = clampAge(previous.ageMin + step)
      return {
        ...previous,
        ageMin: Math.min(nextMin, previous.ageMax)
      }
    })
  }

  const updateAgeMax = (step: number) => {
    setDraftFilters((previous) => {
      const nextMax = clampAge(previous.ageMax + step)
      return {
        ...previous,
        ageMax: Math.max(nextMax, previous.ageMin)
      }
    })
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Discover Filters</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Intent</Text>
              <View style={styles.segmentRow}>
                {INTENT_OPTIONS.map((option) => {
                  const active = draftFilters.intent === option
                  return (
                    <Pressable
                      key={option}
                      style={[styles.segment, active ? styles.segmentActive : null]}
                      onPress={() => {
                        setDraftFilters((previous) => ({ ...previous, intent: option }))
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active ? styles.segmentTextActive : null
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Age Range</Text>
              <View style={styles.ageCard}>
                <Text style={styles.ageValue}>{ageSummary}</Text>
                <View style={styles.ageControls}>
                  <View style={styles.ageControlGroup}>
                    <Text style={styles.ageLabel}>Min</Text>
                    <View style={styles.ageStepper}>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => {
                          updateAgeMin(-1)
                        }}
                      >
                        <Text style={styles.stepperText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{draftFilters.ageMin}</Text>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => {
                          updateAgeMin(1)
                        }}
                      >
                        <Text style={styles.stepperText}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.ageControlGroup}>
                    <Text style={styles.ageLabel}>Max</Text>
                    <View style={styles.ageStepper}>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => {
                          updateAgeMax(-1)
                        }}
                      >
                        <Text style={styles.stepperText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{draftFilters.ageMax}</Text>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => {
                          updateAgeMax(1)
                        }}
                      >
                        <Text style={styles.stepperText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vibes & Interests</Text>
              <View style={styles.tagsWrap}>
                {VIBE_OPTIONS.map((vibe) => {
                  const selected = draftFilters.vibes.includes(vibe)
                  return (
                    <Pressable
                      key={vibe}
                      style={[styles.vibeChip, selected ? styles.vibeChipSelected : null]}
                      onPress={() => {
                        setDraftFilters((previous) => ({
                          ...previous,
                          vibes: toggleVibe(previous.vibes, vibe)
                        }))
                      }}
                    >
                      <Text
                        style={[
                          styles.vibeChipText,
                          selected ? styles.vibeChipTextSelected : null
                        ]}
                      >
                        {vibe}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Discovery Scope</Text>
              <View style={styles.segmentRow}>
                {SCOPE_OPTIONS.map((option) => {
                  const active = draftFilters.scope === option
                  return (
                    <Pressable
                      key={option}
                      style={[styles.segment, active ? styles.segmentActive : null]}
                      onPress={() => {
                        setDraftFilters((previous) => ({ ...previous, scope: option }))
                      }}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          active ? styles.segmentTextActive : null
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <SecondaryButton
              label="Reset"
              onPress={() => {
                setDraftFilters(DEFAULT_DISCOVER_FILTERS)
              }}
              style={styles.footerButton}
            />
            <PrimaryButton
              label="Apply Filters"
              onPress={() => {
                onApply(draftFilters)
              }}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28, 16, 34, 0.52)",
  },
  sheet: {
    maxHeight: "86%",
    borderTopLeftRadius: uiTheme.radius.xxl,
    borderTopRightRadius: uiTheme.radius.xxl,
    backgroundColor: uiTheme.colors.surface,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: uiTheme.colors.border,
    paddingTop: uiTheme.spacing.lg,
    ...uiTheme.shadow.deep,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.md,
  },
  headerTitle: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
  },
  closeButtonText: {
    color: uiTheme.colors.secondaryText,
    fontSize: 15,
    fontWeight: "700",
  },
  content: {
    maxHeight: 520,
  },
  contentContainer: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.md,
    gap: uiTheme.spacing.lg,
  },
  section: {
    gap: uiTheme.spacing.sm,
  },
  sectionTitle: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.primary,
  },
  segmentRow: {
    flexDirection: "row",
    gap: uiTheme.spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1.5,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentActive: {
    borderColor: uiTheme.colors.primary,
    backgroundColor: uiTheme.colors.chipBackground,
    ...uiTheme.shadow.soft,
  },
  segmentText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: uiTheme.colors.chipText,
    fontWeight: "700",
  },
  ageCard: {
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    backgroundColor: uiTheme.colors.glass,
    padding: uiTheme.spacing.lg,
    gap: uiTheme.spacing.md,
    ...uiTheme.shadow.soft,
  },
  ageValue: {
    ...uiTheme.font.title,
    color: uiTheme.colors.textPrimary,
    fontSize: 22,
  },
  ageControls: {
    flexDirection: "row",
    gap: uiTheme.spacing.lg,
  },
  ageControlGroup: {
    flex: 1,
    gap: uiTheme.spacing.xs,
  },
  ageLabel: {
    ...uiTheme.font.captionBold,
    color: uiTheme.colors.textMuted,
  },
  ageStepper: {
    minHeight: 44,
    borderRadius: uiTheme.radius.full,
    borderWidth: 1.5,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: uiTheme.spacing.xs,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.chipBackground,
  },
  stepperText: {
    color: uiTheme.colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  stepperValue: {
    ...uiTheme.font.bodyBold,
    color: uiTheme.colors.textPrimary,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs,
  },
  vibeChip: {
    borderRadius: uiTheme.radius.full,
    borderWidth: 1.5,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
  },
  vibeChipSelected: {
    borderColor: uiTheme.colors.primary,
    backgroundColor: uiTheme.colors.chipBackground,
    ...uiTheme.shadow.soft,
  },
  vibeChipText: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
    fontWeight: "600",
  },
  vibeChipTextSelected: {
    color: uiTheme.colors.chipText,
    fontWeight: "700",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: uiTheme.colors.divider,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.md,
    flexDirection: "row",
    gap: uiTheme.spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
})
