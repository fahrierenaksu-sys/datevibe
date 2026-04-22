import WebSocket from "ws";
import { type ClientEvent, type ServerEvent } from "@datevibe/contracts";
export type DecodedClientEvent = {
    ok: true;
    event: ClientEvent;
} | {
    ok: false;
    error: string;
};
export declare class EventCodec {
    decodeClientEvent(rawData: WebSocket.Data): DecodedClientEvent;
    encodeServerEvent(event: ServerEvent): string | undefined;
}
//# sourceMappingURL=EventCodec.d.ts.map