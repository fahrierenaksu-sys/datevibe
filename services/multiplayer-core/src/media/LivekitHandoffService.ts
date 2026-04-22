import { createHmac } from "crypto";
import type { MediaSessionToken, MiniRoom } from "@datevibe/contracts";
import type { VideoGrant } from "livekit-server-sdk";

const DEFAULT_LIVEKIT_URL = "wss://livekit.invalid";
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 30;

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function signHs256(unsignedToken: string, apiSecret: string): string {
  return createHmac("sha256", apiSecret).update(unsignedToken).digest("base64url");
}

export interface LivekitHandoffOptions {
  livekitUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  tokenTtlSeconds?: number;
}

interface LivekitTokenPayload {
  iss: string;
  sub: string;
  nbf: number;
  exp: number;
  video: VideoGrant;
}

export class LivekitHandoffService {
  private readonly livekitUrl: string;
  private readonly apiKey?: string;
  private readonly apiSecret?: string;
  private readonly tokenTtlSeconds: number;

  public constructor(options: LivekitHandoffOptions = {}) {
    this.livekitUrl = options.livekitUrl?.trim() || DEFAULT_LIVEKIT_URL;
    this.apiKey = options.apiKey?.trim() || undefined;
    this.apiSecret = options.apiSecret?.trim() || undefined;
    this.tokenTtlSeconds = options.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS;
  }

  public issueToken(miniRoom: MiniRoom, userId: string): MediaSessionToken {
    return {
      miniRoomId: miniRoom.miniRoomId,
      livekitUrl: this.livekitUrl,
      token: this.createToken(miniRoom, userId),
      issuedAt: new Date().toISOString()
    };
  }

  private createToken(miniRoom: MiniRoom, userId: string): string {
    if (!this.apiKey || !this.apiSecret || this.livekitUrl === DEFAULT_LIVEKIT_URL) {
      return createId(`missing_livekit_config_${miniRoom.miniRoomId}_${userId}`);
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const payload: LivekitTokenPayload = {
      iss: this.apiKey,
      sub: userId,
      nbf: 0,
      exp: nowSeconds + this.tokenTtlSeconds,
      video: {
        roomJoin: true,
        room: miniRoom.livekitRoomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      }
    };
    const header = { alg: "HS256", typ: "JWT" };
    const unsignedToken = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(
      JSON.stringify(payload)
    )}`;

    return `${unsignedToken}.${signHs256(unsignedToken, this.apiSecret)}`;
  }
}
