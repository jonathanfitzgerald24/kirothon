"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
exports.favoritesRouter = (0, express_1.Router)();
// GET /api/v1/favorites
exports.favoritesRouter.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const favorites = await prisma_1.prisma.favorite.findMany({
            where: { userId: req.user.id },
            include: {
                file: {
                    include: { category: { select: { id: true, name: true, minimumRole: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Filter out files the user no longer has access to
        const userRole = req.user.role;
        const accessGrants = await prisma_1.prisma.accessGrant.findMany({
            where: { userId: req.user.id },
            select: { categoryId: true },
        });
        const grantedIds = new Set(accessGrants.map((g) => g.categoryId));
        const roleLevel = { MEMBER: 1, MOD: 2, ADMIN: 3 };
        const userLevel = roleLevel[userRole];
        const accessible = favorites.filter((f) => {
            if (!f.file.category)
                return true;
            const minLevel = roleLevel[f.file.category.minimumRole];
            return userLevel >= minLevel || grantedIds.has(f.file.category.id);
        });
        res.json(accessible.map((f) => f.file));
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch favorites' } });
    }
});
// POST /api/v1/favorites/:fileId
exports.favoritesRouter.post('/:fileId', auth_1.requireAuth, async (req, res) => {
    try {
        const favorite = await prisma_1.prisma.favorite.create({
            data: { userId: req.user.id, fileId: req.params.fileId },
        });
        res.status(201).json(favorite);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to add favorite' } });
    }
});
// DELETE /api/v1/favorites/:fileId
exports.favoritesRouter.delete('/:fileId', auth_1.requireAuth, async (req, res) => {
    try {
        await prisma_1.prisma.favorite.deleteMany({
            where: { userId: req.user.id, fileId: req.params.fileId },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to remove favorite' } });
    }
});
//# sourceMappingURL=favorites.js.map