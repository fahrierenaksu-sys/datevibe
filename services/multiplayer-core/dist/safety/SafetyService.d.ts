import type { ReportUserCommand } from "@datevibe/contracts";
import type { BlockRecord } from "@datevibe/domain";
interface StoredReport extends ReportUserCommand {
    receivedAt: string;
}
export declare class SafetyService {
    private blocks;
    private reports;
    block(actorUserId: string, blockedUserId: string): boolean;
    isBlocked(userIdA: string, userIdB: string): boolean;
    getBlockedInteractionUserIds(actorUserId: string): string[];
    report(command: ReportUserCommand): boolean;
    getReports(): readonly StoredReport[];
    getBlocks(): readonly BlockRecord[];
}
export {};
//# sourceMappingURL=SafetyService.d.ts.map