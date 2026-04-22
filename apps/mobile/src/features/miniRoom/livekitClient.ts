interface LivekitLocalParticipantLike {
  setMicrophoneEnabled: (enabled: boolean) => Promise<unknown>
  setCameraEnabled: (enabled: boolean) => Promise<unknown>
}

interface LivekitRoomLike {
  connect: (url: string, token: string) => Promise<void>
  disconnect: () => void
  localParticipant: LivekitLocalParticipantLike
}

interface LivekitModuleLike {
  registerGlobals?: () => void
}

interface LivekitClientModuleLike {
  Room: new () => LivekitRoomLike
}

export interface LivekitConnectInput {
  livekitUrl: string
  token: string
}

export interface LivekitClient {
  connect: (input: LivekitConnectInput) => Promise<void>
  disconnect: () => Promise<void>
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>
  setCameraEnabled: (enabled: boolean) => Promise<void>
}

function ensureDomException(): void {
  if (typeof globalThis.DOMException !== "undefined") {
    return
  }

  const FallbackDOMException = class DOMException extends Error {
    public constructor(message = "", name = "Error") {
      super(message)
      this.name = name
    }
  }

  globalThis.DOMException = FallbackDOMException as unknown as typeof DOMException
}

function loadLivekitModule(): LivekitModuleLike {
  ensureDomException()
  return require("@livekit/react-native") as LivekitModuleLike
}

function loadLivekitClientModule(): LivekitClientModuleLike {
  ensureDomException()
  return require("livekit-client") as LivekitClientModuleLike
}

export function createLivekitClient(): LivekitClient {
  const livekitModule = loadLivekitModule()
  livekitModule.registerGlobals?.()
  const livekitClientModule = loadLivekitClientModule()
  const room = new livekitClientModule.Room()

  return {
    async connect(input: LivekitConnectInput): Promise<void> {
      await room.connect(input.livekitUrl, input.token)
    },
    async disconnect(): Promise<void> {
      room.disconnect()
    },
    async setMicrophoneEnabled(enabled: boolean): Promise<void> {
      await room.localParticipant.setMicrophoneEnabled(enabled)
    },
    async setCameraEnabled(enabled: boolean): Promise<void> {
      await room.localParticipant.setCameraEnabled(enabled)
    }
  }
}
