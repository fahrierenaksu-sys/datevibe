import { useMemo } from "react"
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { OnboardingProgress } from "../components/OnboardingProgress"
import { AvatarPreview2D } from "../features/avatarV2/components/AvatarPreview2D"
import { getAvatarV2ItemsByType, isAvatarV2ItemEquipped } from "../features/avatarV2/avatarV2Selectors"
import { useAvatarV2 } from "../features/avatarV2/state/AvatarV2Provider"
import type { AvatarItemType } from "../features/avatarV2/avatarV2.types"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { uiTheme } from "../ui/theme"

const STARTER_CATEGORIES: Array<{
  type: Extract<AvatarItemType, "hair" | "top" | "bottom" | "shoes">
  label: string
}> = [
  { type: "hair", label: "Hair" },
  { type: "top", label: "Top" },
  { type: "bottom", label: "Bottom" },
  { type: "shoes", label: "Shoes" }
]

interface AvatarSetupScreenProps {
  isSubmitting: boolean
  errorMessage: string | null
  onComplete: () => Promise<void>
}

export function AvatarSetupScreen({
  isSubmitting,
  errorMessage,
  onComplete
}: AvatarSetupScreenProps) {
  const {
    avatar,
    catalog,
    canEquipItem,
    equipItem
  } = useAvatarV2()

  const starterItems = useMemo(
    () =>
      STARTER_CATEGORIES.map((category) => ({
        ...category,
        items: getAvatarV2ItemsByType(catalog, category.type)
          .filter(canEquipItem)
          .slice(0, 4)
      })),
    [canEquipItem, catalog]
  )

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="bootstrap" />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <OnboardingProgress activeStep={1} />
          <AvatarPreview2D
            avatar={avatar}
            catalog={catalog}
            size={164}
            stageHeight={232}
            label="Your starter look"
            metaTone="light"
          />
          <View style={styles.heading}>
            <Text style={styles.title}>Pick the vibe people meet first.</Text>
            <Text style={styles.body}>
              Choose a starter look now. Your full wardrobe stays available later.
            </Text>
          </View>

          {starterItems.map((category) => (
            <View key={category.type} style={styles.category}>
              <Text style={styles.categoryTitle}>{category.label}</Text>
              <View style={styles.itemRow}>
                {category.items.map((item) => {
                  const equipped = isAvatarV2ItemEquipped(avatar, item)
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityLabel={`${item.name}${equipped ? ", wearing" : ""}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: equipped }}
                      onPress={() => {
                        equipItem(item)
                      }}
                      style={[
                        styles.item,
                        equipped ? styles.itemEquipped : null
                      ]}
                      testID={`avatar-setup-item-${item.id}`}
                    >
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.itemText,
                          equipped ? styles.itemTextEquipped : null
                        ]}
                      >
                        {item.name}
                      </Text>
                      {equipped ? (
                        <Text style={styles.wearing}>Wearing</Text>
                      ) : null}
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}

          {errorMessage ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="Complete avatar setup"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => {
              void onComplete().catch(() => undefined)
            }}
            style={isSubmitting ? styles.disabled : null}
            testID="avatar-setup-submit"
          >
            <LinearGradient
              colors={uiTheme.gradients.primary}
              style={styles.cta}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaText}>This looks like me</Text>
              )}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.backgroundWarm
  },
  safe: {
    flex: 1
  },
  content: {
    padding: uiTheme.spacing.lg,
    paddingBottom: uiTheme.spacing.xxl,
    gap: uiTheme.spacing.lg
  },
  heading: {
    gap: uiTheme.spacing.xs
  },
  title: {
    ...uiTheme.font.heading,
    color: uiTheme.colors.textPrimary,
    textAlign: "center"
  },
  body: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    textAlign: "center"
  },
  category: {
    gap: uiTheme.spacing.sm
  },
  categoryTitle: {
    ...uiTheme.font.label,
    color: uiTheme.colors.textPrimary
  },
  itemRow: {
    flexDirection: "row",
    gap: uiTheme.spacing.sm
  },
  item: {
    flex: 1,
    minHeight: 70,
    borderRadius: uiTheme.radius.md,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: uiTheme.spacing.sm
  },
  itemEquipped: {
    borderColor: uiTheme.colors.primary,
    backgroundColor: uiTheme.colors.primarySoft
  },
  itemText: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
    textAlign: "center"
  },
  itemTextEquipped: {
    color: uiTheme.colors.primaryDeep
  },
  wearing: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.primaryDeep,
    marginTop: uiTheme.spacing.xxs
  },
  error: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.dangerInk,
    textAlign: "center"
  },
  cta: {
    minHeight: 56,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center"
  },
  ctaText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF"
  },
  disabled: {
    opacity: 0.72
  }
})
