"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
exports.setupRouter = (0, express_1.Router)();
const STEPS = [
    { step: 0, label: 'Connect Drive' },
    { step: 1, label: 'Analyze Structure' },
    { step: 2, label: 'Approve Architecture' },
    { step: 3, label: 'Invite Team' },
];
// GET /api/v1/setup/status
exports.setupRouter.get('/status', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const club = await prisma_1.prisma.club.findUnique({ where: { id: req.user.clubId } });
        if (!club) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Club not found' } });
            return;
        }
        const steps = STEPS.map((s) => ({
            ...s,
            completed: club.setupStep > s.step,
            unlocked: club.setupStep >= s.step,
        }));
        res.json({ currentStep: club.setupStep, steps });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to get setup status' } });
    }
});
// PUT /api/v1/setup/club-type
exports.setupRouter.put('/club-type', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const { clubType } = req.body;
        await prisma_1.prisma.club.update({
            where: { id: req.user.clubId },
            data: { clubType },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to set club type' } });
    }
});
//# sourceMappingURL=setup.js.map