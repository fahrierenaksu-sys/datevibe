"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionRoutes = createSessionRoutes;
const express_1 = require("express");
const zod_1 = require("zod");
const bootstrapRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().min(1).max(40),
    avatarPresetId: zod_1.z.string().trim().min(1).max(64).optional(),
    avatar: zod_1.z
        .object({
        presetId: zod_1.z.string().trim().min(1).max(64)
    })
        .optional()
});
function createSessionRoutes(sessionService) {
    const router = (0, express_1.Router)();
    router.post("/v1/session/bootstrap", (req, res) => {
        const parsed = bootstrapRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            const details = parsed.error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`);
            res.status(400).json({
                error: "invalid_request",
                details
            });
            return;
        }
        const actor = sessionService.createSession({
            displayName: parsed.data.displayName,
            avatarPresetId: parsed.data.avatarPresetId,
            avatar: parsed.data.avatar
        });
        res.status(200).json(actor);
    });
    return router;
}
