import type { MediaSessionToken, MiniRoom } from "@datevibe/contracts"
import type { ServerEvent } from "@datevibe/contracts"
import {
  createNavigationContainerRef,
  NavigationContainer
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { MatchResultModal } from "../components/MatchResultModal"
import type { CandidateAvatarSnapshot } from "../components/DiscoverCard"
import { addCoins } from "../features/cosmetics/cosmeticStore"
import { checkDailyReward } from "../features/rewards/dailyReward"
import { isDemoMode, setDemoMode } from "../features/demo/demoStore"
import { MOBILE_WS_BASE_URL } from "../config/env"
import {
  applyChatMessageListed,
  applyChatMessageReceived,
  applyChatThreadCreated,
  applyChatThreadListed,
  findThreadForPartner,
  getThreads,
  resetChatStore,
  useChatStore
} from "../features/chat/chatStore"
import { recordMutualConnection } from "../features/connections/savedConnectionsStore"
import {
  connectGlobal,
  disconnectGlobal,
  sendGlobal,
  subscribeToStatus,
  useGlobalRealtimeEvents
} from "../features/realtime/globalRealtimeProvider"
import {
  createLoadedDemoThreadList,
  shouldConnectGlobalRealtime
} from "../features/realtime/realtimeMode"
import { LobbyScreen } from "../screens/LobbyScreen"
import { MiniRoomScreen } from "../screens/MiniRoomScreen"
import {
  MyRoomScreen,
  RoomShopScreen
} from "../screens/MyRoomScreen"
import { MyRoomV2PreviewScreen } from "../screens/MyRoomV2PreviewScreen"
import {
  ProfilePreviewScreen,
  type ProfilePreviewData
} from "../screens/ProfilePreviewScreen"
import { RoomV2PreviewScreen } from "../screens/RoomV2PreviewScreen"
import { RoomDebriefScreen } from "../screens/RoomDebriefScreen"
import { SavedConnectionsScreen } from "../screens/SavedConnectionsScreen"
import { InboxScreen } from "../screens/InboxScreen"
import { ChatThreadScreen } from "../screens/ChatThreadScreen"
import { YouScreen } from "../screens/YouScreen"
import { CosmeticShopScreen } from "../screens/CosmeticShopScreen"
import { ProfileEditScreen } from "../screens/ProfileEditScreen"
import { SettingsScreen } from "../screens/SettingsScreen"
import { WelcomeScreen } from "../screens/WelcomeScreen"
import { AuthEntryScreen } from "../screens/AuthEntryScreen"
import { RegisterScreen } from "../screens/RegisterScreen"
import { ProfileSetupScreen } from "../screens/ProfileSetupScreen"
import { AvatarSetupScreen } from "../screens/AvatarSetupScreen"
import { RoomSetupScreen } from "../screens/RoomSetupScreen"
import { WardrobeV2Screen } from "../screens/WardrobeV2Screen"
import { useSessionState } from "../features/session/useSessionState"
import { selectSessionEntryRoute } from "../features/session/sessionRouting"
import { uiTheme } from "../ui/theme"
import { ToastContainer, showToast } from "../ui/toast"
import { BrandMark } from "../ui/brandMark"
import { SoftBlobBackground } from "../ui/backgrounds"
import { BottomNav, type BottomNavKey } from "../ui/bottomNav"

export interface ReadyMiniRoomRouteParam {
  miniRoom: MiniRoom
  mediaSession: MediaSessionToken
}

export interface MiniRoomParticipantsRouteParam {
  you: { userId: string; displayName: string }
  partner: {
    userId: string
    displayName: string
    avatarSnapshot?: CandidateAvatarSnapshot
  }
}

export type RootStackParamList = {
  Welcome: undefined
  AuthEntry: undefined
  Register: undefined
  ProfileSetup: undefined
  AvatarSetup: undefined
  RoomSetup: undefined
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
  MyRoom: undefined
  You: undefined
  CosmeticShop: undefined
  ProfileEdit: undefined
  WardrobeV2: undefined
  MyRoomV2Preview: {
    placementItemId?: string
  } | undefined
  RoomV2Preview: undefined
  RoomShop: undefined
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

function getBottomNavKeyForRoute(
  routeName: keyof RootStackParamList | undefined
): BottomNavKey | null {
  if (routeName === "Lobby") return "discover"
  if (routeName === "Inbox") return "chats"
  if (routeName === "MyRoom") return "myroom"
  if (routeName === "CosmeticShop") return "shop"
  return null
}

interface GlobalMatchState {
  miniRoomId: string
  matchedUserName: string
  matchedUserId?: string
}

export function RootNavigator() {
  const {
    sessionActor,
    hasSeenIntro,
    isHydrating,
    isBootstrapping,
    errorMessage,
    completeIntro,
    registerSessionActor,
    startDemoSession,
    completeProfileSetup,
    completeAvatarSetup,
    completeRoomSetup,
    updateSessionProfile,
    clearErrorMessage,
    clearSessionActor
  } = useSessionState()
  const [globalMatch, setGlobalMatch] = useState<GlobalMatchState | null>(null)
  const handledMatchIdsRef = useRef(new Set<string>())
  const [currentRouteName, setCurrentRouteName] = useState<
    keyof RootStackParamList | undefined
  >()
  const { totalUnreadCount } = useChatStore()
  const sessionEntryRoute = selectSessionEntryRoute({
    isHydrating,
    hasSeenIntro,
    sessionActor
  })

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

  const syncCurrentRouteName = useCallback((): void => {
    setCurrentRouteName(
      navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined
    )
  }, [])

  const handleBottomNavPress = useCallback((key: BottomNavKey): void => {
    setGlobalMatch(null)
    if (!navigationRef.isReady()) return
    if (key === "discover") {
      navigationRef.navigate("Lobby")
    } else if (key === "chats") {
      navigationRef.navigate("Inbox")
    } else if (key === "myroom") {
      navigationRef.navigate("MyRoom")
    } else if (key === "shop") {
      navigationRef.navigate("CosmeticShop")
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
    if (!sessionActor || sessionEntryRoute !== "Main") {
      if (isDemoMode()) setDemoMode(false)
      handledMatchIdsRef.current.clear()
      setGlobalMatch(null)
      resetChatStore()
      disconnectGlobal()
      return
    }

    const isDemoSession = sessionActor.session.mode === "demo"
    if (isDemoMode() !== isDemoSession) setDemoMode(isDemoSession)

    if (!shouldConnectGlobalRealtime(isDemoSession)) {
      disconnectGlobal()
      applyChatThreadListed(
        createLoadedDemoThreadList(sessionActor.profile.userId, getThreads())
      )
      void checkDailyReward()
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
        if (sessionActor.session.mode === "production") {
          void clearSessionActor()
        }
      }
    })

    return () => {
      unsubscribeConnected()
      unsubscribeInvalidSession()
      disconnectGlobal()
    }
  }, [clearSessionActor, sessionActor, sessionEntryRoute])

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

  if (sessionEntryRoute === "Splash") {
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

  const currentBottomNavKey = sessionEntryRoute === "Main" && sessionActor
    ? getBottomNavKeyForRoute(currentRouteName)
    : null

  return (
    <View style={styles.navigatorShell}>
      <NavigationContainer
        ref={navigationRef}
        onReady={syncCurrentRouteName}
        onStateChange={syncCurrentRouteName}
      >
        <Stack.Navigator
          key={sessionEntryRoute}
          screenOptions={{ contentStyle: styles.screenContent }}
        >
          {sessionEntryRoute === "Main" && sessionActor ? (
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
                options={{ headerShown: false }}
              >
                {(screenProps) => (
                  <InboxScreen
                    {...screenProps}
                    sessionActor={sessionActor}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="MyRoom"
                options={{ headerShown: false }}
              >
                {(screenProps) => (
                  <MyRoomScreen
                    {...screenProps}
                    sessionActor={sessionActor}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="WardrobeV2"
                component={WardrobeV2Screen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MyRoomV2Preview"
                component={MyRoomV2PreviewScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RoomV2Preview"
                component={RoomV2PreviewScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RoomShop"
                component={RoomShopScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatThread"
                options={{ headerShown: false }}
              >
                {(screenProps) => (
                  <ChatThreadScreen
                    {...screenProps}
                    sessionActor={sessionActor}
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
                    onSave={(displayName, age) =>
                      updateSessionProfile({ displayName, age })
                    }
                  />
                )}
              </Stack.Screen>
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
              />
            </>
          ) : sessionEntryRoute === "Welcome" ? (
            <Stack.Screen
              name="Welcome"
              options={{ headerShown: false }}
            >
              {() => (
                <WelcomeScreen
                  isSubmitting={isBootstrapping}
                  errorMessage={errorMessage}
                  onComplete={completeIntro}
                />
              )}
            </Stack.Screen>
          ) : sessionEntryRoute === "AuthEntry" ? (
            <>
              <Stack.Screen name="AuthEntry" options={{ headerShown: false }}>
                {(screenProps) => (
                  <AuthEntryScreen
                    {...screenProps}
                    isSubmitting={isBootstrapping}
                    errorMessage={errorMessage}
                    onStartDemo={startDemoSession}
                    onClearError={clearErrorMessage}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Register" options={{ headerShown: false }}>
                {(screenProps) => (
                  <RegisterScreen
                    {...screenProps}
                    isSubmitting={isBootstrapping}
                    errorMessage={errorMessage}
                    onRegister={registerSessionActor}
                    onClearError={clearErrorMessage}
                  />
                )}
              </Stack.Screen>
            </>
          ) : sessionEntryRoute === "ProfileSetup" && sessionActor ? (
            <Stack.Screen name="ProfileSetup" options={{ headerShown: false }}>
              {() => (
                <ProfileSetupScreen
                  sessionActor={sessionActor}
                  isSubmitting={isBootstrapping}
                  errorMessage={errorMessage}
                  onComplete={completeProfileSetup}
                />
              )}
            </Stack.Screen>
          ) : sessionEntryRoute === "AvatarSetup" ? (
            <Stack.Screen name="AvatarSetup" options={{ headerShown: false }}>
              {() => (
                <AvatarSetupScreen
                  isSubmitting={isBootstrapping}
                  errorMessage={errorMessage}
                  onComplete={completeAvatarSetup}
                />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="RoomSetup" options={{ headerShown: false }}>
              {() => (
                <RoomSetupScreen
                  isSubmitting={isBootstrapping}
                  errorMessage={errorMessage}
                  onComplete={completeRoomSetup}
                />
              )}
            </Stack.Screen>
          )}
        </Stack.Navigator>
        {sessionEntryRoute === "Main" && sessionActor ? (
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
      {currentBottomNavKey ? (
        <BottomNav
          currentKey={currentBottomNavKey}
          chatCount={totalUnreadCount}
          onPress={handleBottomNavPress}
        />
      ) : null}
      {sessionEntryRoute === "Main" &&
      sessionActor?.session.mode === "demo" ? (
        <View
          accessibilityLabel="Demo world session"
          pointerEvents="none"
          style={styles.demoBadge}
        >
          <View style={styles.demoDot} />
          <Text style={styles.demoBadgeText}>Demo world</Text>
        </View>
      ) : null}
      <ToastContainer />
    </View>
  )
}

const styles = StyleSheet.create({
  navigatorShell: {
    flex: 1,
    backgroundColor: uiTheme.colors.background
  },
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
    ...uiTheme.font.bodySmall,
    fontWeight: "600",
    letterSpacing: 0.3
  },
  screenContent: {
    backgroundColor: uiTheme.colors.background
  },
  demoBadge: {
    position: "absolute",
    top: 54,
    right: 14,
    zIndex: 100,
    minHeight: 30,
    paddingHorizontal: uiTheme.spacing.sm,
    borderRadius: uiTheme.radius.full,
    flexDirection: "row",
    alignItems: "center",
    gap: uiTheme.spacing.xs,
    backgroundColor: "rgba(32, 22, 42, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)"
  },
  demoDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: uiTheme.colors.primary
  },
  demoBadgeText: {
    ...uiTheme.font.micro,
    color: uiTheme.colors.textInverted
  }
})
