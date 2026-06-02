"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyBlock = applyBlock;
exports.isInteractionBlocked = isInteractionBlocked;
exports.canReportUser = canReportUser;
function applyBlock(blocks, command) {
    if (command.actorUserId === command.blockedUserId) {
        return [...blocks];
    }
    const alreadyBlocked = blocks.some((block) => block.actorUserId === command.actorUserId &&
        block.blockedUserId === command.blockedUserId);
    if (alreadyBlocked) {
        return [...blocks];
    }
    return [
        ...blocks,
        {
            actorUserId: command.actorUserId,
            blockedUserId: command.blockedUserId,
        },
    ];
}
function isInteractionBlocked(blocks, actorUserId, otherUserId) {
    return blocks.some((block) => (block.actorUserId === actorUserId && block.blockedUserId === otherUserId) ||
        (block.actorUserId === otherUserId && block.blockedUserId === actorUserId));
}
function canReportUser(command, allowedReasons) {
    return (command.actorUserId !== command.reportedUserId &&
        allowedReasons.includes(command.reason));
}
