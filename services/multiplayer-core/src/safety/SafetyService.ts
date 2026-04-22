import type { BlockUserCommand, ReportUserCommand } from "@datevibe/contracts";
import { REPORT_REASONS } from "@datevibe/contracts";
import {
  applyBlock,
  canReportUser,
  isInteractionBlocked,
} from "@datevibe/domain";
import type { BlockRecord } from "@datevibe/domain";

interface StoredReport extends ReportUserCommand {
  receivedAt: string;
}

export class SafetyService {
  private blocks: BlockRecord[] = [];
  private reports: StoredReport[] = [];

  public block(actorUserId: string, blockedUserId: string): boolean {
    const command: BlockUserCommand = { actorUserId, blockedUserId };
    const next = applyBlock(this.blocks, command);
    const changed = next.length !== this.blocks.length;
    this.blocks = next;
    return changed;
  }

  public isBlocked(userIdA: string, userIdB: string): boolean {
    return isInteractionBlocked(this.blocks, userIdA, userIdB);
  }

  public getBlockedInteractionUserIds(actorUserId: string): string[] {
    const ids = new Set<string>();
    for (const record of this.blocks) {
      if (record.actorUserId === actorUserId) {
        ids.add(record.blockedUserId);
      }
      if (record.blockedUserId === actorUserId) {
        ids.add(record.actorUserId);
      }
    }
    return Array.from(ids);
  }

  public report(command: ReportUserCommand): boolean {
    if (!canReportUser(command, REPORT_REASONS)) {
      return false;
    }
    this.reports.push({
      ...command,
      receivedAt: new Date().toISOString()
    });
    return true;
  }

  public getReports(): readonly StoredReport[] {
    return [...this.reports];
  }

  public getBlocks(): readonly BlockRecord[] {
    return [...this.blocks];
  }
}
