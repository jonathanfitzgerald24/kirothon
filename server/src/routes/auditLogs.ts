import { Router } from 'express'
import { requireRole } from '../middleware/auth'
import { auditService } from '../services/auditService'
import { Role } from '@prisma/client'

export const auditLogsRouter = Router()

// GET /api/v1/audit-logs — Admin only, filterable, paginated
auditLogsRouter.get('/', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const user = req.user!
    const { action, userId, from, to, page } = req.query as Record<string, string | undefined>

    const result = await auditService.getLogs(user.clubId, {
      action,
      userId,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
    })

    res.json(result)
  } catch (err) {
    console.error('Audit log fetch error:', err)
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch audit logs' } })
  }
})
