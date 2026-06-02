import type { BlockUserCommand, ReportReason, ReportUserCommand } from "@datevibe/contracts";
export interface BlockRecord {
    actorUserId: string;
    blockedUserId: string;
}
export declare function applyBlock(blocks: readonly BlockRecord[], command: BlockUserCommand): BlockRecord[];
export declare function isInteractionBlocked(blocks: readonly BlockRecord[], actorUserId: string, otherUserId: string): boolean;
export declare function canReportUser(command: ReportUserCommand, allowedReasons: readonly ReportReason[]): boolean;
//# sourceMappingURL=safetyRules.d.ts.map