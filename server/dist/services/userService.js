"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const auditService_1 = require("./auditService");
class UserService {
    async listUsers(clubId) {
        return prisma_1.prisma.user.findMany({
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
        });
    }
    async createInvitation(clubId, email, role, inviterId) {
        const token = (0, crypto_1.randomUUID)();
        const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
        const invitation = await prisma_1.prisma.invitation.create({
            data: { clubId, email, role, token, expiresAt },
        });
        await auditService_1.auditService.logAction({
            clubId,
            userId: inviterId,
            action: 'INVITE',
            resourceType: 'Invitation',
            resourceId: invitation.id,
            details: { email, role },
        });
        return { token, expiresAt };
    }
    async validateInvitation(token) {
        const invitation = await prisma_1.prisma.invitation.findUnique({ where: { token } });
        if (!invitation)
            return { valid: false, error: 'Invitation not found' };
        if (invitation.usedAt)
            return { valid: false, error: 'Invitation already used' };
        if (invitation.expiresAt < new Date())
            return { valid: false, error: 'Invitation expired' };
        const club = await prisma_1.prisma.club.findUnique({
            where: { id: invitation.clubId },
            select: { name: true },
        });
        return {
            valid: true,
            invitation,
            clubName: club?.name ?? 'Unknown Club',
        };
    }
    async acceptInvitation(token, userId) {
        await prisma_1.prisma.invitation.update({
            where: { token },
            data: { usedAt: new Date() },
        });
    }
    async changeRole(clubId, targetUserId, newRole, actorId) {
        if (targetUserId === actorId) {
            throw new Error('Cannot change your own role');
        }
        await this.ensureLastAdminSafe(clubId, targetUserId, newRole);
        const user = await prisma_1.prisma.user.update({
            where: { id: targetUserId, clubId },
            data: { role: newRole },
        });
        await auditService_1.auditService.logAction({
            clubId,
            userId: actorId,
            action: 'ROLE_CHANGE',
            resourceType: 'User',
            resourceId: targetUserId,
            details: { newRole },
        });
        return user;
    }
    async removeUser(clubId, targetUserId, actorId) {
        if (targetUserId === actorId) {
            throw new Error('Cannot remove yourself');
        }
        const target = await prisma_1.prisma.user.findUnique({ where: { id: targetUserId, clubId } });
        if (!target)
            throw new Error('User not found');
        if (target.role === client_1.Role.ADMIN) {
            const adminCount = await prisma_1.prisma.user.count({
                where: { clubId, role: client_1.Role.ADMIN },
            });
            if (adminCount <= 1) {
                throw new Error('Cannot remove the last admin');
            }
        }
        // Delete sessions
        await prisma_1.prisma.session.deleteMany({ where: { userId: targetUserId } });
        // Remove access grants, favorites, etc.
        await prisma_1.prisma.accessGrant.deleteMany({ where: { userId: targetUserId } });
        await prisma_1.prisma.favorite.deleteMany({ where: { userId: targetUserId } });
        await prisma_1.prisma.user.delete({ where: { id: targetUserId } });
        await auditService_1.auditService.logAction({
            clubId,
            userId: actorId,
            action: 'USER_REMOVED',
            resourceType: 'User',
            resourceId: targetUserId,
        });
    }
    async setCategoryMinimumRole(clubId, categoryId, minimumRole) {
        return prisma_1.prisma.category.update({
            where: { id: categoryId, clubId },
            data: { minimumRole },
        });
    }
    async grantAccess(categoryId, userId) {
        return prisma_1.prisma.accessGrant.upsert({
            where: { userId_categoryId: { userId, categoryId } },
            create: { userId, categoryId },
            update: {},
        });
    }
    async revokeAccess(categoryId, userId) {
        return prisma_1.prisma.accessGrant.deleteMany({
            where: { userId, categoryId },
        });
    }
    async submitAccessRequest(userId, categoryId) {
        return prisma_1.prisma.accessRequest.create({
            data: { userId, categoryId },
        });
    }
    async resolveAccessRequest(requestId, status, resolvedBy) {
        const request = await prisma_1.prisma.accessRequest.update({
            where: { id: requestId },
            data: { status, resolvedBy, resolvedAt: new Date() },
        });
        if (status === 'APPROVED') {
            await this.grantAccess(request.categoryId, request.userId);
        }
        return request;
    }
    async ensureLastAdminSafe(clubId, targetUserId, newRole) {
        if (newRole === client_1.Role.ADMIN)
            return; // promoting to admin is always safe
        const target = await prisma_1.prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target || target.role !== client_1.Role.ADMIN)
            return; // not currently admin, safe
        const adminCount = await prisma_1.prisma.user.count({
            where: { clubId, role: client_1.Role.ADMIN },
        });
        if (adminCount <= 1) {
            throw new Error('Cannot demote the last admin');
        }
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=userService.js.map