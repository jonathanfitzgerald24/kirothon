"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const client_1 = require("@prisma/client");
const roleLevel = {
    [client_1.Role.MEMBER]: 1,
    [client_1.Role.MOD]: 2,
    [client_1.Role.ADMIN]: 3,
};
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
        return;
    }
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (minimumRole) => {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
            res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
            return;
        }
        const user = req.user;
        if (roleLevel[user.role] < roleLevel[minimumRole]) {
            res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
//# sourceMappingURL=auth.js.map