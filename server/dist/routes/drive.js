"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.driveRouter = void 0;
const express_1 = require("express");
const driveConnector_1 = require("../services/driveConnector");
const driveSyncService_1 = require("../services/driveSyncService");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
exports.driveRouter = (0, express_1.Router)();
// GET /api/v1/drive/connect — initiate Drive OAuth (task 4.3)
exports.driveRouter.get('/connect', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const connector = new driveConnector_1.DriveConnector(user.clubId);
    const authUrl = connector.generateAuthUrl();
    res.redirect(authUrl);
});
// GET /api/v1/drive/callback — handle OAuth callback (task 4.4)
exports.driveRouter.get('/callback', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const { code, state: clubId, error } = req.query;
    if (error || !code || !clubId) {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup?error=drive_auth_failed`);
        return;
    }
    try {
        const connector = new driveConnector_1.DriveConnector(clubId);
        await connector.exchangeCodeForTokens(code);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup?step=2&success=drive_connected`);
    }
    catch {
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup?error=drive_token_exchange_failed`);
    }
});
// POST /api/v1/drive/disconnect (task 4.5)
exports.driveRouter.post('/disconnect', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    try {
        const connector = new driveConnector_1.DriveConnector(user.clubId);
        await connector.disconnect();
        res.json({ message: 'Google Drive disconnected successfully' });
    }
    catch {
        res.status(500).json({ error: { code: 'DISCONNECT_FAILED', message: 'Failed to disconnect Google Drive' } });
    }
});
// GET /api/v1/drive/status (task 4.6)
exports.driveRouter.get('/status', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    try {
        const club = await prisma_1.prisma.club.findUnique({
            where: { id: user.clubId },
            select: { driveConnected: true, lastSyncAt: true, driftUnresolvedCount: true, driveTokenExpiry: true },
        });
        if (!club) {
            res.status(404).json({ error: { code: 'CLUB_NOT_FOUND', message: 'Club not found' } });
            return;
        }
        res.json({
            driveConnected: club.driveConnected,
            lastSyncAt: club.lastSyncAt,
            driftUnresolvedCount: club.driftUnresolvedCount,
            tokenExpiry: club.driveTokenExpiry,
        });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get Drive status' } });
    }
});
// POST /api/v1/drive/webhook — receive Drive change notifications (15.3)
exports.driveRouter.post('/webhook', async (req, res) => {
    const channelId = req.headers['x-goog-channel-id'];
    if (!channelId) {
        res.status(400).send();
        return;
    }
    try {
        const club = await prisma_1.prisma.club.findFirst({ where: { webhookChannelId: channelId } });
        if (!club) {
            res.status(404).send();
            return;
        }
        const syncService = new driveSyncService_1.DriveSyncService(club.id);
        await syncService.processChanges();
        res.status(200).send();
    }
    catch {
        res.status(500).send();
    }
});
// GET /api/v1/drive/drift — unresolved drift items (15.6)
exports.driveRouter.get('/drift', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    try {
        const syncService = new driveSyncService_1.DriveSyncService(user.clubId);
        const items = await syncService.getDriftItems();
        res.json({ items });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get drift items' } });
    }
});
// PUT /api/v1/drive/drift/:id — resolve drift item (15.7)
exports.driveRouter.put('/drift/:id', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    const { id } = req.params;
    const { resolution } = req.body;
    if (!resolution || !['ACCEPTED', 'IGNORED'].includes(resolution)) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'resolution must be ACCEPTED or IGNORED' } });
        return;
    }
    try {
        const syncService = new driveSyncService_1.DriveSyncService(user.clubId);
        await syncService.resolveDrift(id, resolution);
        res.json({ message: 'Drift resolved' });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'RESOLVE_FAILED', message: err instanceof Error ? err.message : 'Failed to resolve drift' } });
    }
});
//# sourceMappingURL=drive.js.map