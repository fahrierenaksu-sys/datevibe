import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { Avatar } from "../ui/avatar"
import { SoftBlobBackground } from "../ui/backgrounds"
import {
  ActionButtonCircle,
  CardWrapper,
  TagChip,
  TopBar
} from "../ui/primitives"
import { uiTheme } from "../ui/theme"

export interface ProfilePrompt {
  id: string
  question: string
  answer: string
}

export interface ProfileCue {
  id: string
  label: string
  value: string
  detail: string
}

export interface ProfilePreviewData {
  userId: string
  displayName: string
  headline: string
  vibeLine: string
  tags: string[]
  bio: string
  cues: ProfileCue[]
  prompts: ProfilePrompt[]
  canInvite: boolean
  blocked: boolean
  isSelf: boolean
  spotId: string
  distanceLabel: string
}

type ProfilePreviewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "ProfilePreview"
>

export function ProfilePreviewScreen(props: ProfilePreviewScreenProps) {
  const { navigation, route } = props
  const { profile } = route.params

  const promptCards = profile.prompts.slice(0, 2)
  const likeDisabled = profile.isSelf || profile.blocked || !profile.canInvite

  const sendInviteAndReturn = (): void => {
    if (likeDisabled) return
    navigation.navigate("Lobby", { pendingLikeUserId: profile.userId })
  }

  return (
    <View style={styles.root}>
      <SoftBlobBackground variant="lobby" />
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <TopBar
            title="Profile"
            subtitle={profile.distanceLabel}
            titleAlign="start"
            leftSlot={
              <ActionButtonCircle
                onPress={() => navigation.goBack()}
                size={40}
              >
                ←
              </ActionButtonCircle>
            }
            rightSlot={
              <ActionButtonCircle onPress={() => {}} size={40}>
                ⋯
              </ActionButtonCircle>
            }
          />

          <View style={styles.heroCard}>
            <View style={styles.stagePill}>
              <View style={styles.stageDot} />
              <Text style={styles.stagePillText}>Live profile</Text>
            </View>
            <View style={styles.heroGlow} pointerEvents="none" />
            <View style={styles.heroGlowSecondary} pointerEvents="none" />
            <Avatar
              name={profile.displayName}
              seed={profile.userId}
              size={196}
              ring="strong"
            />
          </View>

          <View style={styles.identityBlock}>
            <Text style={styles.nameText}>{profile.displayName}</Text>
            <Text style={styles.headlineText}>{profile.headline}</Text>
            <Text style={styles.vibeText}>{profile.vibeLine}</Text>
          </View>

          <View style={styles.tagsRow}>
            {profile.tags.map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </View>

          {profile.bio ? (
            <View style={styles.bioCard}>
              <Text style={styles.bioLabel}>Profile note</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : null}

          <View style={styles.contextGrid}>
            {profile.cues.map((cue) => (
              <View key={cue.id} style={styles.contextCard}>
                <Text style={styles.contextLabel}>{cue.label}</Text>
                <Text style={styles.contextValue}>{cue.value}</Text>
                <Text style={styles.contextDetail}>{cue.detail}</Text>
              </View>
            ))}
          </View>

          {promptCards.length > 0 ? promptCards.map((prompt) => (
            <CardWrapper key={prompt.id} style={styles.promptCard}>
              <Text style={styles.promptQuestion}>{prompt.question}</Text>
              <Text style={styles.promptAnswer}>{prompt.answer}</Text>
            </CardWrapper>
          )) : null}

          <View style={styles.actionRow}>
            <ActionButtonCircle
              onPress={() => navigation.goBack()}
              size={62}
            >
              ✕
            </ActionButtonCircle>
            <Pressable
              disabled={likeDisabled}
              onPress={sendInviteAndReturn}
              style={({ pressed }) => [
                styles.likeButton,
                likeDisabled ? styles.likeButtonDisabled : null,
                pressed && !likeDisabled ? styles.likeButtonPressed : null
              ]}
            >
              <Text style={styles.likeButtonText}>♥  Say hi</Text>
            </Pressable>
          </View>
        </ScrollView>
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
    flex: 1
  },
  scroll: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xl,
    gap: uiTheme.spacing.md
  },
  heroCard: {
    height: 320,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: "#ECE9EE",
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.card
  },
  stagePill: {
    position: "absolute",
    top: uiTheme.spacing.md,
    left: uiTheme.spacing.md,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.78)"
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: uiTheme.colors.success
  },
  stagePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  heroGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -60
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#FCE4F1",
    right: -40,
    bottom: -50
  },
  identityBlock: {
    gap: uiTheme.spacing.xxs,
    paddingHorizontal: 2
  },
  nameText: {
    color: uiTheme.colors.textPrimary,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0
  },
  headlineText: {
    color: uiTheme.colors.primaryDeep,
    fontSize: uiTheme.typography.body,
    lineHeight: 22,
    fontWeight: "800"
  },
  vibeText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.bodySmall,
    lineHeight: 21,
    fontWeight: "600"
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs
  },
  bioCard: {
    gap: 6,
    padding: uiTheme.spacing.md,
    borderRadius: uiTheme.radius.lg,
    backgroundColor: uiTheme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: uiTheme.colors.border
  },
  bioLabel: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: 0.6
  },
  bioText: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.body,
    lineHeight: 24
  },
  contextGrid: {
    gap: uiTheme.spacing.sm
  },
  contextCard: {
    borderRadius: uiTheme.radius.lg,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    paddingHorizontal: uiTheme.spacing.md,
    paddingVertical: uiTheme.spacing.sm,
    gap: 2
  },
  contextLabel: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  contextValue: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "800"
  },
  contextDetail: {
    color: uiTheme.colors.textSecondary,
    fontSize: uiTheme.typography.caption,
    lineHeight: 17,
    fontWeight: "600"
  },
  promptCard: {
    gap: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.surfaceRaised,
    borderColor: uiTheme.colors.border
  },
  promptQuestion: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.caption,
    textTransform: "uppercase",
    fontWeight: "800",
    letterSpacing: 0.6
  },
  promptAnswer: {
    color: uiTheme.colors.textPrimary,
    fontSize: uiTheme.typography.body,
    lineHeight: 24,
    fontWeight: "600"
  },
  actionRow: {
    marginTop: uiTheme.spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: uiTheme.spacing.md
  },
  likeButton: {
    minHeight: 64,
    minWidth: 192,
    borderRadius: uiTheme.radius.full,
    backgroundColor: uiTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.xl,
    ...uiTheme.shadow.lift
  },
  likeButtonDisabled: {
    backgroundColor: uiTheme.colors.primaryDisabled,
    shadowOpacity: 0,
    elevation: 0
  },
  likeButtonPressed: {
    backgroundColor: uiTheme.colors.primaryPressed
  },
  likeButtonText: {
    color: "#FFFFFF",
    fontSize: uiTheme.typography.body,
    fontWeight: "800",
    letterSpacing: 0.3
  }
})
