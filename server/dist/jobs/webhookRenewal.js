"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renewWebhooks = renewWebhooks;
const prisma_1 = require("../lib/prisma");
const driveSyncService_1 = require("../services/driveSyncService");
/**
 * Webhook Renewal Job
 * Runs hourly. Re-registers webhooks for clubs where expiry is within 1 hour.
 * Google Drive webhooks have a max lifetime of 24 hours; we renew on a 23-hour cycle.
 */
async function renewWebhooks() {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const clubsNeedingRenewal = await prisma_1.prisma.club.findMany({
        where: {
            driveConnected: true,
            demoMode: false,
            webhookExpiry: { lt: oneHourFromNow },
        },
    });
    let renewed = 0;
    let failed = 0;
    for (const club of clubsNeedingRenewal) {
        try {
            const syncService = new driveSyncService_1.DriveSyncService(club.id);
            await syncService.registerWebhook();
            renewed++;
        }
        catch (err) {
            console.error(`Webhook renewal failed for club ${club.id}:`, err);
            failed++;
        }
    }
    return { renewed, failed };
}
//# sourceMappingURL=webhookRenewal.js.map