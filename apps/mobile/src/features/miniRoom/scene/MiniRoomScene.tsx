import type { ReactionType } from "@datevibe/contracts"
import type { GestureResponderEvent } from "react-native"
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native"
import { useEffect, useMemo, useRef, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import type { MiniRoomConnectionStatus, MiniRoomLocalMediaState } from "../miniRoomMediaState"
import type { MiniRoomReactionEntry } from "../useMiniRoomReactions"
import type { InRoomChatMessageEvent } from "../useInRoomChat"
import type { ResolvedRoomV2Scene } from "../../roomV2/roomV2.types"
import { uiTheme } from "../../../ui/theme"
import { AvatarLayer } from "./AvatarLayer"
import { HotspotLayer } from "./HotspotLayer"
import { MiniRoomHud } from "./MiniRoomHud"
import { MiniRoomRoomDecorLayer } from "./MiniRoomRoomDecorLayer"
import { RoomMapLayer } from "./RoomMapLayer"
import { useMiniRoomSceneStore } from "./miniRoomSceneStore"
import type {
  MiniRoomParticipantAvatarSnapshots,
  RoomPhrase
} from "./miniRoomSceneTypes"

interface MiniRoomSceneProps {
  localUser: {
    userId: string
    displayName: string
  }
  partnerUser: {
    userId: string
    displayName: string
  }
  participantAvatarSnapshots: MiniRoomParticipantAvatarSnapshots
  connectionStatus: MiniRoomConnectionStatus
  localMedia: MiniRoomLocalMediaState
  roomDecorScene?: ResolvedRoomV2Scene
  recentReactions: MiniRoomReactionEntry[]
  canSendReaction: boolean
  leaveDisabled: boolean
  onLeave: () => void
  onOpenSafety: () => void
  onRetryConnect: () => void
  onToggleMic: () => void
  onSendReaction: (reaction: ReactionType) => void
  inRoomMessages: InRoomChatMessageEvent[]
  consumeInRoomMessage: (messageId: string) => void
  canChatSend: boolean
  onSendRoomMessage: (body: string) => boolean
}

const SAY_PHRASES: RoomPhrase[] = [
  { id: "hi", body: "Hi :)", tone: "greeting" },
  { id: "cozy", body: "This place is cozy", tone: "chat" },
  { id: "sit", body: "Come sit with me", tone: "chat" },
  { id: "tell", body: "Tell me something", tone: "chat" },
  { id: "cute", body: "You're cute", tone: "greeting" }
]

const JOIN_PULSE_MS = 4200
const MAX_ROOM_MESSAGE_LENGTH = 140

export function MiniRoomScene(props: MiniRoomSceneProps) {
  const {
    localUser,
    partnerUser,
    participantAvatarSnapshots,
    connectionStatus,
    localMedia,
    roomDecorScene,
    recentReactions,
    canSendReaction,
    leaveDisabled,
    onLeave,
    onOpenSafety,
    onRetryConnect,
    onToggleMic,
    onSendReaction,
    inRoomMessages,
    consumeInRoomMessage,
    canChatSend,
    onSendRoomMessage
  } = props
  const store = useMiniRoomSceneStore({
    localUser,
    partnerUser,
    participantAvatarSnapshots,
    roomDecorScene
  })
  const handledReactionIds = useRef(new Set<string>())
  const [stageSize, setStageSize] = useState({
    width: ROOM_STAGE_SIZE,
    height: ROOM_STAGE_SIZE
  })
  const {
    addEmote,
    moveLocalAvatar,
    moveLocalAvatarToHotspot,
    sayPhrase
  } = store

  const entryValueRef = useRef(new Animated.Value(0)).current
  const [partnerJustJoined, setPartnerJustJoined] = useState(true)
  const [composerText, setComposerText] = useState("")

  useEffect(() => {
    Animated.timing(entryValueRef, {
      toValue: 1,
      duration: 640,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start()
  }, [entryValueRef])

  useEffect(() => {
    const timer = setTimeout(() => setPartnerJustJoined(false), JOIN_PULSE_MS)
    return () => clearTimeout(timer)
  }, [partnerUser.userId])

  useEffect(() => {
    for (const reaction of recentReactions) {
      if (handledReactionIds.current.has(reaction.id)) continue
      handledReactionIds.current.add(reaction.id)
      const speakerUserId = reaction.fromPartner ? partnerUser.userId : localUser.userId
      addEmote(speakerUserId, reaction.reaction)
    }
  }, [addEmote, localUser.userId, partnerUser.userId, recentReactions])

  useEffect(() => {
    if (inRoomMessages.length === 0) return
    for (const message of inRoomMessages) {
      sayPhrase(message.senderUserId, message.body, "chat")
      consumeInRoomMessage(message.messageId)
    }
  }, [consumeInRoomMessage, inRoomMessages, sayPhrase])

  const handleRoomPress = (event: GestureResponderEvent): void => {
    Keyboard.dismiss()
    const { locationX, locationY } = event.nativeEvent
    moveLocalAvatar({
      x: Math.max(0, Math.min(1, locationX / stageSize.width)),
      y: Math.max(0, Math.min(1, locationY / stageSize.height))
    })
  }

  const handleHotspotSelect = (hotspotId: string): void => {
    Keyboard.dismiss()
    moveLocalAvatarToHotspot(hotspotId)
  }

  const handleSendReaction = (reaction: ReactionType): void => {
    addEmote(localUser.userId, reaction)
    onSendReaction(reaction)
  }

  const handleSubmitComposer = (): void => {
    const body = composerText.trim()
    if (!body) {
      return
    }
    const accepted = onSendRoomMessage(body)
    if (accepted) {
      sayPhrase(localUser.userId, body, "chat")
    }
    setComposerText("")
    Keyboard.dismiss()
  }

  const entryOpacity = entryValueRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  })
  const entryScale = entryValueRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1]
  })
  const entryTranslateY = entryValueRef.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0]
  })
  const welcomeOpacity = entryValueRef.interpolate({
    inputRange: [0, 0.6, 1, 1],
    outputRange: [0, 1, 1, 0]
  })

  const partnerFirstName = useMemo(
    () => partnerUser.displayName.split(" ")[0] || partnerUser.displayName,
    [partnerUser.displayName]
  )

  const closeTogether =
    store.interaction.proximityClose && connectionStatus === "connected"

  const composerDisabled = !canChatSend

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.roomWrap}>
        <Animated.View
          style={[
            styles.roomStageFrame,
            {
              opacity: entryOpacity,
              transform: [
                { translateY: entryTranslateY },
                { scale: entryScale }
              ]
            }
          ]}
        >
          <Pressable
            style={styles.roomStage}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout
              setStageSize({ width, height })
            }}
            onPress={handleRoomPress}
          >
            {roomDecorScene?.shell ? (
              <MiniRoomRoomDecorLayer
                scene={roomDecorScene}
                interaction={store.interaction}
              />
            ) : (
              <RoomMapLayer scene={store.scene} interaction={store.interaction} />
            )}
            <HotspotLayer
              hotspots={store.hotspots}
              interaction={store.interaction}
              stageWidth={stageSize.width}
              stageHeight={stageSize.height}
              onSelect={handleHotspotSelect}
              disabled={connectionStatus !== "connected"}
            />
            <TogetherHeartOverlay active={closeTogether} />
            <AvatarLayer
              avatars={store.avatars}
              localUserId={localUser.userId}
              bubbles={store.bubbles}
              emotes={store.emotes}
              partnerJustJoined={partnerJustJoined && connectionStatus === "connected"}
            />

            <Animated.View
              style={[styles.welcomeRibbon, { opacity: welcomeOpacity }]}
              pointerEvents="none"
            >
              <Text style={styles.welcomeText} numberOfLines={1}>
                You &amp; {partnerFirstName} · your cozy room
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      <SafeAreaView
        edges={["top", "left", "right"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      >
        <MiniRoomHud
          connectionStatus={connectionStatus}
          localMedia={localMedia}
          canSendReaction={canSendReaction}
          leaveDisabled={leaveDisabled}
          onLeave={onLeave}
          onOpenSafety={onOpenSafety}
          onRetryConnect={onRetryConnect}
          onToggleMic={onToggleMic}
          onSendReaction={handleSendReaction}
        />
      </SafeAreaView>

      <SafeAreaView edges={["bottom"]} style={styles.composerSafeArea}>
        <RoomChatComposer
          value={composerText}
          onChangeText={(val) => setComposerText(val.slice(0, MAX_ROOM_MESSAGE_LENGTH))}
          onSubmit={handleSubmitComposer}
          disabled={composerDisabled}
          canSendReaction={canSendReaction}
          onSendReaction={handleSendReaction}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

const REACTION_EMOJI: Record<ReactionType, string> = {
  wave: "👋",
  heart: "❤️",
  laugh: "😂",
  fire: "🔥"
}
const REACTIONS: readonly ReactionType[] = ["wave", "heart", "laugh", "fire"]

interface RoomChatComposerProps {
  value: string
  disabled: boolean
  onChangeText: (value: string) => void
  onSubmit: () => void
  canSendReaction: boolean
  onSendReaction: (reaction: ReactionType) => void
}

function RoomChatComposer(props: RoomChatComposerProps) {
  const { value, disabled, onChangeText, onSubmit, canSendReaction, onSendReaction } = props
  return (
    <View style={styles.composerWrap}>
      <View style={styles.reactionDock}>
        {REACTIONS.map((reaction) => (
          <Pressable
            key={reaction}
            disabled={!canSendReaction}
            onPress={() => onSendReaction(reaction)}
            style={({ pressed }) => [
              styles.reactionButton,
              !canSendReaction ? styles.composerSendDisabled : null,
              pressed ? styles.composerSendPressed : null
            ]}
          >
            <Text style={styles.reactionText}>{REACTION_EMOJI[reaction]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.composerBar}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Say something nice..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          maxLength={140}
          returnKeyType="send"
          blurOnSubmit
          style={styles.composerInput}
          editable={!disabled}
          keyboardAppearance="dark"
        />
        <Pressable
          disabled={disabled || value.trim().length === 0}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.composerSend,
            (disabled || value.trim().length === 0) ? styles.composerSendDisabled : null,
            pressed ? styles.composerSendPressed : null
          ]}
        >
          <Text style={styles.composerSendText}>↑</Text>
        </Pressable>
      </View>
    </View>
  )
}

interface TogetherHeartOverlayProps {
  active: boolean
}

function TogetherHeartOverlay(props: TogetherHeartOverlayProps) {
  const { active } = props
  const pulseRef = useRef(new Animated.Value(0)).current
  const fadeRef = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeRef, {
      toValue: active ? 1 : 0,
      duration: 420,
      useNativeDriver: true
    }).start()
  }, [active, fadeRef])

  useEffect(() => {
    if (!active) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseRef, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        }),
        Animated.timing(pulseRef, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true
        })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [active, pulseRef])

  const scale = pulseRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.12]
  })
  const translateY = pulseRef.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6]
  })

  return (
    <View style={styles.togetherWrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.togetherInner,
          {
            opacity: fadeRef,
            transform: [{ scale }, { translateY }]
          }
        ]}
      >
        <Text style={styles.togetherHeart}>💗</Text>
      </Animated.View>
    </View>
  )
}

