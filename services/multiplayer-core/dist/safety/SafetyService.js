"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyService = void 0;
const contracts_1 = require("@datevibe/contracts");
const domain_1 = require("@datevibe/domain");
class SafetyService {
    blocks = [];
    reports = [];
    block(actorUserId, blockedUserId) {
        const command = { actorUserId, blockedUserId };
        const next = (0, domain_1.applyBlock)(this.blocks, command);
        const changed = next.length !== this.blocks.length;
        this.blocks = next;
        return changed;
    }
    isBlocked(userIdA, userIdB) {
        return (0, domain_1.isInteractionBlocked)(this.blocks, userIdA, userIdB);
    }
    getBlockedInteractionUserIds(actorUserId) {
        const ids = new Set();
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
    report(command) {
        if (!(0, domain_1.canReportUser)(command, contracts_1.REPORT_REASONS)) {
            return false;
        }
        this.reports.push({
            ...command,
            receivedAt: new Date().toISOString()
        });
        return true;
    }
    getReports() {
        return [...this.reports];
    }
    getBlocks() {
        return [...this.blocks];
    }
}
exports.SafetyService = SafetyService;
