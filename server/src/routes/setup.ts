import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const setupRouter = Router()

const STEPS = [
  { step: 0, label: 'Connect Drive' },
  { step: 1, label: 'Analyze Structure' },
  { step: 2, label: 'Approve Architecture' },
  { step: 3, label: 'Invite Team' },
]

// GET /api/v1/setup/status
setupRouter.get('/status', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const club = await prisma.club.findUnique({ where: { id: req.user!.clubId } })
    if (!club) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Club not found' } })
      return
    }

    const steps = STEPS.map((s) => ({
      ...s,
      completed: club.setupStep > s.step,
      unlocked: club.setupStep >= s.step,
    }))

    res.json({ currentStep: club.setupStep, steps })
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to get setup status' } })
  }
})

// PUT /api/v1/setup/club-type
setupRouter.put('/club-type', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { clubType } = req.body as { clubType: string }
    await prisma.club.update({
      where: { id: req.user!.clubId },
      data: { clubType },
    })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to set club type' } })
  }
})
