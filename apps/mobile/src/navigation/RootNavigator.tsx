import type { MediaSessionToken, MiniRoom } from "@datevibe/contracts"
import type { ServerEvent } from "@datevibe/contracts"
import {
  createNavigationContainerRef,
  NavigationContainer
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MatchResultModal } from "../components/MatchResultModal"
import { addCoins } from "../features/cosmetics/cosmeticStore"
import { checkDailyReward } from "../features/rewards/dailyReward"
import { MOBILE_WS_BASE_URL } from "../config/env"
import {
  applyChatMessageListed,
  applyChatMessageReceived,
  applyChatThreadCreated,
  applyChatThreadListed,
  findThreadForPartner,
  getThreads,
  resetChatStore
} from "../features/chat/chatStore"
import { recordMutualConnection } from "../features/connections/savedConnectionsStore"
import {
  connectGlobal,
  disconnectGlobal,
  sendGlobal,
  subscribeToStatus,
  useGlobalRealtimeEvents
} from "../features/realtime/globalRealtimeProvider"
import { LobbyScreen } from "../screens/LobbyScreen"
import { MiniRoomScreen } from "../screens/MiniRoomScreen"
import {
  ProfilePreviewScreen,
  type ProfilePreviewData
} from "../screens/ProfilePreviewScreen"
import { RoomDebriefScreen } from "../screens/RoomDebriefScreen"
import { SavedConnectionsScreen } from "../screens/SavedConnectionsScreen"
import { InboxScreen } from "../screens/InboxScreen"
import { ChatThreadScreen } from "../screens/ChatThreadScreen"
import { YouScreen } from "../screens/YouScreen"
import { CosmeticShopScreen } from "../screens/CosmeticShopScreen"
import { ProfileEditScreen } from "../screens/ProfileEditScreen"
import { SettingsScreen } from "../screens/SettingsScreen"
import { WelcomeScreen } from "../screens/WelcomeScreen"
import { SessionBootstrapScreen } from "../screens/SessionBootstrapScreen"
import { useSessionState } from "../features/session/useSessionState"
import { uiTheme } from "../ui/theme"
import { ToastContainer, showToast } from "../ui/toast"
import { BrandMark } from "../ui/brandMark"
import { SoftBlobBackground } from "../ui/backgrounds"

export interface ReadyMiniRoomRouteParam {
  miniRoom: MiniRoom
  mediaSession: MediaSessionToken
}

export interface MiniRoomParticipantsRouteParam {
  you: { userId: string; displayName: string }
  partner: { userId: string; displayName: string }
}

