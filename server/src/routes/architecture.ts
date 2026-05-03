import { Router, Request, Response } from 'express'
import { requireRole } from '../middleware/auth'
import { AIArchitect } from '../services/aiArchitect'
import { Role } from '@prisma/client'

export const architectureRouter = Router()

// POST /api/v1/architecture/propose — generate proposals
architectureRouter.post(
  '/propose',
  requireRole(Role.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as { clubId: string }
    try {
      const architect = new AIArchitect(user.clubId)
      const proposals = await architect.generateProposals()
      res.json({ proposals })
    } catch (err) {
      res
        .status(500)
        .json({ error: { code: 'PROPOSAL_FAILED', message: 'Failed to generate architecture proposals' } })
    }
  }
)

// GET /api/v1/architecture/proposals — get cached proposals
architectureRouter.get(
  '/proposals',
  requireRole(Role.ADMIN),
  (req: Request, res: Response): void => {
    const user = req.user as { clubId: string }
    const architect = new AIArchitect(user.clubId)
    const proposals = architect.getProposals()

    if (!proposals) {
      res.status(404).json({
        error: {
          code: 'NO_PROPOSALS',
          message: 'No proposals found. Run POST /architecture/propose first.',
        },
      })
      return
    }

    res.json({ proposals })
  }
)
