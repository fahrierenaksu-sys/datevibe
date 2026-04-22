import type {
  ConnectionDecisionRecord,
  ConnectionDecisionStatus,
  ConnectionMatch,
  MiniRoom,
} from "@datevibe/contracts";

export interface RecordConnectionDecisionInput {
  miniRoom: MiniRoom;
  actorUserId: string;
  partnerUserId: string;
  status: ConnectionDecisionStatus;
}

export interface RecordConnectionDecisionResult {
  decision: ConnectionDecisionRecord;
  match?: ConnectionMatch;
}

function decisionKey(miniRoomId: string, actorUserId: string): string {
  return `${miniRoomId}:${actorUserId}`;
}

export class ConnectionDecisionService {
  private readonly decisionsByKey = new Map<string, ConnectionDecisionRecord>();
  private readonly matchedMiniRoomIds = new Set<string>();

  public recordDecision(
    input: RecordConnectionDecisionInput
  ): RecordConnectionDecisionResult {
    const existingDecision = this.decisionsByKey.get(
      decisionKey(input.miniRoom.miniRoomId, input.actorUserId)
    );
    if (this.matchedMiniRoomIds.has(input.miniRoom.miniRoomId) && existingDecision) {
      return { decision: existingDecision };
    }

    const decision: ConnectionDecisionRecord = {
      miniRoomId: input.miniRoom.miniRoomId,
      actorUserId: input.actorUserId,
      partnerUserId: input.partnerUserId,
      status: input.status,
      decidedAt: new Date().toISOString(),
    };

    this.decisionsByKey.set(
      decisionKey(decision.miniRoomId, decision.actorUserId),
      decision
    );

    const match = this.createMatchIfMutual(input.miniRoom);
    return match ? { decision, match } : { decision };
  }

  private createMatchIfMutual(miniRoom: MiniRoom): ConnectionMatch | undefined {
    if (this.matchedMiniRoomIds.has(miniRoom.miniRoomId)) {
      return undefined;
    }

    const [firstUserId, secondUserId] = miniRoom.participantUserIds;
    const firstDecision = this.decisionsByKey.get(
      decisionKey(miniRoom.miniRoomId, firstUserId)
    );
    const secondDecision = this.decisionsByKey.get(
      decisionKey(miniRoom.miniRoomId, secondUserId)
    );

    if (firstDecision?.status !== "saved" || secondDecision?.status !== "saved") {
      return undefined;
    }

    this.matchedMiniRoomIds.add(miniRoom.miniRoomId);
    return {
      miniRoomId: miniRoom.miniRoomId,
      participantUserIds: miniRoom.participantUserIds,
      matchedAt: new Date().toISOString(),
    };
  }
}