export type RootStackParamList = {
  Welcome: undefined
  SessionBootstrap: undefined
  Lobby: { pendingLikeUserId?: string } | undefined
  ProfilePreview: {
    profile: ProfilePreviewData
  }
  MiniRoom: {
    readyMiniRoom: ReadyMiniRoomRouteParam
    participants: MiniRoomParticipantsRouteParam
  }
  RoomDebrief: {
    miniRoomId: string
    partner: { userId: string; displayName: string }
    durationSeconds: number
    connected: boolean
  }
  SavedConnections: undefined
  Inbox: undefined
  You: undefined
  CosmeticShop: undefined
  ProfileEdit: undefined
  Settings: undefined
  ChatThread: {
    threadId?: string
    partnerId?: string
    partnerName?: string
    sendChatMessage?: (threadId: string, body: string) => void
    requestMessages?: (threadId: string) => void
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>()
const navigationRef = createNavigationContainerRef<RootStackParamList>()

interface GlobalMatchState {
  miniRoomId: string
  matchedUserName: string
  matchedUserId?: string
}

export function RootNavigator() {
  const {
    sessionActor,
    isHydrating,
    isBootstrapping,
    errorMessage,
    bootstrapSessionActor,
    clearSessionActor
  } = useSessionState()
  const [globalMatch, setGlobalMatch] = useState<GlobalMatchState | null>(null)
  const handledMatchIdsRef = useRef(new Set<string>())
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null)

  // Check if user has completed onboarding
  useEffect(() => {
    AsyncStorage.getItem("@datevibe/welcome_seen").then((val) => {
      setHasSeenWelcome(val === "true")
    }).catch(() => {
      setHasSeenWelcome(true) // fail-open
    })
  }, [])

  const completeWelcome = useCallback(() => {
    setHasSeenWelcome(true)
    void AsyncStorage.setItem("@datevibe/welcome_seen", "true")
  }, [])

  const dismissGlobalMatch = useCallback((): void => {
    setGlobalMatch(null)
  }, [])

  const goLobby = useCallback((): void => {
    setGlobalMatch(null)
    if (navigationRef.isReady()) {
      navigationRef.navigate("Lobby")
    }
  }, [])

  const goSavedShelf = useCallback((): void => {
    setGlobalMatch(null)
    if (navigationRef.isReady()) {
      navigationRef.navigate("SavedConnections")
    }
  }, [])

  const sendChatMessage = useCallback(
    (threadId: string, body: string): void => {
      sendGlobal({
        type: "chat.send_message",
        payload: { threadId, body }
      })
    },
    []
  )

  const requestMessages = useCallback(
    (threadId: string): void => {
      sendGlobal({
        type: "chat.list_messages",
        payload: { threadId }
      })
    },
    []
  )

  const goInbox = useCallback((): void => {
    setGlobalMatch(null)
    if (navigationRef.isReady()) {
      navigationRef.navigate("Inbox")
    }
  }, [])

  const goChat = useCallback(
    (params: { threadId?: string; partnerId?: string; partnerName?: string }): void => {
      setGlobalMatch(null)
      if (navigationRef.isReady()) {
        navigationRef.navigate("ChatThread", { ...params, sendChatMessage })
      }
    },
    [sendChatMessage]
  )

  // ── Global WS lifecycle ─────────────────────────────────
  useEffect(() => {
    if (!sessionActor) {
      handledMatchIdsRef.current.clear()
      setGlobalMatch(null)
      resetChatStore()
      disconnectGlobal()
      return
    }

    connectGlobal(MOBILE_WS_BASE_URL, sessionActor.session.sessionToken)

    // Request thread list once connected
    const unsubscribeConnected = subscribeToStatus((status) => {
      if (status === "connected") {
        sendGlobal({ type: "chat.list_threads", payload: {} })
        void checkDailyReward()
      }
    })

    // Handle invalid session close code
    const unsubscribeInvalidSession = subscribeToStatus((_status, meta) => {
      if (meta?.closeCode === 1008) {
        void clearSessionActor()
      }
    })

    return () => {
      unsubscribeConnected()
      unsubscribeInvalidSession()
      disconnectGlobal()
    }
  }, [clearSessionActor, sessionActor])

  // ── Chat + match event routing ──────────────────────────
  const handleGlobalEvent = useCallback(
    (event: ServerEvent): void => {
      // Chat events
      if (event.type === "chat.thread_listed") {
        applyChatThreadListed(event.payload)
        return
      }
      if (event.type === "chat.thread_created") {
        applyChatThreadCreated(event.payload)
        return
      }
      if (event.type === "chat.message_listed") {
        applyChatMessageListed(event.payload)
        return
      }
      if (event.type === "chat.message_received") {
        applyChatMessageReceived(event.payload)
        // Toast for incoming messages from others
        if (sessionActor && event.payload.senderUserId !== sessionActor.profile.userId) {
          const senderThread = getThreads().find(t => t.threadId === event.payload.threadId)
          const senderName = senderThread?.participants.find(
            p => p.userId === event.payload.senderUserId
          )?.displayName ?? "Someone"
          showToast({
            title: `${senderName}`,
            body: event.payload.body.length > 60
              ? `${event.payload.body.slice(0, 57)}…`
              : event.payload.body,
            type: "info",
            durationMs: 2500
          })
        }
        return
      }

      // Connection match
      if (
        event.type !== "connection.matched" ||
        !sessionActor ||
        !event.payload.participantUserIds.includes(sessionActor.profile.userId) ||
        handledMatchIdsRef.current.has(event.payload.miniRoomId)
      ) {
        return
      }

      handledMatchIdsRef.current.add(event.payload.miniRoomId)
      void (async () => {
        const connection = await recordMutualConnection({
          currentUserId: sessionActor!.profile.userId,
          participantUserIds: event.payload.participantUserIds
        })
        if (!connection) return
        // Reward coins for the match — core economy hook
        addCoins(50)
        showToast({
          title: "It's a match! ✨",
          body: `You and ${connection.displayName} both saved the moment`,
          type: "success"
        })
        setGlobalMatch({
          miniRoomId: event.payload.miniRoomId,
          matchedUserName: connection.displayName,
          matchedUserId: connection.userId
        })
      })()
    },
    [sessionActor]
  )

  useGlobalRealtimeEvents(handleGlobalEvent)

  if (isHydrating || hasSeenWelcome === null) {
    return (
      <View style={styles.loadingContainer}>
        <SoftBlobBackground variant="lobby" />
        <BrandMark size={56} />
        <Text style={styles.splashTitle}>DateVibe</Text>
        <Text style={styles.splashTagline}>Real moments. Real people.</Text>
        <ActivityIndicator
          size="small"
          color={uiTheme.colors.primary}
          style={{ marginTop: uiTheme.spacing.lg }}
        />
      </View>
    )
  }

  return (
    <>
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ contentStyle: styles.screenContent }}>
        {sessionActor ? (
          <>
            <Stack.Screen
              name="Lobby"
              options={{ title: "Discover", headerShown: false }}
            >
              {() => (
                <LobbyScreen
                  sessionActor={sessionActor}
                  onResetSession={clearSessionActor}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="MiniRoom"
              options={{ headerShown: false }}
            >
              {(screenProps) => (
                <MiniRoomScreen {...screenProps} sessionActor={sessionActor} />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="ProfilePreview"
              component={ProfilePreviewScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RoomDebrief"
              options={{ headerShown: false, gestureEnabled: false }}
            >
              {(screenProps) => (
                <RoomDebriefScreen
                  {...screenProps}
                  sessionActor={sessionActor}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SavedConnections"
              component={SavedConnectionsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Inbox"
              component={InboxScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatThread"
              options={{ headerShown: false }}
            >
              {(screenProps) => (
                <ChatThreadScreen
                  {...screenProps}
                  route={{
                    ...screenProps.route,
                    params: {
                      ...screenProps.route.params,
                      sendChatMessage,
                      requestMessages
                    }
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="You"
              options={{ headerShown: false }}
            >
              {(screenProps) => (
                <YouScreen
                  {...screenProps}
                  sessionActor={sessionActor}
                  onResetSession={clearSessionActor}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="CosmeticShop"
              component={CosmeticShopScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProfileEdit"
              options={{ headerShown: false }}
            >
              {(screenProps) => (
                <ProfileEditScreen
                  {...screenProps}
                  currentDisplayName={sessionActor!.profile.displayName}
                  currentAge={sessionActor!.profile.age}
                  currentUserId={sessionActor!.profile.userId}
                  onSave={(displayName, age) => {
                    // Client-side update — future: call server API
                    sessionActor!.profile.displayName = displayName
                    if (age !== undefined) sessionActor!.profile.age = age
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : hasSeenWelcome === false ? (
          <Stack.Screen
            name="Welcome"
            options={{ headerShown: false }}
          >
            {() => (
              <WelcomeScreen onComplete={completeWelcome} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="SessionBootstrap"
            options={{ headerShown: false }}
          >
            {() => (
              <SessionBootstrapScreen
                isSubmitting={isBootstrapping}
                errorMessage={errorMessage}
                onBootstrap={bootstrapSessionActor}
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
      {sessionActor ? (
        <MatchResultModal
          visible={globalMatch !== null}
          currentUserName={sessionActor.profile.displayName}
          matchedUserName={globalMatch?.matchedUserName ?? ""}
          matchedUserId={globalMatch?.matchedUserId}
          onClose={dismissGlobalMatch}
          onViewSaved={goSavedShelf}
          onKeepDiscovering={goLobby}
          onSendMessage={
            globalMatch?.matchedUserId
              ? () => {
                  const thread = findThreadForPartner(globalMatch.matchedUserId!)
                  if (thread) {
                    goChat({ threadId: thread.threadId })
                  } else {
                    // Thread not synced yet, navigate with partner intent
                    goChat({ 
                      partnerId: globalMatch.matchedUserId, 
                      partnerName: globalMatch.matchedUserName 
                    })
                  }
                }
              : undefined
          }
        />
      ) : null}
    </NavigationContainer>
    <ToastContainer />
    </>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: uiTheme.colors.background,
    gap: uiTheme.spacing.sm
  },
  splashTitle: {
    color: uiTheme.colors.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5
  },
  splashTagline: {
    color: uiTheme.colors.textMuted,
    fontSize: uiTheme.typography.bodySmall,
    fontWeight: "600",
    letterSpacing: 0.3
  },
  screenContent: {
    backgroundColor: uiTheme.colors.background
  }
})
