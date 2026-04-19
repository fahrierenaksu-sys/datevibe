function ensureNoTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

export const MOBILE_HTTP_BASE_URL = ensureNoTrailingSlash(
  process.env.EXPO_PUBLIC_REALTIME_EDGE_HTTP_URL ?? "http://127.0.0.1:4100"
)

export const MOBILE_WS_BASE_URL = ensureNoTrailingSlash(
  process.env.EXPO_PUBLIC_REALTIME_EDGE_WS_URL ?? "ws://127.0.0.1:4100"
)
