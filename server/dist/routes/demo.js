"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demoRouter = void 0;
const express_1 = require("express");
const demoService_1 = require("../services/demoService");
exports.demoRouter = (0, express_1.Router)();
// POST /api/v1/demo/start — no auth required
exports.demoRouter.post('/start', async (req, res) => {
    try {
        const { club, user } = await demoService_1.demoService.createDemoClub();
        // Log the user in by setting session
        if (req.login) {
            req.login(user, (err) => {
                if (err) {
                    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create demo session' } });
                    return;
                }
                res.json({ clubId: club.id, userId: user.id, demoMode: true });
            });
        }
        else {
            res.json({ clubId: club.id, userId: user.id, demoMode: true });
        }
    }
    catch (err) {
        console.error('Demo start error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to start demo' } });
    }
});
// GET /api/v1/demo/status
exports.demoRouter.get('/status', (req, res) => {
    const user = req.user;
    res.json({ demoMode: user?.club?.demoMode ?? false });
});
//# sourceMappingURL=demo.js.map