"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketGateway = void 0;
const ws_1 = __importDefault(require("ws"));
class WebSocketGateway {
    dependencies;
    webSocketServer = new ws_1.default.Server({ noServer: true });
    connectionCounter = 0;
    constructor(dependencies) {
        this.dependencies = dependencies;
    }
    attach() {
        this.dependencies.server.on("upgrade", this.onUpgrade);
        this.webSocketServer.on("connection", this.onConnection);
    }
    detach() {
        this.dependencies.server.off("upgrade", this.onUpgrade);
        this.webSocketServer.off("connection", this.onConnection);
        for (const client of this.webSocketServer.clients) {
            client.close();
        }
        this.webSocketServer.close();
    }
    onUpgrade = (request, socket, head) => {
        const requestUrl = new URL(request.url ?? "/", "http://localhost");
        if (requestUrl.pathname !== this.dependencies.options.websocketPath) {
            socket.destroy();
            return;
        }
        const sessionToken = requestUrl.searchParams.get("sessionToken");
        if (!sessionToken) {
            socket.destroy();
            return;
        }
        const actor = this.dependencies.sessionService.resolveActorProfile(sessionToken);
        if (!actor) {
            socket.destroy();
            return;
        }
        this.webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
            this.webSocketServer.emit("connection", webSocket, request, { actor, sessionToken });
        });
    };
    onConnection = (socket, _request, auth) => {
        const connectionId = this.createConnectionId();
        this.dependencies.connectionRegistry.registerConnection({
            connectionId,
            userId: auth.actor.userId,
            socket
        });
        let cleanedUp = false;
        const cleanupConnection = () => {
            if (cleanedUp) {
                return;
            }
            cleanedUp = true;
            const roomId = this.dependencies.connectionRegistry.getConnectionRoom(connectionId);
            if (roomId) {
                this.dependencies.eventBridge.handleClientEvent({
                    connectionId,
                    actor: auth.actor,
                    event: {
                        type: "room.leave",
                        payload: { roomId }
                    },
                    emit: (targetConnectionId, serverEvent) => this.emitServerEvent(targetConnectionId, serverEvent)
                });
            }
            this.dependencies.connectionRegistry.unregisterConnection(connectionId);
        };
        socket.on("message", (rawData) => {
            this.handleMessage(connectionId, auth.actor, auth.sessionToken, rawData);
        });
        socket.on("close", () => {
            cleanupConnection();
        });
        socket.on("error", () => {
            cleanupConnection();
        });
    };
    handleMessage(connectionId, actor, authenticatedSessionToken, rawData) {
        const decoded = this.dependencies.eventCodec.decodeClientEvent(rawData);
        if (!decoded.ok) {
            return;
        }
        if (decoded.event.type === "room.join" &&
            decoded.event.payload.sessionToken !== authenticatedSessionToken) {
            return;
        }
        this.dependencies.eventBridge.handleClientEvent({
            connectionId,
            actor,
            event: decoded.event,
            emit: (targetConnectionId, serverEvent) => this.emitServerEvent(targetConnectionId, serverEvent)
        });
    }
    emitServerEvent(connectionId, serverEvent) {
        const socket = this.dependencies.connectionRegistry.getSocket(connectionId);
        if (!socket || socket.readyState !== ws_1.default.OPEN) {
            return;
        }
        const encoded = this.dependencies.eventCodec.encodeServerEvent(serverEvent);
        if (!encoded) {
            return;
        }
        socket.send(encoded);
    }
    createConnectionId() {
        this.connectionCounter += 1;
        return `conn_${this.connectionCounter}`;
    }
}
exports.WebSocketGateway = WebSocketGateway;
