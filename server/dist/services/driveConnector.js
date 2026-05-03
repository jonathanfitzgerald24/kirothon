"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriveConnector = void 0;
const googleapis_1 = require("googleapis");
const prisma_1 = require("../lib/prisma");
const encryption_1 = require("../lib/encryption");
const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive'];
class DriveConnector {
    constructor(clubId) {
        this.clubId = clubId;
    }
    createOAuth2Client() {
        return new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/drive/callback`);
    }
    generateAuthUrl() {
        const oauth2Client = this.createOAuth2Client();
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: DRIVE_SCOPES,
            prompt: 'consent',
            state: this.clubId,
        });
    }
    async exchangeCodeForTokens(code) {
        const oauth2Client = this.createOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token)
            throw new Error('No access token received');
        await prisma_1.prisma.club.update({
            where: { id: this.clubId },
            data: {
                driveConnected: true,
                driveAccessToken: (0, encryption_1.encrypt)(tokens.access_token),
                driveRefreshToken: tokens.refresh_token ? (0, encryption_1.encrypt)(tokens.refresh_token) : undefined,
                driveTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
            },
        });
    }
    async getAuthenticatedClient() {
        const club = await prisma_1.prisma.club.findUnique({ where: { id: this.clubId } });
        if (!club || !club.driveAccessToken)
            throw new Error('Drive not connected for this club');
        const oauth2Client = this.createOAuth2Client();
        const accessToken = (0, encryption_1.decrypt)(club.driveAccessToken);
        const refreshToken = club.driveRefreshToken ? (0, encryption_1.decrypt)(club.driveRefreshToken) : undefined;
        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
            expiry_date: club.driveTokenExpiry?.getTime(),
        });
        // Auto-refresh if expired (task 4.7)
        if (club.driveTokenExpiry && club.driveTokenExpiry <= new Date()) {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await prisma_1.prisma.club.update({
                where: { id: this.clubId },
                data: {
                    driveAccessToken: (0, encryption_1.encrypt)(credentials.access_token),
                    driveTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
                },
            });
            oauth2Client.setCredentials(credentials);
        }
        return oauth2Client;
    }
    async getDriveClient() {
        const auth = await this.getAuthenticatedClient();
        return googleapis_1.google.drive({ version: 'v3', auth });
    }
    async disconnect() {
        const club = await prisma_1.prisma.club.findUnique({ where: { id: this.clubId } });
        if (!club || !club.driveAccessToken)
            return;
        try {
            const oauth2Client = this.createOAuth2Client();
            const accessToken = (0, encryption_1.decrypt)(club.driveAccessToken);
            await oauth2Client.revokeToken(accessToken);
        }
        catch {
            // Continue even if revocation fails
        }
        await prisma_1.prisma.club.update({
            where: { id: this.clubId },
            data: {
                driveConnected: false,
                driveAccessToken: null,
                driveRefreshToken: null,
                driveTokenExpiry: null,
                webhookChannelId: null,
                webhookResourceId: null,
                webhookExpiry: null,
                drivePageToken: null,
            },
        });
    }
}
exports.DriveConnector = DriveConnector;
//# sourceMappingURL=driveConnector.js.map