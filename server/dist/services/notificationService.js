"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.activitySSE = exports.NotificationService = void 0;
const prisma_1 = require("../lib/prisma");
// SSE connection pool: userId -> Response[]
const sseConnections = new Map();
class NotificationService {
    async create(params) {
        const notification = await prisma_1.prisma.notification.create({
            data: {
                clubId: params.clubId,
                userId: params.userId,
                type: params.type,
                title: params.title,
                body: params.body ?? null,
                resourceId: params.resourceId ?? null,
            },
        });
        // Push to SSE if user is connected
        this.pushToUser(params.userId, notification);
        return notification;
    }
    async getForUser(userId) {
        return prisma_1.prisma.notification.findMany({
            where: { userId, isDismissed: false },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async markRead(id, userId) {
        return prisma_1.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    async dismiss(id, userId) {
        return prisma_1.prisma.notification.updateMany({
            where: { id, userId },
            data: { isDismissed: true },
        });
    }
    // SSE management
    addConnection(userId, res) {
        const connections = sseConnections.get(userId) ?? [];
        connections.push(res);
        sseConnections.set(userId, connections);
        res.on('close', () => {
            const remaining = (sseConnections.get(userId) ?? []).filter((r) => r !== res);
            if (remaining.length === 0) {
                sseConnections.delete(userId);
            }
            else {
                sseConnections.set(userId, remaining);
            }
        });
    }
    pushToUser(userId, data) {
        const connections = sseConnections.get(userId) ?? [];
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        connections.forEach((res) => {
            try {
                res.write(payload);
            }
            catch {
                // connection may be closed
            }
        });
    }
}
exports.NotificationService = NotificationService;
// Activity feed SSE
const activityConnections = [];
exports.activitySSE = {
    addConnection(res) {
        activityConnections.push(res);
        res.on('close', () => {
            const idx = activityConnections.indexOf(res);
            if (idx >= 0)
                activityConnections.splice(idx, 1);
        });
    },
    broadcast(data) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        activityConnections.forEach((res) => {
            try {
                res.write(payload);
            }
            catch {
                // connection may be closed
            }
        });
    },
};
exports.notificationService = new NotificationService();
//# sourceMappingURL=notificationService.js.map