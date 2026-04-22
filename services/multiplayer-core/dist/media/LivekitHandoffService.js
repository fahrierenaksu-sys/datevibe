"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivekitHandoffService = void 0;
const crypto_1 = require("crypto");
const DEFAULT_LIVEKIT_URL = "wss://livekit.invalid";
const DEFAULT_TOKEN_TTL_SECONDS = 60 * 30;
function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
function encodeBase64Url(value) {
    return Buffer.from(value).toString("base64url");
}
function signHs256(unsignedToken, apiSecret) {
    return (0, crypto_1.createHmac)("sha256", apiSecret).update(unsignedToken).digest("base64url");
}
class LivekitHandoffService {
    livekitUrl;
    apiKey;
    apiSecret;
    tokenTtlSeconds;
    constructor(options = {}) {
        this.livekitUrl = options.livekitUrl?.trim() || DEFAULT_LIVEKIT_URL;
        this.apiKey = options.apiKey?.trim() || undefined;
        this.apiSecret = options.apiSecret?.trim() || undefined;
        this.tokenTtlSeconds = options.tokenTtlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS;
    }
    issueToken(miniRoom, userId) {
        return {
            miniRoomId: miniRoom.miniRoomId,
            livekitUrl: this.livekitUrl,
            token: this.createToken(miniRoom, userId),
            issuedAt: new Date().toISOString()
        };
    }
    createToken(miniRoom, userId) {
        if (!this.apiKey || !this.apiSecret || this.livekitUrl === DEFAULT_LIVEKIT_URL) {
            return createId(`missing_livekit_config_${miniRoom.miniRoomId}_${userId}`);
        }
        const nowSeconds = Math.floor(Date.now() / 1000);
        const payload = {
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
        const unsignedToken = `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}`;
        return `${unsignedToken}.${signHs256(unsignedToken, this.apiSecret)}`;
    }
}
exports.LivekitHandoffService = LivekitHandoffService;
