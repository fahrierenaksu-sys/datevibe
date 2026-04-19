import type { MediaSessionToken, MiniRoom } from "@contracts";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface LivekitHandoffOptions {
  livekitUrl?: string;
}

export class LivekitHandoffService {
  private readonly livekitUrl: string;

  public constructor(options: LivekitHandoffOptions = {}) {
    this.livekitUrl = options.livekitUrl ?? "wss://livekit.invalid";
  }

  public issueToken(miniRoom: MiniRoom, userId: string): MediaSessionToken {
    return {
      miniRoomId: miniRoom.miniRoomId,
      livekitUrl: this.livekitUrl,
      token: createId(`dev_token_${miniRoom.miniRoomId}_${userId}`),
      issuedAt: new Date().toISOString()
    };
  }
}
