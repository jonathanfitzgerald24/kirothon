"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickAccessRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
exports.quickAccessRouter = (0, express_1.Router)();
// GET /api/v1/quick-access
exports.quickAccessRouter.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const items = await prisma_1.prisma.quickAccessFile.findMany({
            where: { clubId: req.user.clubId },
            include: {
                file: {
                    include: { category: { select: { id: true, name: true } } },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });
        res.json(items.map((i) => i.file));
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch quick access' } });
    }
});
// POST /api/v1/quick-access/:fileId — Admin only, max 10
exports.quickAccessRouter.post('/:fileId', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const count = await prisma_1.prisma.quickAccessFile.count({ where: { clubId: req.user.clubId } });
        if (count >= 10) {
            res.status(400).json({ error: { code: 'LIMIT_EXCEEDED', message: 'Quick Access is limited to 10 files' } });
            return;
        }
        const item = await prisma_1.prisma.quickAccessFile.create({
            data: {
                clubId: req.user.clubId,
                fileId: req.params.fileId,
                sortOrder: count,
            },
        });
        res.status(201).json(item);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to pin file' } });
    }
});
// DELETE /api/v1/quick-access/:fileId — Admin only
exports.quickAccessRouter.delete('/:fileId', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        await prisma_1.prisma.quickAccessFile.deleteMany({
            where: { clubId: req.user.clubId, fileId: req.params.fileId },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to unpin file' } });
    }
});
//# sourceMappingURL=quickAccess.js.map