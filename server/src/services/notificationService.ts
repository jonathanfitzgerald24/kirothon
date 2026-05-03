import { Response } from 'express'
import { prisma } from '../lib/prisma'

// SSE connection pool: userId -> Response[]
const sseConnections = new Map<string, Response[]>()

export class NotificationService {
  async create(params: {
    clubId: string
    userId: string
    type: string
    title: string
    body?: string
    resourceId?: string
  }) {
    const notification = await prisma.notification.create({
      data: {
        clubId: params.clubId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        resourceId: params.resourceId ?? null,
      },
    })

    // Push to SSE if user is connected
    this.pushToUser(params.userId, notification)

    return notification
  }

  async getForUser(userId: string) {
    return prisma.notification.findMany({
      where: { userId, isDismissed: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })
  }

  async dismiss(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isDismissed: true },
    })
  }

  // SSE management
  addConnection(userId: string, res: Response) {
    const connections = sseConnections.get(userId) ?? []
    connections.push(res)
    sseConnections.set(userId, connections)

    res.on('close', () => {
      const remaining = (sseConnections.get(userId) ?? []).filter((r) => r !== res)
      if (remaining.length === 0) {
        sseConnections.delete(userId)
      } else {
        sseConnections.set(userId, remaining)
      }
    })
  }

  pushToUser(userId: string, data: unknown) {
    const connections = sseConnections.get(userId) ?? []
    const payload = `data: ${JSON.stringify(data)}\n\n`
    connections.forEach((res) => {
      try {
        res.write(payload)
      } catch {
        // connection may be closed
      }
    })
  }
}

// Activity feed SSE
const activityConnections: Response[] = []

export const activitySSE = {
  addConnection(res: Response) {
    activityConnections.push(res)
    res.on('close', () => {
      const idx = activityConnections.indexOf(res)
      if (idx >= 0) activityConnections.splice(idx, 1)
    })
  },

  broadcast(data: unknown) {
    const payload = `data: ${JSON.stringify(data)}\n\n`
    activityConnections.forEach((res) => {
      try {
        res.write(payload)
      } catch {
        // connection may be closed
      }
    })
  },
}

export const notificationService = new NotificationService()
