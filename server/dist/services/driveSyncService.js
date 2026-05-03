"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriveSyncService = void 0;
const prisma_1 = require("../lib/prisma");
const driveConnector_1 = require("./driveConnector");
const client_1 = require("@prisma/client");
class DriveSyncService {
    constructor(clubId) {
        this.clubId = clubId;
        this.connector = new driveConnector_1.DriveConnector(clubId);
    }
    // 15.2 — Register webhook
    async registerWebhook() {
        const drive = await this.connector.getDriveClient();
        const club = await prisma_1.prisma.club.findUnique({ where: { id: this.clubId } });
        // Get initial page token if not set
        let pageToken = club?.drivePageToken;
        if (!pageToken) {
            const startPageToken = await drive.changes.getStartPageToken({});
            pageToken = startPageToken.data.startPageToken || undefined;
        }
        const channelId = crypto.randomUUID();
        const expiry = new Date(Date.now() + 23 * 60 * 60 * 1000); // 23 hours
        const response = await drive.changes.watch({
            pageToken: pageToken,
            requestBody: {
                id: channelId,
                type: 'web_hook',
                address: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/drive/webhook`,
                expiration: String(expiry.getTime()),
            },
        });
        await prisma_1.prisma.club.update({
            where: { id: this.clubId },
            data: {
                webhookChannelId: channelId,
                webhookResourceId: response.data.resourceId || null,
                webhookExpiry: expiry,
                drivePageToken: pageToken,
            },
        });
        return { channelId, expiry };
    }
    // 15.4 — Process changes
    async processChanges() {
        const club = await prisma_1.prisma.club.findUnique({ where: { id: this.clubId } });
        if (!club?.drivePageToken)
            throw new Error('No page token — register webhook first');
        const drive = await this.connector.getDriveClient();
        let pageToken = club.drivePageToken;
        let processed = 0;
        let drifts = 0;
        let hasMore = true;
        while (hasMore) {
            const response = await drive.changes.list({
                pageToken,
                fields: 'nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, parents, size, modifiedTime, trashed))',
            });
            const changes = response.data.changes || [];
            for (const change of changes) {
                const file = change.file;
                const fileId = change.fileId;
                if (!fileId)
                    continue;
                if (change.removed || file?.trashed) {
                    // File deleted
                    const existing = await prisma_1.prisma.fileMeta.findFirst({ where: { driveFileId: fileId, clubId: this.clubId } });
                    if (existing) {
                        await prisma_1.prisma.tag.deleteMany({ where: { fileId: existing.id } });
                        await prisma_1.prisma.fileMeta.delete({ where: { id: existing.id } });
                    }
                    // Check if it's a folder
                    const existingCategory = await prisma_1.prisma.category.findFirst({ where: { driveFolderId: fileId, clubId: this.clubId } });
                    if (existingCategory) {
                        await prisma_1.prisma.structuralDrift.create({
                            data: {
                                clubId: this.clubId,
                                changeType: 'FOLDER_DELETED',
                                drivePath: existingCategory.name,
                                driveId: fileId,
                            },
                        });
                        drifts++;
                        await prisma_1.prisma.club.update({
                            where: { id: this.clubId },
                            data: { driftUnresolvedCount: { increment: 1 } },
                        });
                    }
                }
                else if (file) {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    if (isFolder) {
                        // Folder created or modified
                        const existing = await prisma_1.prisma.category.findFirst({ where: { driveFolderId: fileId, clubId: this.clubId } });
                        if (!existing) {
                            await prisma_1.prisma.structuralDrift.create({
                                data: {
                                    clubId: this.clubId,
                                    changeType: 'FOLDER_CREATED',
                                    drivePath: file.name || 'Unknown',
                                    driveId: fileId,
                                },
                            });
                            drifts++;
                            await prisma_1.prisma.club.update({
                                where: { id: this.clubId },
                                data: { driftUnresolvedCount: { increment: 1 } },
                            });
                        }
                    }
                    else {
                        // File added or modified
                        const existing = await prisma_1.prisma.fileMeta.findFirst({ where: { driveFileId: fileId, clubId: this.clubId } });
                        if (existing) {
                            // File moved or renamed
                            await prisma_1.prisma.fileMeta.update({
                                where: { id: existing.id },
                                data: {
                                    name: file.name || existing.name,
                                    driveLastModified: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
                                },
                            });
                        }
                        else {
                            // New unmanaged file
                            await prisma_1.prisma.fileMeta.create({
                                data: {
                                    clubId: this.clubId,
                                    driveFileId: fileId,
                                    name: file.name || 'Unknown',
                                    mimeType: file.mimeType || 'application/octet-stream',
                                    sizeBytes: file.size ? BigInt(file.size) : BigInt(0),
                                    placementStatus: client_1.PlacementStatus.UNSORTED,
                                    isUnmanaged: true,
                                    driveLastModified: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
                                },
                            });
                        }
                    }
                }
                processed++;
            }
            if (response.data.newStartPageToken) {
                pageToken = response.data.newStartPageToken;
                hasMore = false;
            }
            else if (response.data.nextPageToken) {
                pageToken = response.data.nextPageToken;
            }
            else {
                hasMore = false;
            }
        }
        // Update page token and last sync time
        await prisma_1.prisma.club.update({
            where: { id: this.clubId },
            data: { drivePageToken: pageToken, lastSyncAt: new Date() },
        });
        return { processed, drifts };
    }
    // 15.6 — Get unresolved drift items
    async getDriftItems() {
        return prisma_1.prisma.structuralDrift.findMany({
            where: { clubId: this.clubId, resolved: false },
            orderBy: { createdAt: 'desc' },
        });
    }
    // 15.7 — Resolve drift item
    async resolveDrift(driftId, resolution) {
        const drift = await prisma_1.prisma.structuralDrift.findUnique({ where: { id: driftId } });
        if (!drift || drift.clubId !== this.clubId)
            throw new Error('Drift item not found');
        if (resolution === 'ACCEPTED' && drift.changeType === 'FOLDER_CREATED' && drift.driveId) {
            // Create category for the new folder
            await prisma_1.prisma.category.create({
                data: {
                    clubId: this.clubId,
                    name: drift.drivePath,
                    driveFolderId: drift.driveId,
                },
            });
        }
        await prisma_1.prisma.structuralDrift.update({
            where: { id: driftId },
            data: { resolved: true, resolution },
        });
        await prisma_1.prisma.club.update({
            where: { id: this.clubId },
            data: { driftUnresolvedCount: { decrement: 1 } },
        });
    }
}
exports.DriveSyncService = DriveSyncService;
//# sourceMappingURL=driveSyncService.js.map