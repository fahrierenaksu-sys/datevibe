import { useCallback, useEffect, useState } from "react"
import {
  IS_DATEVIBE_MEDIA_DEMO_MODE,
  MOBILE_HTTP_BASE_URL
} from "../../config/env"
import {
  bootstrapSession,
  createDemoSessionActor,
  type BootstrapSessionInput,
  type SessionActor,
  type UpdateSessionProfileInput,
  updateSessionActorProfile
} from "./sessionApi"
import {
  clearSessionActor as clearStoredSessionActor,
  loadSessionActor,
  saveSessionActor
} from "./sessionStorage"

export interface UseSessionStateResult {
  sessionActor: SessionActor | null
  isHydrating: boolean
  isBootstrapping: boolean
  errorMessage: string | null
  bootstrapSessionActor: (input: BootstrapSessionInput) => Promise<void>
  updateSessionProfile: (input: UpdateSessionProfileInput) => Promise<void>
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
  const [isHydrating, setIsHydrating] = useState(true)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    loadSessionActor()
      .then((storedSessionActor) => {
        if (!mounted) {
          return
        }
        setSessionActor(storedSessionActor)
      })
      .catch(() => {
        if (!mounted) {
          return
        }
        setSessionActor(null)
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

  const bootstrapSessionActor = useCallback(async (input: BootstrapSessionInput) => {
    setIsBootstrapping(true)
    setErrorMessage(null)

    try {
      const nextSessionActor = IS_DATEVIBE_MEDIA_DEMO_MODE
        ? createDemoSessionActor(input)
        : await bootstrapSession(MOBILE_HTTP_BASE_URL, input)
      await saveSessionActor(nextSessionActor)
      setSessionActor(nextSessionActor)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsBootstrapping(false)
    }
  }, [])

  const clearSessionActor = useCallback(async () => {
    await clearStoredSessionActor()
    setSessionActor(null)
    setErrorMessage(null)
  }, [])

  const updateSessionProfile = useCallback(
    async (input: UpdateSessionProfileInput): Promise<void> => {
      if (!sessionActor) {
        throw new Error("No active session")
      }
      const nextSessionActor = updateSessionActorProfile(sessionActor, input)
      await saveSessionActor(nextSessionActor)
      setSessionActor(nextSessionActor)
    },
    [sessionActor]
  )

  return {
    sessionActor,
    isHydrating,
    isBootstrapping,
    errorMessage,
    bootstrapSessionActor,
    updateSessionProfile,
    clearSessionActor
  }
}
