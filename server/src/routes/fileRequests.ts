import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const fileRequestsRouter = Router()

// GET /api/v1/file-requests — Admin, Mod
fileRequestsRouter.get('/', requireRole(Role.MOD), async (req, res) => {
  try {
    const requests = await prisma.fileRequest.findMany({
      where: { clubId: (req.user as any).clubId, fulfilledAt: null },
      include: { requester: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch file requests' } })
  }
})

// POST /api/v1/file-requests — Member only
fileRequestsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { description } = req.body as { description: string }
    if (!description) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Description is required' } })
      return
    }

    const request = await prisma.fileRequest.create({
      data: {
        clubId: (req.user as any).clubId,
        requesterId: (req.user as any).id,
        description,
      },
    })
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create file request' } })
  }
})

// PUT /api/v1/file-requests/:id/fulfill — Admin, Mod
fileRequestsRouter.put('/:id/fulfill', requireRole(Role.MOD), async (req, res) => {
  try {
    const { fileId } = req.body as { fileId: string }
    const request = await prisma.fileRequest.update({
      where: { id: req.params.id },
      data: { fulfilledFileId: fileId, fulfilledAt: new Date() },
    })
    res.json(request)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fulfill request' } })
  }
})
