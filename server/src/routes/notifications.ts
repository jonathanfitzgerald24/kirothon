import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { notificationService, activitySSE } from '../services/notificationService'
import { prisma } from '../lib/prisma'

export const notificationsRouter = Router()

// GET /api/v1/notifications
notificationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await notificationService.getForUser(req.user!.id)
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch notifications' } })
  }
})

// GET /api/v1/notifications/stream — SSE
notificationsRouter.get('/stream', requireAuth, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('data: {"connected":true}\n\n')
  notificationService.addConnection(req.user!.id, res)
})

// PUT /api/v1/notifications/:id/read
notificationsRouter.put('/:id/read', requireAuth, async (req, res) => {
  try {
    await notificationService.markRead(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to mark as read' } })
  }
})

// DELETE /api/v1/notifications/:id
notificationsRouter.delete('/:id', requireAuth, async (req, res) => {
  try {
    await notificationService.dismiss(req.params.id, req.user!.id)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to dismiss notification' } })
  }
})

// Activity feed routes
export const activityRouter = Router()

// GET /api/v1/activity/feed
activityRouter.get('/feed', requireAuth, async (req, res) => {
  try {
    const entries = await prisma.auditLog.findMany({
      where: { clubId: req.user!.clubId },
      include: { user: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    res.json(
      entries.map((e) => ({
        id: e.id,
        action: e.action,
        user: e.user?.displayName ?? 'System',
        resource: e.resourceId ?? '',
        timestamp: e.createdAt.toISOString(),
      }))
    )
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch activity feed' } })
  }
})

// GET /api/v1/activity/stream — SSE
activityRouter.get('/stream', requireAuth, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write('data: {"connected":true}\n\n')
  activitySSE.addConnection(res)
})
