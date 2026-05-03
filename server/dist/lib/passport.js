"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("./prisma");
const client_1 = require("@prisma/client");
passport_1.default.use(new passport_local_1.Strategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { email }, include: { club: true } });
        if (!user || !user.passwordHash) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return done(null, false, { message: 'Invalid email or password' });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/auth/google/callback`,
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        if (!email)
            return done(new Error('No email from Google'));
        // Check existing user by googleId
        let user = await prisma_1.prisma.user.findFirst({ where: { googleId: profile.id }, include: { club: true } });
        if (user)
            return done(null, user);
        // Check existing user by email
        user = await prisma_1.prisma.user.findUnique({ where: { email }, include: { club: true } });
        if (user) {
            user = await prisma_1.prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
                include: { club: true },
            });
            return done(null, user);
        }
        // Check pending invitation
        const invitation = await prisma_1.prisma.invitation.findFirst({
            where: { email, usedAt: null, expiresAt: { gt: new Date() } },
        });
        if (invitation) {
            const newUser = await prisma_1.prisma.user.create({
                data: {
                    email,
                    googleId: profile.id,
                    displayName: profile.displayName || email,
                    role: invitation.role,
                    clubId: invitation.clubId,
                },
                include: { club: true },
            });
            await prisma_1.prisma.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } });
            return done(null, newUser);
        }
        // New user — create new club
        const club = await prisma_1.prisma.club.create({ data: { name: `${profile.displayName || email}'s Club` } });
        const newUser = await prisma_1.prisma.user.create({
            data: {
                email,
                googleId: profile.id,
                displayName: profile.displayName || email,
                role: client_1.Role.ADMIN,
                clubId: club.id,
            },
            include: { club: true },
        });
        return done(null, newUser);
    }
    catch (err) {
        return done(err);
    }
}));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({ where: { id }, include: { club: true } });
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});
exports.default = passport_1.default;
//# sourceMappingURL=passport.js.map