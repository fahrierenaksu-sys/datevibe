export interface RealtimeEdgeConfig {
    host: string;
    port: number;
    websocketPath: string;
    sessionTtlMs: number;
}
export declare function loadRealtimeEdgeConfig(env?: NodeJS.ProcessEnv): RealtimeEdgeConfig;
//# sourceMappingURL=config.d.ts.map