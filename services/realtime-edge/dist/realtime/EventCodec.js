"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventCodec = void 0;
const contracts_1 = require("@datevibe/contracts");
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function isString(value) {
    return typeof value === "string";
}
function isOptionalString(value) {
    return value === undefined || isString(value);
}
function isAllowedValue(allowed, value) {
    return typeof value === "string" && allowed.includes(value);
}
function rawDataToText(rawData) {
    if (typeof rawData === "string") {
        return rawData;
    }
    if (rawData instanceof Buffer) {
        return rawData.toString("utf8");
    }
    if (rawData instanceof ArrayBuffer) {
        return Buffer.from(rawData).toString("utf8");
    }
    if (Array.isArray(rawData)) {
        return Buffer.concat(rawData).toString("utf8");
    }
    return undefined;
}
class EventCodec {
    decodeClientEvent(rawData) {
        const text = rawDataToText(rawData);
        if (!text) {
            return { ok: false, error: "invalid_payload_encoding" };
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            return { ok: false, error: "invalid_json" };
        }
        if (!isRecord(parsed) || !isString(parsed.type) || !isRecord(parsed.payload)) {
            return { ok: false, error: "invalid_event_shape" };
        }
        const type = parsed.type;
        const payload = parsed.payload;
        switch (type) {
            case "room.join": {
                if (!isString(payload.roomId) ||
                    !isString(payload.sessionToken) ||
                    !isOptionalString(payload.initialSpotId)) {
                    return { ok: false, error: "invalid_room_join_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            roomId: payload.roomId,
                            sessionToken: payload.sessionToken,
                            initialSpotId: payload.initialSpotId
                        }
                    }
                };
            }
            case "room.leave": {
                if (!isString(payload.roomId)) {
                    return { ok: false, error: "invalid_room_leave_payload" };
                }
                return { ok: true, event: { type, payload: { roomId: payload.roomId } } };
            }
            case "presence.move_to_spot": {
                if (!isString(payload.roomId) || !isString(payload.spotId)) {
                    return { ok: false, error: "invalid_move_to_spot_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            roomId: payload.roomId,
                            spotId: payload.spotId
                        }
                    }
                };
            }
            case "mini_room.invite": {
                if (!isString(payload.roomId) || !isString(payload.recipientUserId)) {
                    return { ok: false, error: "invalid_mini_room_invite_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            roomId: payload.roomId,
                            recipientUserId: payload.recipientUserId
                        }
                    }
                };
            }
            case "mini_room.invite_decision": {
                if (!isString(payload.inviteId) ||
                    (payload.status !== "accepted" && payload.status !== "declined")) {
                    return { ok: false, error: "invalid_mini_room_invite_decision_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            inviteId: payload.inviteId,
                            status: payload.status
                        }
                    }
                };
            }
            case "reaction.send": {
                if (!isString(payload.roomId) ||
                    !isAllowedValue(contracts_1.REACTION_TYPES, payload.reaction) ||
                    !isOptionalString(payload.targetUserId)) {
                    return { ok: false, error: "invalid_reaction_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            roomId: payload.roomId,
                            reaction: payload.reaction,
                            targetUserId: payload.targetUserId
                        }
                    }
                };
            }
            case "safety.block": {
                if (!isString(payload.blockedUserId)) {
                    return { ok: false, error: "invalid_safety_block_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            blockedUserId: payload.blockedUserId
                        }
                    }
                };
            }
            case "safety.report": {
                if (!isString(payload.reportedUserId) ||
                    !isAllowedValue(contracts_1.REPORT_REASONS, payload.reason) ||
                    !isOptionalString(payload.note)) {
                    return { ok: false, error: "invalid_safety_report_payload" };
                }
                return {
                    ok: true,
                    event: {
                        type,
                        payload: {
                            reportedUserId: payload.reportedUserId,
                            reason: payload.reason,
                            note: payload.note
                        }
                    }
                };
            }
            default:
                return { ok: false, error: "unsupported_event_type" };
        }
    }
    encodeServerEvent(event) {
        try {
            return JSON.stringify(event);
        }
        catch {
            return undefined;
        }
    }
}
exports.EventCodec = EventCodec;
