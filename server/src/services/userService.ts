import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import { randomUUID } from 'crypto'
import { auditService } from './auditService'

export class UserService {
  async listUsers(clubId: string) {
    return prisma.user.findMany({
      where: { clubId },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createInvitation(clubId: string, email: string, role: Role, inviterId: string) {
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours

    const invitation = await prisma.invitation.create({
      data: { clubId, email, role, token, expiresAt },
    })

    await auditService.logAction({
      clubId,
      userId: inviterId,
      action: 'INVITE',
      resourceType: 'Invitation',
      resourceId: invitation.id,
      details: { email, role },
    })

    return { token, expiresAt }
  }

  async validateInvitation(token: string) {
    const invitation = await prisma.invitation.findUnique({ where: { token } })

    if (!invitation) return { valid: false, error: 'Invitation not found' } as const
    if (invitation.usedAt) return { valid: false, error: 'Invitation already used' } as const
    if (invitation.expiresAt < new Date()) return { valid: false, error: 'Invitation expired' } as const

    const club = await prisma.club.findUnique({
      where: { id: invitation.clubId },
      select: { name: true },
    })

    return {
      valid: true,
      invitation,
      clubName: club?.name ?? 'Unknown Club',
    } as const
  }

  async acceptInvitation(token: string, userId: string) {
    await prisma.invitation.update({
      where: { token },
      data: { usedAt: new Date() },
    })
  }

  async changeRole(clubId: string, targetUserId: string, newRole: Role, actorId: string) {
    if (targetUserId === actorId) {
      throw new Error('Cannot change your own role')
    }

    await this.ensureLastAdminSafe(clubId, targetUserId, newRole)

    const user = await prisma.user.update({
      where: { id: targetUserId, clubId },
      data: { role: newRole },
    })

    await auditService.logAction({
      clubId,
      userId: actorId,
      action: 'ROLE_CHANGE',
      resourceType: 'User',
      resourceId: targetUserId,
      details: { newRole },
    })

    return user
  }

  async removeUser(clubId: string, targetUserId: string, actorId: string) {
    if (targetUserId === actorId) {
      throw new Error('Cannot remove yourself')
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId, clubId } })
    if (!target) throw new Error('User not found')

    if (target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({
        where: { clubId, role: Role.ADMIN },
      })
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin')
      }
    }

    // Delete sessions
    await prisma.session.deleteMany({ where: { userId: targetUserId } })

    // Remove access grants, favorites, etc.
    await prisma.accessGrant.deleteMany({ where: { userId: targetUserId } })
    await prisma.favorite.deleteMany({ where: { userId: targetUserId } })

    await prisma.user.delete({ where: { id: targetUserId } })

    await auditService.logAction({
      clubId,
      userId: actorId,
      action: 'USER_REMOVED',
      resourceType: 'User',
      resourceId: targetUserId,
    })
  }

  async setCategoryMinimumRole(clubId: string, categoryId: string, minimumRole: Role) {
    return prisma.category.update({
      where: { id: categoryId, clubId },
      data: { minimumRole },
    })
  }

  async grantAccess(categoryId: string, userId: string) {
    return prisma.accessGrant.upsert({
      where: { userId_categoryId: { userId, categoryId } },
      create: { userId, categoryId },
      update: {},
    })
  }

  async revokeAccess(categoryId: string, userId: string) {
    return prisma.accessGrant.deleteMany({
      where: { userId, categoryId },
    })
  }

  async submitAccessRequest(userId: string, categoryId: string) {
    return prisma.accessRequest.create({
      data: { userId, categoryId },
    })
  }

  async resolveAccessRequest(requestId: string, status: 'APPROVED' | 'DENIED', resolvedBy: string) {
    const request = await prisma.accessRequest.update({
      where: { id: requestId },
      data: { status, resolvedBy, resolvedAt: new Date() },
    })

    if (status === 'APPROVED') {
      await this.grantAccess(request.categoryId, request.userId)
    }

    return request
  }

  private async ensureLastAdminSafe(clubId: string, targetUserId: string, newRole: Role) {
    if (newRole === Role.ADMIN) return // promoting to admin is always safe

    const target = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!target || target.role !== Role.ADMIN) return // not currently admin, safe

    const adminCount = await prisma.user.count({
      where: { clubId, role: Role.ADMIN },
    })

    if (adminCount <= 1) {
      throw new Error('Cannot demote the last admin')
    }
  }
}

export const userService = new UserService()
