import { Router } from "express"
import { z } from "zod"
import { SessionService } from "../session/SessionService"

const bootstrapRequestSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  avatarPresetId: z.string().trim().min(1).max(64).optional(),
  avatar: z
    .object({
      presetId: z.string().trim().min(1).max(64)
    })
    .optional()
})

export function createSessionRoutes(sessionService: SessionService): Router {
  const router = Router()

  router.post("/v1/session/bootstrap", (req, res) => {
    const parsed = bootstrapRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      const details = parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "body"}: ${issue.message}`
      )
      res.status(400).json({
        error: "invalid_request",
        details
      })
      return
    }

    const actor = sessionService.createSession({
      displayName: parsed.data.displayName,
      avatarPresetId: parsed.data.avatarPresetId,
      avatar: parsed.data.avatar
    })

    res.status(200).json(actor)
  })

  return router
}
