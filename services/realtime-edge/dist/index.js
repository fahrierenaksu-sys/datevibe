"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
__exportStar(require("./app"), exports);
__exportStar(require("./config"), exports);
__exportStar(require("./http/sessionRoutes"), exports);
__exportStar(require("./realtime/ConnectionRegistry"), exports);
__exportStar(require("./realtime/EventBridge"), exports);
__exportStar(require("./realtime/EventCodec"), exports);
__exportStar(require("./realtime/WebSocketGateway"), exports);
__exportStar(require("./session/InMemorySessionStore"), exports);
__exportStar(require("./session/SessionService"), exports);
if (require.main === module) {
    const runtime = (0, app_1.createRealtimeEdgeApp)();
    runtime
        .start()
        .then(() => {
        console.info(`realtime-edge listening on ${runtime.config.host}:${runtime.config.port} (${runtime.config.websocketPath})`);
    })
        .catch((error) => {
        console.error("failed to start realtime-edge", error);
        process.exitCode = 1;
    });
}
