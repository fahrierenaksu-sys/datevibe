import type { AuthSession, UserProfile } from "@datevibe/contracts"

export interface BootstrapSessionInput {
  displayName: string
  avatarPresetId?: string
  age?: number
}

export interface SessionActor {
  session: AuthSession
  profile: UserProfile
}

function withBaseUrl(baseHttpUrl: string, path: string): string {
  const trimmed = baseHttpUrl.endsWith("/") ? baseHttpUrl.slice(0, -1) : baseHttpUrl
  return `${trimmed}${path}`
}

function isSessionActor(value: unknown): value is SessionActor {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const session = candidate.session as Record<string, unknown> | undefined
  const profile = candidate.profile as Record<string, unknown> | undefined

  if (!session || !profile) {
    return false
  }

  return (
    typeof session.userId === "string" &&
    typeof session.sessionToken === "string" &&
    typeof session.expiresAt === "string" &&
    typeof profile.userId === "string" &&
    typeof profile.displayName === "string" &&
    typeof profile.avatar === "object" &&
    profile.avatar !== null &&
    typeof (profile.avatar as Record<string, unknown>).presetId === "string"
  )
}

export async function bootstrapSession(
  baseHttpUrl: string,
  input: BootstrapSessionInput
): Promise<SessionActor> {
  const response = await fetch(withBaseUrl(baseHttpUrl, "/v1/session/bootstrap"), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      displayName: input.displayName,
      avatarPresetId: input.avatarPresetId,
      age: input.age
    })
  })

  const payload: unknown = await response.json()

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" &&
      payload !== null &&
      typeof (payload as Record<string, unknown>).error === "string"
        ? ((payload as Record<string, unknown>).error as string)
        : "Session bootstrap failed"
    throw new Error(errorMessage)
  }

  if (!isSessionActor(payload)) {
    throw new Error("Invalid bootstrap response")
  }

  return payload
}
