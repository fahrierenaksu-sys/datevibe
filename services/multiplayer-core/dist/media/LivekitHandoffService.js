"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LivekitHandoffService = void 0;
function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
class LivekitHandoffService {
    livekitUrl;
    constructor(options = {}) {
        this.livekitUrl = options.livekitUrl ?? "wss://livekit.invalid";
    }
    issueToken(miniRoom, userId) {
        return {
            miniRoomId: miniRoom.miniRoomId,
            livekitUrl: this.livekitUrl,
            token: createId(`dev_token_${miniRoom.miniRoomId}_${userId}`),
            issuedAt: new Date().toISOString()
        };
    }
}
exports.LivekitHandoffService = LivekitHandoffService;
