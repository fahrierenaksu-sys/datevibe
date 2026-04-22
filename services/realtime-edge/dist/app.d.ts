import { type Server as HttpServer } from "http";
import type { Express } from "express";
import { type RealtimeEdgeConfig } from "./config";
import { SessionService } from "./session/SessionService";
export interface RealtimeEdgeAppRuntime {
    app: Express;
    server: HttpServer;
    config: RealtimeEdgeConfig;
    sessionService: SessionService;
    start: () => Promise<void>;
    stop: () => Promise<void>;
}
export declare function createRealtimeEdgeApp(configOverrides?: Partial<RealtimeEdgeConfig>): RealtimeEdgeAppRuntime;
//# sourceMappingURL=app.d.ts.map