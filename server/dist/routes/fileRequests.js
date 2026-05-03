"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRequestsRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
exports.fileRequestsRouter = (0, express_1.Router)();
// GET /api/v1/file-requests — Admin, Mod
exports.fileRequestsRouter.get('/', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    try {
        const requests = await prisma_1.prisma.fileRequest.findMany({
            where: { clubId: req.user.clubId, fulfilledAt: null },
            include: { requester: { select: { id: true, displayName: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(requests);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch file requests' } });
    }
});
// POST /api/v1/file-requests — Member only
exports.fileRequestsRouter.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) {
            res.status(400).json({ error: { code: 'VALIDATION', message: 'Description is required' } });
            return;
        }
        const request = await prisma_1.prisma.fileRequest.create({
            data: {
                clubId: req.user.clubId,
                requesterId: req.user.id,
                description,
            },
        });
        res.status(201).json(request);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create file request' } });
    }
});
// PUT /api/v1/file-requests/:id/fulfill — Admin, Mod
exports.fileRequestsRouter.put('/:id/fulfill', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    try {
        const { fileId } = req.body;
        const request = await prisma_1.prisma.fileRequest.update({
            where: { id: req.params.id },
            data: { fulfilledFileId: fileId, fulfilledAt: new Date() },
        });
        res.json(request);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fulfill request' } });
    }
});
//# sourceMappingURL=fileRequests.js.map