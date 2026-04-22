import WebSocket from "ws"
import {
  REACTION_TYPES,
  REPORT_REASONS,
  type ClientEvent,
  type ServerEvent
} from "@datevibe/contracts"

export type DecodedClientEvent =
  | { ok: true; event: ClientEvent }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value)
}

function isAllowedValue<const T extends string>(allowed: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
}

function rawDataToText(rawData: WebSocket.Data): string | undefined {
  if (typeof rawData === "string") {
    return rawData
  }
  if (rawData instanceof Buffer) {
    return rawData.toString("utf8")
  }
  if (rawData instanceof ArrayBuffer) {
    return Buffer.from(rawData).toString("utf8")
  }
  if (Array.isArray(rawData)) {
    return Buffer.concat(rawData).toString("utf8")
  }
  return undefined
}

export class EventCodec {
  public decodeClientEvent(rawData: WebSocket.Data): DecodedClientEvent {
    const text = rawDataToText(rawData)
    if (!text) {
      return { ok: false, error: "invalid_payload_encoding" }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, error: "invalid_json" }
    }

    if (!isRecord(parsed) || !isString(parsed.type) || !isRecord(parsed.payload)) {
      return { ok: false, error: "invalid_event_shape" }
    }

    const type = parsed.type
    const payload = parsed.payload

    switch (type) {
      case "room.join": {
        if (
          !isString(payload.roomId) ||
          !isString(payload.sessionToken) ||
          !isOptionalString(payload.initialSpotId)
        ) {
          return { ok: false, error: "invalid_room_join_payload" }
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
        }
      }
      case "room.leave": {
        if (!isString(payload.roomId)) {
          return { ok: false, error: "invalid_room_leave_payload" }
        }
        return { ok: true, event: { type, payload: { roomId: payload.roomId } } }
      }
      case "presence.move_to_spot": {
        if (!isString(payload.roomId) || !isString(payload.spotId)) {
          return { ok: false, error: "invalid_move_to_spot_payload" }
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
        }
      }
      case "mini_room.invite": {
        if (!isString(payload.roomId) || !isString(payload.recipientUserId)) {
          return { ok: false, error: "invalid_mini_room_invite_payload" }
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
        }
      }
      case "mini_room.invite_decision": {
        if (
          !isString(payload.inviteId) ||
          (payload.status !== "accepted" && payload.status !== "declined")
        ) {
          return { ok: false, error: "invalid_mini_room_invite_decision_payload" }
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
        }
      }
      case "reaction.send": {
        if (
          !isString(payload.roomId) ||
          !isAllowedValue(REACTION_TYPES, payload.reaction) ||
          !isOptionalString(payload.targetUserId)
        ) {
          return { ok: false, error: "invalid_reaction_payload" }
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
        }
      }
      case "safety.block": {
        if (!isString(payload.blockedUserId)) {
          return { ok: false, error: "invalid_safety_block_payload" }
        }
        return {
          ok: true,
          event: {
            type,
            payload: {
              blockedUserId: payload.blockedUserId
            }
          }
        }
      }
      case "safety.report": {
        if (
          !isString(payload.reportedUserId) ||
          !isAllowedValue(REPORT_REASONS, payload.reason) ||
          !isOptionalString(payload.note)
        ) {
          return { ok: false, error: "invalid_safety_report_payload" }
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
        }
      }
      default:
        return { ok: false, error: "unsupported_event_type" }
    }
  }

  public encodeServerEvent(event: ServerEvent): string | undefined {
    try {
      return JSON.stringify(event)
    } catch {
      return undefined
    }
  }
}
