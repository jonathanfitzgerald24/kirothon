import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const quickAccessRouter = Router()

// GET /api/v1/quick-access
quickAccessRouter.get('/', requireAuth, async (req, res) => {
  try {
    const items = await prisma.quickAccessFile.findMany({
      where: { clubId: req.user!.clubId },
      include: {
        file: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })
    res.json(items.map((i) => i.file))
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch quick access' } })
  }
})

// POST /api/v1/quick-access/:fileId — Admin only, max 10
quickAccessRouter.post('/:fileId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const count = await prisma.quickAccessFile.count({ where: { clubId: req.user!.clubId } })
    if (count >= 10) {
      res.status(400).json({ error: { code: 'LIMIT_EXCEEDED', message: 'Quick Access is limited to 10 files' } })
      return
    }

    const item = await prisma.quickAccessFile.create({
      data: {
        clubId: req.user!.clubId,
        fileId: req.params.fileId,
        sortOrder: count,
      },
    })
    res.status(201).json(item)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to pin file' } })
  }
})

// DELETE /api/v1/quick-access/:fileId — Admin only
quickAccessRouter.delete('/:fileId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    await prisma.quickAccessFile.deleteMany({
      where: { clubId: req.user!.clubId, fileId: req.params.fileId },
    })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to unpin file' } })
  }
})
