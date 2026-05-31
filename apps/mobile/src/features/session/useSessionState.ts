import { useCallback, useEffect, useState } from "react"
import { MOBILE_HTTP_BASE_URL } from "../../config/env"
import {
  bootstrapSession,
  type BootstrapSessionInput,
  type SessionActor
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
      const nextSessionActor = await bootstrapSession(MOBILE_HTTP_BASE_URL, input)
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

  return {
    sessionActor,
    isHydrating,
    isBootstrapping,
    errorMessage,
    bootstrapSessionActor,
    clearSessionActor
  }
}
