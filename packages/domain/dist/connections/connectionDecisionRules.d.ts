import type { MiniRoom } from "@datevibe/contracts";
export declare const CONNECTION_DECISION_DENIAL_REASONS: readonly ["actor_not_participant", "partner_not_participant", "partner_mismatch"];
export type ConnectionDecisionDenialReason = (typeof CONNECTION_DECISION_DENIAL_REASONS)[number];
export interface ConnectionDecisionEligibilityResult {
    allowed: boolean;
    reason?: ConnectionDecisionDenialReason;
}
export declare function canRecordConnectionDecision(params: {
    miniRoom: MiniRoom;
    actorUserId: string;
    partnerUserId: string;
}): ConnectionDecisionEligibilityResult;
//# sourceMappingURL=connectionDecisionRules.d.ts.map