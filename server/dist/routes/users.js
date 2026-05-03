"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const userService_1 = require("../services/userService");
exports.usersRouter = (0, express_1.Router)();
// GET /api/v1/users — Admin only
exports.usersRouter.get('/', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const users = await userService_1.userService.listUsers(req.user.clubId);
        res.json(users);
    }
    catch (err) {
        console.error('List users error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to list users' } });
    }
});
// POST /api/v1/users/invite — Admin only
exports.usersRouter.post('/invite', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            res.status(400).json({ error: { code: 'VALIDATION', message: 'Email and role are required' } });
            return;
        }
        const result = await userService_1.userService.createInvitation(req.user.clubId, email, role, req.user.id);
        res.status(201).json(result);
    }
    catch (err) {
        console.error('Invite error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to send invitation' } });
    }
});
// PUT /api/v1/users/:userId/role — Admin only
exports.usersRouter.put('/:userId/role', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const { role } = req.body;
        const user = await userService_1.userService.changeRole(req.user.clubId, req.params.userId, role, req.user.id);
        res.json(user);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to change role';
        const status = message.includes('Cannot') ? 400 : 500;
        res.status(status).json({ error: { code: 'ROLE_CHANGE_FAILED', message } });
    }
});
// DELETE /api/v1/users/:userId — Admin only
exports.usersRouter.delete('/:userId', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        await userService_1.userService.removeUser(req.user.clubId, req.params.userId, req.user.id);
        res.status(204).send();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove user';
        const status = message.includes('Cannot') || message.includes('not found') ? 400 : 500;
        res.status(status).json({ error: { code: 'REMOVE_FAILED', message } });
    }
});
// PUT /api/v1/categories/:categoryId/minimum-role — Admin only
exports.usersRouter.put('/categories/:categoryId/minimum-role', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const { minimumRole } = req.body;
        const category = await userService_1.userService.setCategoryMinimumRole(req.user.clubId, req.params.categoryId, minimumRole);
        res.json(category);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update category role' } });
    }
});
// POST /api/v1/categories/:categoryId/access — Admin only
exports.usersRouter.post('/categories/:categoryId/access', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const { userId } = req.body;
        const grant = await userService_1.userService.grantAccess(req.params.categoryId, userId);
        res.status(201).json(grant);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to grant access' } });
    }
});
// DELETE /api/v1/categories/:categoryId/access/:userId — Admin only
exports.usersRouter.delete('/categories/:categoryId/access/:userId', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        await userService_1.userService.revokeAccess(req.params.categoryId, req.params.userId);
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to revoke access' } });
    }
});
// POST /api/v1/access-requests — Mod, Member
exports.usersRouter.post('/access-requests', auth_1.requireAuth, async (req, res) => {
    try {
        const { categoryId } = req.body;
        const request = await userService_1.userService.submitAccessRequest(req.user.id, categoryId);
        res.status(201).json(request);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to submit access request' } });
    }
});
// PUT /api/v1/access-requests/:requestId — Admin only
exports.usersRouter.put('/access-requests/:requestId', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const { status } = req.body;
        const result = await userService_1.userService.resolveAccessRequest(req.params.requestId, status, req.user.id);
        res.json(result);
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to resolve access request' } });
    }
});
//# sourceMappingURL=users.js.map