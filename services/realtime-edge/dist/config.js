"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadRealtimeEdgeConfig = loadRealtimeEdgeConfig;
function parseNumber(value, fallback) {
    if (!value) {
        return fallback;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function loadRealtimeEdgeConfig(env = process.env) {
    return {
        host: env.REALTIME_EDGE_HOST ?? "0.0.0.0",
        port: parseNumber(env.REALTIME_EDGE_PORT, 4100),
        websocketPath: env.REALTIME_EDGE_WS_PATH ?? "/ws",
        sessionTtlMs: parseNumber(env.REALTIME_EDGE_SESSION_TTL_MS, 1000 * 60 * 60 * 24),
        livekit: {
            url: env.LIVEKIT_URL,
            apiKey: env.LIVEKIT_API_KEY,
            apiSecret: env.LIVEKIT_API_SECRET,
            tokenTtlSeconds: parseNumber(env.LIVEKIT_TOKEN_TTL_SECONDS, 60 * 30)
        }
    };
}
