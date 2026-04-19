export interface RealtimeEdgeConfig {
  host: string
  port: number
  websocketPath: string
  sessionTtlMs: number
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function loadRealtimeEdgeConfig(
  env: NodeJS.ProcessEnv = process.env
): RealtimeEdgeConfig {
  return {
    host: env.REALTIME_EDGE_HOST ?? "0.0.0.0",
    port: parseNumber(env.REALTIME_EDGE_PORT, 4100),
    websocketPath: env.REALTIME_EDGE_WS_PATH ?? "/ws",
    sessionTtlMs: parseNumber(env.REALTIME_EDGE_SESSION_TTL_MS, 1000 * 60 * 60 * 24)
  }
}
