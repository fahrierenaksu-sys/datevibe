export interface RealtimeEdgeConfig {
    host: string;
    port: number;
    websocketPath: string;
    sessionTtlMs: number;
    livekit: {
        url?: string;
        apiKey?: string;
        apiSecret?: string;
        tokenTtlSeconds: number;
    };
}
export declare function loadRealtimeEdgeConfig(env?: NodeJS.ProcessEnv): RealtimeEdgeConfig;
//# sourceMappingURL=config.d.ts.map