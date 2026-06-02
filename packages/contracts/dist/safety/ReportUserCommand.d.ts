import type { ReportReason } from "./ReportReason";
export interface ReportUserCommand {
    actorUserId: string;
    reportedUserId: string;
    reason: ReportReason;
    note?: string;
}
//# sourceMappingURL=ReportUserCommand.d.ts.map