import type { NearbyUser } from "@datevibe/contracts";
export declare const INVITE_DENIAL_REASONS: readonly ["self", "not_nearby", "blocked", "sender_busy", "recipient_busy"];
export type InviteDenialReason = (typeof INVITE_DENIAL_REASONS)[number];
export interface InviteEligibilityResult {
    allowed: boolean;
    reason?: InviteDenialReason;
}
export declare function canInviteUser(params: {
    senderUserId: string;
    recipientUserId: string;
    nearbyUsers: NearbyUser[];
    senderInMiniRoom: boolean;
    recipientInMiniRoom: boolean;
}): InviteEligibilityResult;
//# sourceMappingURL=inviteRules.d.ts.map