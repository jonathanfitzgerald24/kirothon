"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAccessibleCategories = loadAccessibleCategories;
exports.checkCategoryAccess = checkCategoryAccess;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const roleLevel = {
    [client_1.Role.MEMBER]: 1,
    [client_1.Role.MOD]: 2,
    [client_1.Role.ADMIN]: 3,
};
async function loadAccessibleCategories(req, _res, next) {
    if (!req.user) {
        next();
        return;
    }
    const user = req.user;
    const [categories, grants] = await Promise.all([
        prisma_1.prisma.category.findMany({ where: { clubId: user.clubId }, select: { id: true, minimumRole: true } }),
        prisma_1.prisma.accessGrant.findMany({ where: { userId: user.id }, select: { categoryId: true } }),
    ]);
    const grantedIds = new Set(grants.map((g) => g.categoryId));
    req.accessibleCategoryIds = new Set(categories
        .filter((c) => roleLevel[user.role] >= roleLevel[c.minimumRole] || grantedIds.has(c.id))
        .map((c) => c.id));
    next();
}
function checkCategoryAccess(categoryId, req, res) {
    if (!req.accessibleCategoryIds)
        return false;
    if (!req.accessibleCategoryIds.has(categoryId)) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this category' } });
        return false;
    }
    return true;
}
//# sourceMappingURL=filterByAccess.js.map