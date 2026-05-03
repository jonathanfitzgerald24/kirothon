"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
exports.authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z
            .string()
            .min(8)
            .regex(/[A-Z]/, 'Must contain uppercase')
            .regex(/[0-9]/, 'Must contain number'),
        clubName: zod_1.z.string().min(2).max(100),
    }),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(1),
    }),
});
// POST /api/v1/auth/register
exports.authRouter.post('/register', (0, validate_1.validate)(registerSchema), async (req, res) => {
    try {
        const { email, password, clubName } = req.body;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' } });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 12);
        const club = await prisma_1.prisma.club.create({ data: { name: clubName } });
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                displayName: email.split('@')[0],
                role: client_1.Role.ADMIN,
                clubId: club.id,
            },
            include: { club: true },
        });
        req.login(user, (err) => {
            if (err) {
                res.status(500).json({ error: { code: 'SESSION_ERROR', message: 'Failed to create session' } });
                return;
            }
            res.status(201).json({
                user: {
                    id: user.id,
                    email: user.email,
                    displayName: user.displayName,
                    role: user.role,
                    club: { id: club.id, name: club.name },
                },
            });
        });
    }
    catch (_err) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
    }
});
// POST /api/v1/auth/login
exports.authRouter.post('/login', (0, validate_1.validate)(loginSchema), (req, res, next) => {
    passport_1.default.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: info?.message || 'Invalid credentials' } });
            return;
        }
        req.login(user, async (loginErr) => {
            if (loginErr)
                return next(loginErr);
            const u = user;
            await prisma_1.prisma.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } });
            res.json({ user: { id: u.id, email: u.email, displayName: u.displayName, role: u.role, club: u.club } });
        });
    })(req, res, next);
});
// GET /api/v1/auth/google
exports.authRouter.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'] }));
// GET /api/v1/auth/google/callback
exports.authRouter.get('/google/callback', passport_1.default.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth`,
}), async (req, res) => {
    const u = req.user;
    await prisma_1.prisma.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
});
// POST /api/v1/auth/logout
exports.authRouter.post('/logout', auth_1.requireAuth, (req, res, next) => {
    req.logout((err) => {
        if (err)
            return next(err);
        req.session.destroy((destroyErr) => {
            if (destroyErr)
                return next(destroyErr);
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
});
// GET /api/v1/auth/me
exports.authRouter.get('/me', auth_1.requireAuth, (req, res) => {
    const u = req.user;
    res.json({
        user: {
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            role: u.role,
            darkMode: u.darkMode,
            firstLoginComplete: u.firstLoginComplete,
            club: u.club,
        },
    });
});
//# sourceMappingURL=auth.js.map