"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = exports.notificationsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationService_1 = require("../services/notificationService");
const prisma_1 = require("../lib/prisma");
exports.notificationsRouter = (0, express_1.Router)();
// GET /api/v1/notifications
exports.notificationsRouter.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const notifications = await notificationService_1.notificationService.getForUser(req.user.id);
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch notifications' } });
    }
});
// GET /api/v1/notifications/stream — SSE
exports.notificationsRouter.get('/stream', auth_1.requireAuth, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.write('data: {"connected":true}\n\n');
    notificationService_1.notificationService.addConnection(req.user.id, res);
});
// PUT /api/v1/notifications/:id/read
exports.notificationsRouter.put('/:id/read', auth_1.requireAuth, async (req, res) => {
    try {
        await notificationService_1.notificationService.markRead(req.params.id, req.user.id);
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to mark as read' } });
    }
});
// DELETE /api/v1/notifications/:id
exports.notificationsRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    try {
        await notificationService_1.notificationService.dismiss(req.params.id, req.user.id);
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to dismiss notification' } });
    }
});
// Activity feed routes
exports.activityRouter = (0, express_1.Router)();
// GET /api/v1/activity/feed
exports.activityRouter.get('/feed', auth_1.requireAuth, async (req, res) => {
    try {
        const entries = await prisma_1.prisma.auditLog.findMany({
            where: { clubId: req.user.clubId },
            include: { user: { select: { displayName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        res.json(entries.map((e) => ({
            id: e.id,
            action: e.action,
            user: e.user?.displayName ?? 'System',
            resource: e.resourceId ?? '',
            timestamp: e.createdAt.toISOString(),
        })));
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch activity feed' } });
    }
});
// GET /api/v1/activity/stream — SSE
exports.activityRouter.get('/stream', auth_1.requireAuth, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.write('data: {"connected":true}\n\n');
    notificationService_1.activitySSE.addConnection(res);
});
//# sourceMappingURL=notifications.js.map