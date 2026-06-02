export const REPORT_REASONS = ["spam", "harassment", "fake_profile", "other"] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
