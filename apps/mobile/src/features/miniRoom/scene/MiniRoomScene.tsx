import type { ReactionType } from "@datevibe/contracts"
import type { GestureResponderEvent } from "react-native"
import {
  Animated,
  Easing,
  Keyboard,
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
import { uiTheme } from "../../../ui/theme"
import { AvatarLayer } from "./AvatarLayer"
import { HotspotLayer } from "./HotspotLayer"
import { MiniRoomHud } from "./MiniRoomHud"
import { RoomMapLayer } from "./RoomMapLayer"
import { useMiniRoomSceneStore } from "./miniRoomSceneStore"
import type { RoomPhrase } from "./miniRoomSceneTypes"

interface MiniRoomSceneProps {
  localUser: {
    userId: string
    displayName: string
  }
  partnerUser: {
    userId: string
    displayName: string
  }
  connectionStatus: MiniRoomConnectionStatus
  localMedia: MiniRoomLocalMediaState
  recentReactions: MiniRoomReactionEntry[]
  canSendReaction: boolean
  leaveDisabled: boolean
  onLeave: () => void
  onRetryConnect: () => void
  onToggleMic: () => void
  onToggleCamera: () => void
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
    connectionStatus,
    localMedia,
    recentReactions,
    canSendReaction,
    leaveDisabled,
    onLeave,
    onRetryConnect,
    onToggleMic,
    onToggleCamera,
    onSendReaction,
    inRoomMessages,
    consumeInRoomMessage,
    canChatSend,
    onSendRoomMessage
  } = props
  const store = useMiniRoomSceneStore({ localUser, partnerUser })
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
  const [composerOpen, setComposerOpen] = useState(false)
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
    const { locationX, locationY } = event.nativeEvent
    if (composerOpen) {
      Keyboard.dismiss()
      setComposerOpen(false)
      return
    }
    moveLocalAvatar({
      x: Math.max(0, Math.min(1, locationX / stageSize.width)),
      y: Math.max(0, Math.min(1, locationY / stageSize.height))
    })
  }

  const handleHotspotSelect = (hotspotId: string): void => {
    moveLocalAvatarToHotspot(hotspotId)
  }

  const handleSendReaction = (reaction: ReactionType): void => {
    addEmote(localUser.userId, reaction)
    onSendReaction(reaction)
  }

  const handleSayPhrase = (phrase: RoomPhrase): void => {
    const accepted = onSendRoomMessage(phrase.body)
    if (accepted) {
      sayPhrase(localUser.userId, phrase.body, phrase.tone)
    }
  }

  const handleOpenComposer = (): void => {
    setComposerOpen(true)
  }

  const handleCloseComposer = (): void => {
    setComposerOpen(false)
    Keyboard.dismiss()
  }

  const handleSubmitComposer = (): void => {
    const body = composerText.trim()
    if (!body) {
      handleCloseComposer()
      return
    }
    const accepted = onSendRoomMessage(body)
    if (accepted) {
      sayPhrase(localUser.userId, body, "chat")
    }
    setComposerText("")
    handleCloseComposer()
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
    <View style={styles.root}>
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
            <RoomMapLayer scene={store.scene} interaction={store.interaction} />
            <HotspotLayer
              hotspots={store.scene.hotspots}
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

            {composerOpen ? (
              <ComposerOverlay
                value={composerText}
                onChangeText={(value) =>
                  setComposerText(value.slice(0, MAX_ROOM_MESSAGE_LENGTH))
                }
                onSubmit={handleSubmitComposer}
                onClose={handleCloseComposer}
                disabled={composerDisabled}
              />
            ) : (
              <SayDock
                phrases={SAY_PHRASES}
                onPickPhrase={handleSayPhrase}
                disabled={connectionStatus !== "connected" || !canChatSend}
                onOpenComposer={handleOpenComposer}
                canComposerOpen={canChatSend}
              />
            )}
          </Pressable>
        </Animated.View>
      </View>

      <SafeAreaView
        edges={["top", "left", "right", "bottom"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="box-none"
      >
        <MiniRoomHud
          connectionStatus={connectionStatus}
          localMedia={localMedia}
          canSendReaction={canSendReaction}
          leaveDisabled={leaveDisabled}
          onLeave={onLeave}
          onRetryConnect={onRetryConnect}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onSendReaction={handleSendReaction}
        />
      </SafeAreaView>
    </View>
  )
}

interface SayDockProps {
  phrases: RoomPhrase[]
  disabled: boolean
  onPickPhrase: (phrase: RoomPhrase) => void
  onOpenComposer: () => void
  canComposerOpen: boolean
}

function SayDock(props: SayDockProps) {
  const { phrases, disabled, onPickPhrase, onOpenComposer, canComposerOpen } = props
  return (
    <View style={styles.sayDockWrap} pointerEvents="box-none">
      <View style={styles.sayDock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.sayDockContent}
        >
          {phrases.map((phrase) => (
            <Pressable
              key={phrase.id}
              disabled={disabled}
              onPress={() => onPickPhrase(phrase)}
              style={({ pressed }) => [
                styles.sayChip,
                phrase.tone === "greeting" ? styles.sayChipGreeting : null,
                disabled ? styles.sayChipDisabled : null,
                pressed ? styles.sayChipPressed : null
              ]}
            >
              <Text style={styles.sayChipText} numberOfLines={1}>
                {phrase.body}
              </Text>
            </Pressable>
          ))}
          <Pressable
            disabled={!canComposerOpen}
            onPress={onOpenComposer}
            style={({ pressed }) => [
              styles.sayChip,
              styles.sayChipType,
              !canComposerOpen ? styles.sayChipDisabled : null,
              pressed ? styles.sayChipPressed : null
            ]}
          >
            <Text style={styles.sayChipType__icon}>✎</Text>
            <Text style={styles.sayChipText}>Type…</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  )
}

interface ComposerOverlayProps {
  value: string
  disabled: boolean
  onChangeText: (value: string) => void
  onSubmit: () => void
  onClose: () => void
}

function ComposerOverlay(props: ComposerOverlayProps) {
  const { value, disabled, onChangeText, onSubmit, onClose } = props
  return (
    <View style={styles.composerWrap}>
      <View style={styles.composerBar}>
        <Pressable onPress={onClose} hitSlop={6} style={styles.composerCancel}>
          <Text style={styles.composerCancelText}>×</Text>
        </Pressable>
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Say something in the room…"
          placeholderTextColor="rgba(90, 50, 70, 0.6)"
          maxLength={140}
          returnKeyType="send"
          blurOnSubmit
          style={styles.composerInput}
          editable={!disabled}
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
    backgroundColor: "#271727"
  },
  roomWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: uiTheme.spacing.xs,
    paddingTop: 64,
    paddingBottom: 84
  },
  roomStageFrame: {
    width: "100%",
    maxWidth: 430,
    aspectRatio: 1
  },
  roomStage: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "#F8ECF2",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.26)",
    shadowColor: "#1D0D16",
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8
  },
  welcomeRibbon: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34, 16, 26, 0.68)",
    borderWidth: 1,
    borderColor: "rgba(255, 201, 224, 0.55)"
  },
  welcomeText: {
    color: "#FFE9F3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  togetherWrap: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    alignItems: "center"
  },
  togetherInner: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 134, 181, 0.9)",
    shadowColor: "#FF6AA1",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  togetherHeart: {
    fontSize: 20
  },
  sayDockWrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    alignItems: "center"
  },
  sayDock: {
    width: "100%",
    maxWidth: 390,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(255, 201, 224, 0.9)",
    shadowColor: "#5B263B",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  sayDockContent: {
    gap: 6,
    paddingHorizontal: 2,
    alignItems: "center"
  },
  sayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(255, 201, 224, 0.9)"
  },
  sayChipGreeting: {
    backgroundColor: "rgba(255, 238, 248, 0.98)",
    borderColor: "rgba(255, 134, 181, 0.9)"
  },
  sayChipPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: uiTheme.colors.primarySoft
  },
  sayChipDisabled: {
    opacity: 0.45
  },
  sayChipText: {
    color: "#3A2430",
    fontSize: 11,
    fontWeight: "800"
  },
  sayChipType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 79, 152, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.9)"
  },
  sayChipType__icon: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900"
  },
  composerWrap: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    alignItems: "stretch"
  },
  composerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderWidth: 1,
    borderColor: "rgba(255, 134, 181, 0.9)",
    shadowColor: "#5B263B",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  composerCancel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 214, 230, 0.9)"
  },
  composerCancelText: {
    color: "#3A2430",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 18
  },
  composerInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#3A2430",
    fontSize: 13,
    fontWeight: "700"
  },
  composerSend: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.primary
  },
  composerSendDisabled: {
    opacity: 0.4
  },
  composerSendPressed: {
    transform: [{ scale: 0.94 }]
  },
  composerSendText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900"
  }
})
