"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const auditService_1 = require("../services/auditService");
const client_1 = require("@prisma/client");
exports.auditLogsRouter = (0, express_1.Router)();
// GET /api/v1/audit-logs — Admin only, filterable, paginated
exports.auditLogsRouter.get('/', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const user = req.user;
        const { action, userId, from, to, page } = req.query;
        const result = await auditService_1.auditService.getLogs(user.clubId, {
            action,
            userId,
            from,
            to,
            page: page ? parseInt(page, 10) : undefined,
        });
        res.json(result);
    }
    catch (err) {
        console.error('Audit log fetch error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch audit logs' } });
    }
});
//# sourceMappingURL=auditLogs.js.map