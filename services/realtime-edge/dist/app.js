"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRealtimeEdgeApp = createRealtimeEdgeApp;
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const multiplayer_core_1 = require("@datevibe/multiplayer-core");
const config_1 = require("./config");
const sessionRoutes_1 = require("./http/sessionRoutes");
const ConnectionRegistry_1 = require("./realtime/ConnectionRegistry");
const EventBridge_1 = require("./realtime/EventBridge");
const EventCodec_1 = require("./realtime/EventCodec");
const WebSocketGateway_1 = require("./realtime/WebSocketGateway");
const InMemorySessionStore_1 = require("./session/InMemorySessionStore");
const SessionService_1 = require("./session/SessionService");
function createRealtimeEdgeApp(configOverrides = {}) {
    const config = {
        ...(0, config_1.loadRealtimeEdgeConfig)(),
        ...configOverrides
    };
    const sessionStore = new InMemorySessionStore_1.InMemorySessionStore();
    const sessionService = new SessionService_1.SessionService(sessionStore, {
        sessionTtlMs: config.sessionTtlMs
    });
    const connectionRegistry = new ConnectionRegistry_1.ConnectionRegistry();
    const eventCodec = new EventCodec_1.EventCodec();
    const multiplayerCore = new multiplayer_core_1.MultiplayerCoreApp();
    const eventBridge = new EventBridge_1.EventBridge(multiplayerCore, connectionRegistry);
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: "64kb" }));
    app.get("/healthz", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
    app.use((0, sessionRoutes_1.createSessionRoutes)(sessionService));
    const server = (0, http_1.createServer)(app);
    const webSocketGateway = new WebSocketGateway_1.WebSocketGateway({
        server,
        sessionService,
        connectionRegistry,
        eventCodec,
        eventBridge,
        options: {
            websocketPath: config.websocketPath
        }
    });
    webSocketGateway.attach();
    let started = false;
    return {
        app,
        server,
        config,
        sessionService,
        start: async () => {
            if (started) {
                return;
            }
            await new Promise((resolve, reject) => {
                server.listen(config.port, config.host, () => resolve());
                server.once("error", (error) => reject(error));
            });
            started = true;
        },
        stop: async () => {
            if (!started) {
                webSocketGateway.detach();
                return;
            }
            webSocketGateway.detach();
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
            started = false;
        }
    };
}
