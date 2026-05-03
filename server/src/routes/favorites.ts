import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const favoritesRouter = Router()

// GET /api/v1/favorites
favoritesRouter.get('/', requireAuth, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: (req.user as any).id },
      include: {
        file: {
          include: { category: { select: { id: true, name: true, minimumRole: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter out files the user no longer has access to
    const userRole = (req.user as any).role as keyof typeof roleLevel
    const accessGrants = await prisma.accessGrant.findMany({
      where: { userId: (req.user as any).id },
      select: { categoryId: true },
    })
    const grantedIds = new Set(accessGrants.map((g) => g.categoryId))

    const roleLevel = { MEMBER: 1, MOD: 2, ADMIN: 3 } as const
    const userLevel = roleLevel[userRole]

    const accessible = favorites.filter((f) => {
      if (!f.file.category) return true
      const minLevel = roleLevel[f.file.category.minimumRole]
      return userLevel >= minLevel || grantedIds.has(f.file.category.id)
    })

    res.json(accessible.map((f) => f.file))
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch favorites' } })
  }
})

// POST /api/v1/favorites/:fileId
favoritesRouter.post('/:fileId', requireAuth, async (req, res) => {
  try {
    const favorite = await prisma.favorite.create({
      data: { userId: (req.user as any).id, fileId: req.params.fileId },
    })
    res.status(201).json(favorite)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to add favorite' } })
  }
})

// DELETE /api/v1/favorites/:fileId
favoritesRouter.delete('/:fileId', requireAuth, async (req, res) => {
  try {
    await prisma.favorite.deleteMany({
      where: { userId: (req.user as any).id, fileId: req.params.fileId },
    })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to remove favorite' } })
  }
})
