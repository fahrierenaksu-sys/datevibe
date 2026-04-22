"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpotProximityService = void 0;
const domain_1 = require("@datevibe/domain");
class SpotProximityService {
    safetyService;
    constructor(safetyService) {
        this.safetyService = safetyService;
    }
    listNearbyUsers(layout, users, currentUserId) {
        const blockedInteractionUserIds = this.safetyService.getBlockedInteractionUserIds(currentUserId);
        return (0, domain_1.getNearbyUsers)(layout, users, currentUserId, blockedInteractionUserIds);
    }
}
exports.SpotProximityService = SpotProximityService;
