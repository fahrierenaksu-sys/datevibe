import { useCallback, useEffect, useState } from "react"
import { MOBILE_HTTP_BASE_URL } from "../../config/env"
import {
  registerAccount,
  type RegisterAccountInput,
  type UpdateSessionProfileInput,
  updateSessionActorProfile
} from "./sessionApi"
import { logoutCurrentSession } from "./sessionLifecycle"
import {
  completeSessionSetupStep,
  createDemoSessionActor,
  type SessionActor
} from "./sessionModel"
import {
  clearSessionActor as clearStoredSessionActor,
  loadHasSeenIntro,
  loadSessionActor,
  saveHasSeenIntro,
  saveSessionActor
} from "./sessionStorage"

export interface UseSessionStateResult {
  sessionActor: SessionActor | null
  hasSeenIntro: boolean
  isHydrating: boolean
  isBootstrapping: boolean
  errorMessage: string | null
  completeIntro: () => Promise<void>
  registerSessionActor: (input: RegisterAccountInput) => Promise<void>
  startDemoSession: () => Promise<void>
  completeProfileSetup: (input: UpdateSessionProfileInput) => Promise<void>
  completeAvatarSetup: () => Promise<void>
  completeRoomSetup: () => Promise<void>
  updateSessionProfile: (input: UpdateSessionProfileInput) => Promise<void>
  clearErrorMessage: () => void
  clearSessionActor: () => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return "Unexpected error"
}

export function useSessionState(): UseSessionStateResult {
  const [sessionActor, setSessionActor] = useState<SessionActor | null>(null)
  const [hasSeenIntro, setHasSeenIntro] = useState(false)
  const [isHydrating, setIsHydrating] = useState(true)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    Promise.allSettled([loadSessionActor(), loadHasSeenIntro()])
      .then(([sessionResult, introResult]) => {
        if (!mounted) {
          return
        }

        if (sessionResult.status === "fulfilled") {
          setSessionActor(sessionResult.value)
        } else {
          setSessionActor(null)
          setErrorMessage(getErrorMessage(sessionResult.reason))
        }

        if (introResult.status === "fulfilled") {
          setHasSeenIntro(introResult.value)
        } else {
          setErrorMessage(getErrorMessage(introResult.reason))
        }
      })
      .finally(() => {
        if (!mounted) {
          return
        }
        setIsHydrating(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const completeIntro = useCallback(async (): Promise<void> => {
    setIsBootstrapping(true)
    setErrorMessage(null)
    try {
      await saveHasSeenIntro()
      setHasSeenIntro(true)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      throw error
    } finally {
      setIsBootstrapping(false)
    }
  }, [])

  const registerSessionActor = useCallback(
    async (input: RegisterAccountInput): Promise<void> => {
      setIsBootstrapping(true)
      setErrorMessage(null)
      try {
        const nextSessionActor = await registerAccount(MOBILE_HTTP_BASE_URL, input)
        await saveSessionActor(nextSessionActor)
        setSessionActor(nextSessionActor)
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
        throw error
      } finally {
        setIsBootstrapping(false)
      }
    },
    []
  )

  const startDemoSession = useCallback(async (): Promise<void> => {
    setIsBootstrapping(true)
    setErrorMessage(null)
    try {
      const nextSessionActor = createDemoSessionActor({
        displayName: "Demo Guest",
        age: 24,
        avatarPresetId: "sunset"
      })
      await saveSessionActor(nextSessionActor)
      setSessionActor(nextSessionActor)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      throw error
    } finally {
      setIsBootstrapping(false)
    }
  }, [])

  const clearSessionActor = useCallback(async (): Promise<void> => {
    setIsBootstrapping(true)
    setErrorMessage(null)
    try {
      const loggedOutState = await logoutCurrentSession({
        clear: clearStoredSessionActor
      })
      setSessionActor(loggedOutState)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      throw error
    } finally {
      setIsBootstrapping(false)
    }
  }, [])

  const persistSessionUpdate = useCallback(
    async (
      createNext: (current: SessionActor) => SessionActor
    ): Promise<void> => {
      if (!sessionActor) {
        throw new Error("No active session")
      }
      const nextSessionActor = createNext(sessionActor)
      await saveSessionActor(nextSessionActor)
      setSessionActor(nextSessionActor)
    },
    [sessionActor]
  )

  const runSessionMutation = useCallback(
    async (
      createNext: (current: SessionActor) => SessionActor
    ): Promise<void> => {
      setIsBootstrapping(true)
      setErrorMessage(null)
      try {
        await persistSessionUpdate(createNext)
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
        throw error
      } finally {
        setIsBootstrapping(false)
      }
    },
    [persistSessionUpdate]
  )

  const updateSessionProfile = useCallback(
    async (input: UpdateSessionProfileInput): Promise<void> => {
      await runSessionMutation((current) =>
        updateSessionActorProfile(current, input)
      )
    },
    [runSessionMutation]
  )

  const completeProfileSetup = useCallback(
    async (input: UpdateSessionProfileInput): Promise<void> => {
      await runSessionMutation((current) =>
        completeSessionSetupStep(
          updateSessionActorProfile(current, input),
          "profile"
        )
      )
    },
    [runSessionMutation]
  )

  const completeAvatarSetup = useCallback(async (): Promise<void> => {
    await runSessionMutation((current) =>
      completeSessionSetupStep(current, "avatar")
    )
  }, [runSessionMutation])

  const completeRoomSetup = useCallback(async (): Promise<void> => {
    await runSessionMutation((current) =>
      completeSessionSetupStep(current, "room")
    )
  }, [runSessionMutation])

  const clearErrorMessage = useCallback((): void => {
    setErrorMessage(null)
  }, [])

  return {
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
  }
}
