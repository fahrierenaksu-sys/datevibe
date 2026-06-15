import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useEffect, useRef } from "react"
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  CandidateAvatarPreview,
  createCandidateAvatarSnapshot,
  type CandidateAvatarSnapshot
} from "../components/DiscoverCard"
import type { RootStackParamList } from "../navigation/RootNavigator"
import { SoftBlobBackground } from "../ui/backgrounds"
import { LinearGradient } from "../ui/linearGradient"
import { MyAvatar } from "../ui/myAvatar"
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
  avatarSnapshot?: CandidateAvatarSnapshot
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

const CUE_ICONS: Record<string, string> = {
  live_overlap: "📡",
  proximity: "📍",
  room_readiness: "🏠",
}

export function ProfilePreviewScreen(props: ProfilePreviewScreenProps) {
  const { navigation, route } = props
  const { profile } = route.params
  const avatarSnapshot = createCandidateAvatarSnapshot({
    userId: profile.userId,
    displayName: profile.displayName,
    avatarSnapshot: profile.avatarSnapshot
  })

  const promptCards = profile.prompts.slice(0, 2)
  const likeDisabled = profile.isSelf || profile.blocked || !profile.canInvite

  const likeScaleAnim = useRef(new Animated.Value(1)).current
  const contentAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(contentAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springGentle,
    }).start()
  }, [contentAnim])

  const sendInviteAndReturn = (): void => {
    if (likeDisabled) return
    navigation.navigate("Lobby", { pendingLikeUserId: profile.userId })
  }

  const handleLikePressIn = () => {
    Animated.spring(likeScaleAnim, {
      toValue: uiTheme.animation.scalePress,
      useNativeDriver: true,
      ...uiTheme.animation.spring,
    }).start()
  }

  const handleLikePressOut = () => {
    Animated.spring(likeScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      ...uiTheme.animation.springBouncy,
    }).start()
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

          <Animated.View
            style={{
              opacity: contentAnim,
              transform: [
                {
                  translateY: contentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  })
                }
              ],
              gap: uiTheme.spacing.md,
            }}
          >
            <View style={styles.heroCard}>
              <LinearGradient
                colors={uiTheme.gradients.heroBackground as [string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.stagePill}>
                <View style={styles.stageDot} />
                <Text style={styles.stagePillText}>
                  {profile.isSelf ? "Your profile" : "Profile preview"}
                </Text>
              </View>
              <View style={styles.heroGlow} pointerEvents="none" />
              <View style={styles.heroGlowSecondary} pointerEvents="none" />
              {profile.isSelf ? (
                <MyAvatar
                  name={profile.displayName}
                  seed={profile.userId}
                  size={200}
                  ring="strong"
                />
              ) : (
                <>
                  <CandidateAvatarPreview
                    snapshot={avatarSnapshot}
                    size={208}
                    stage="profile"
                  />
                  <View style={styles.avatarSourcePill}>
                    <Text style={styles.avatarSourceText}>{avatarSnapshot.label}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.identityBlock}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{profile.displayName}</Text>
                <Text style={styles.verifiedBadge}>✦</Text>
              </View>
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
                  <View style={styles.contextHeader}>
                    <View style={styles.contextIconCircle}>
                      <Text style={styles.contextIconText}>
                        {CUE_ICONS[cue.id] ?? "◆"}
                      </Text>
                    </View>
                    <View style={styles.contextTextStack}>
                      <Text style={styles.contextLabel}>{cue.label}</Text>
                      <Text style={styles.contextValue}>{cue.value}</Text>
                    </View>
                  </View>
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
              <Animated.View style={{ transform: [{ scale: likeScaleAnim }] }}>
                <Pressable
                  disabled={likeDisabled}
                  onPress={sendInviteAndReturn}
                  onPressIn={handleLikePressIn}
                  onPressOut={handleLikePressOut}
                  style={[
                    styles.likeButton,
                    likeDisabled ? styles.likeButtonDisabled : null,
                  ]}
                >
                  <LinearGradient
                    colors={
                      likeDisabled
                        ? [uiTheme.colors.primaryDisabled, uiTheme.colors.primaryDisabled]
                        : uiTheme.gradients.primary as [string, string]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.likeButtonGradient}
                  >
                    <Text style={styles.likeButtonText}>♥  Say hi</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: uiTheme.colors.background,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingTop: uiTheme.spacing.sm,
    paddingBottom: uiTheme.spacing.xl,
    gap: uiTheme.spacing.md,
  },
  heroCard: {
    height: 340,
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    ...uiTheme.shadow.deep,
  },
  stagePill: {
    position: "absolute",
    top: uiTheme.spacing.md,
    left: uiTheme.spacing.md,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.78)",
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: uiTheme.colors.success,
  },
  stagePillText: {
    ...uiTheme.font.micro,
    color: "#FFFFFF",
  },
  avatarSourcePill: {
    position: "absolute",
    bottom: uiTheme.spacing.md,
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(32, 22, 42, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  avatarSourceText: {
    ...uiTheme.font.micro,
    color: "#FFFFFF",
    fontSize: 10,
  },
  heroGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: uiTheme.colors.avatarAccent,
    top: -80,
  },
  heroGlowSecondary: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#FCE4F1",
    right: -50,
    bottom: -60,
  },
  identityBlock: {
    gap: uiTheme.spacing.xxs,
    paddingHorizontal: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs,
  },
  nameText: {
    ...uiTheme.font.title,
    fontSize: 34,
    color: uiTheme.colors.textPrimary,
  },
  verifiedBadge: {
    fontSize: 20,
    color: uiTheme.colors.primary,
  },
  headlineText: {
    ...uiTheme.font.bodyBold,
    color: uiTheme.colors.primaryDeep,
  },
  vibeText: {
    ...uiTheme.font.bodySmall,
    color: uiTheme.colors.textSecondary,
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: uiTheme.spacing.xs,
  },
  bioCard: {
    gap: uiTheme.spacing.xs,
    padding: uiTheme.spacing.lg,
    borderRadius: uiTheme.radius.xl,
    backgroundColor: uiTheme.colors.glass,
    borderWidth: 1,
    borderColor: uiTheme.colors.glassBorder,
    ...uiTheme.shadow.soft,
  },
  bioLabel: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.textMuted,
  },
  bioText: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textSecondary,
  },
  contextGrid: {
    gap: uiTheme.spacing.sm,
  },
  contextCard: {
    borderRadius: uiTheme.radius.xl,
    borderWidth: 1,
    borderColor: uiTheme.colors.border,
    backgroundColor: uiTheme.colors.surface,
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.md,
    gap: uiTheme.spacing.xs,
    ...uiTheme.shadow.soft,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.sm,
  },
  contextIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: uiTheme.colors.chipBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  contextIconText: {
    fontSize: 16,
  },
  contextTextStack: {
    flex: 1,
    gap: 1,
  },
  contextLabel: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.textMuted,
    fontSize: 10,
  },
  contextValue: {
    ...uiTheme.font.bodyBold,
    fontSize: 14,
    color: uiTheme.colors.textPrimary,
  },
  contextDetail: {
    ...uiTheme.font.caption,
    color: uiTheme.colors.textSecondary,
    lineHeight: 17,
    paddingLeft: 48,
  },
  promptCard: {
    gap: uiTheme.spacing.sm,
    backgroundColor: uiTheme.colors.glass,
    borderColor: uiTheme.colors.glassBorder,
  },
  promptQuestion: {
    ...uiTheme.font.overline,
    color: uiTheme.colors.textMuted,
  },
  promptAnswer: {
    ...uiTheme.font.body,
    color: uiTheme.colors.textPrimary,
    fontWeight: "600",
  },
  actionRow: {
    marginTop: uiTheme.spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: uiTheme.spacing.lg,
  },
  likeButton: {
    borderRadius: uiTheme.radius.full,
    overflow: "hidden",
    ...uiTheme.shadow.glow,
  },
  likeButtonGradient: {
    minHeight: 64,
    minWidth: 200,
    borderRadius: uiTheme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.xl,
  },
  likeButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  likeButtonText: {
    ...uiTheme.font.bodyBold,
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
})