const ROOM_STAGE_SIZE = 390

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1E0F1E",
  },
  roomWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.md,
    paddingTop: 40,
    paddingBottom: 40,
  },
  roomStageFrame: {
    width: "100%",
    maxWidth: 420,
    aspectRatio: 1,
  },
  roomStage: {
    flex: 1,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#F8ECF2",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#FF8EBE",
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  /* ── Welcome Ribbon ────────────── */
  welcomeRibbon: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(20, 8, 18, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 180, 210, 0.35)",
  },
  welcomeText: {
    ...uiTheme.font.micro,
    color: "#FFE4F0",
    letterSpacing: 0.4,
  },
  /* ── Together Heart ────────────── */
  togetherWrap: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  togetherInner: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 100, 160, 0.6)",
    shadowColor: "#FF6AA1",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  togetherHeart: {
    fontSize: 22,
  },
  composerSafeArea: {
    backgroundColor: "transparent",
  },
  composerWrap: {
    paddingHorizontal: uiTheme.spacing.lg,
    paddingVertical: uiTheme.spacing.md,
    alignItems: "stretch",
    gap: 12,
  },
  reactionDock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  reactionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  reactionText: {
    fontSize: 24,
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: uiTheme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    color: "#FFFFFF",
    ...uiTheme.font.bodySmall,
    fontWeight: "500",
  },
  composerSend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.primary,
  },
  composerSendDisabled: {
    opacity: 0.35,
  },
  composerSendPressed: {
    transform: [{ scale: 0.92 }],
  },
  composerSendText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
})
