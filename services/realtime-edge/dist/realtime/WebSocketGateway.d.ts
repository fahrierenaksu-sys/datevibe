import type { Server as HttpServer } from "http";
import { SessionService } from "../session/SessionService";
import { ConnectionRegistry } from "./ConnectionRegistry";
import { EventCodec } from "./EventCodec";
import { EventBridge } from "./EventBridge";
export interface WebSocketGatewayOptions {
    websocketPath: string;
}
export interface WebSocketGatewayDependencies {
    server: HttpServer;
    sessionService: SessionService;
    connectionRegistry: ConnectionRegistry;
    eventCodec: EventCodec;
    eventBridge: EventBridge;
    options: WebSocketGatewayOptions;
}
export declare class WebSocketGateway {
    private readonly dependencies;
    private readonly webSocketServer;
    private connectionCounter;
    constructor(dependencies: WebSocketGatewayDependencies);
    attach(): void;
    detach(): void;
    private readonly onUpgrade;
    private closeUpgradeWithPolicyViolation;
    private readonly onConnection;
    private handleMessage;
    private emitServerEvent;
    private createConnectionId;
}
//# sourceMappingURL=WebSocketGateway.d.ts.map