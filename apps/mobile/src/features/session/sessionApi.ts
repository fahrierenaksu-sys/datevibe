import {
  createIncompleteOnboardingStatus,
  normalizeSessionActor,
  type SessionActor
} from "./sessionModel"

export interface UpdateSessionProfileInput {
  displayName: string
  age?: number
  avatarPresetId?: string
}

export interface RegisterAccountInput {
  phoneNumber: string
  verificationCode: string
}

export function updateSessionActorProfile(
  sessionActor: SessionActor,
  input: UpdateSessionProfileInput
): SessionActor {
  return {
    ...sessionActor,
    profile: {
      ...sessionActor.profile,
      displayName: input.displayName,
      age: input.age,
      avatar: {
        ...sessionActor.profile.avatar,
        presetId:
          input.avatarPresetId ?? sessionActor.profile.avatar.presetId
      }
    }
  }
}

function withBaseUrl(baseHttpUrl: string, path: string): string {
  const trimmed = baseHttpUrl.endsWith("/") ? baseHttpUrl.slice(0, -1) : baseHttpUrl
  return `${trimmed}${path}`
}

export async function registerAccount(
  baseHttpUrl: string,
  input: RegisterAccountInput,
  fetcher: typeof fetch = fetch
): Promise<SessionActor> {
  const response = await fetcher(withBaseUrl(baseHttpUrl, "/v1/accounts/register"), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  })
  const payload: unknown = await response.json()

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload, "Account registration failed"))
  }

  const actor = normalizeSessionActor(payload, {
    requireExplicitIdentity: true,
    requiredMode: "production"
  })
  if (!actor || actor.session.mode !== "production") {
    throw new Error("Registration did not return a production session")
  }

  return {
    ...actor,
    session: {
      ...actor.session,
      onboarding: createIncompleteOnboardingStatus()
    }
  }
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as Record<string, unknown>).error === "string"
  )
    ? ((payload as Record<string, unknown>).error as string)
    : fallback
}

export type { SessionActor } from "./sessionModel"
