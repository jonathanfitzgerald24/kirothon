import { prisma } from '../lib/prisma'
import { Prisma } from '@prisma/client'

export interface AuditLogParams {
  clubId: string
  userId?: string | null
  action: string
  resourceType?: string | null
  resourceId?: string | null
  details?: Record<string, unknown> | null
}

export class AuditService {
  async logAction(params: AuditLogParams): Promise<void> {
    await prisma.auditLog.create({
      data: {
        clubId: params.clubId,
        userId: params.userId ?? null,
        action: params.action,
        resourceType: params.resourceType ?? null,
        resourceId: params.resourceId ?? null,
        details: (params.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
  }

  async getLogs(
    clubId: string,
    filters?: {
      action?: string
      userId?: string
      from?: string
      to?: string
      page?: number
      pageSize?: number
    }
  ) {
    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const where: Record<string, unknown> = { clubId }

    if (filters?.action) {
      where.action = filters.action
    }
    if (filters?.userId) {
      where.userId = filters.userId
    }
    if (filters?.from || filters?.to) {
      const createdAt: Record<string, Date> = {}
      if (filters.from) createdAt.gte = new Date(filters.from)
      if (filters.to) createdAt.lte = new Date(filters.to)
      where.createdAt = createdAt
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ])

    return { data, total, page, pageSize }
  }

  async cleanupOldLogs(): Promise<number> {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: twelveMonthsAgo },
      },
    })

    return result.count
  }
}

export const auditService = new AuditService()
