"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const prisma_1 = require("../lib/prisma");
class AuditService {
    async logAction(params) {
        await prisma_1.prisma.auditLog.create({
            data: {
                clubId: params.clubId,
                userId: params.userId ?? null,
                action: params.action,
                resourceType: params.resourceType ?? null,
                resourceId: params.resourceId ?? null,
                details: (params.details ?? undefined),
            },
        });
    }
    async getLogs(clubId, filters) {
        const page = filters?.page ?? 1;
        const pageSize = filters?.pageSize ?? 20;
        const skip = (page - 1) * pageSize;
        const where = { clubId };
        if (filters?.action) {
            where.action = filters.action;
        }
        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.from || filters?.to) {
            const createdAt = {};
            if (filters.from)
                createdAt.gte = new Date(filters.from);
            if (filters.to)
                createdAt.lte = new Date(filters.to);
            where.createdAt = createdAt;
        }
        const [data, total] = await Promise.all([
            prisma_1.prisma.auditLog.findMany({
                where,
                include: {
                    user: { select: { displayName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            prisma_1.prisma.auditLog.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async cleanupOldLogs() {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        const result = await prisma_1.prisma.auditLog.deleteMany({
            where: {
                createdAt: { lt: twelveMonthsAgo },
            },
        });
        return result.count;
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
//# sourceMappingURL=auditService.js.map