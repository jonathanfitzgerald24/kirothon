/**
 * Webhook Renewal Job
 * Runs hourly. Re-registers webhooks for clubs where expiry is within 1 hour.
 * Google Drive webhooks have a max lifetime of 24 hours; we renew on a 23-hour cycle.
 */
export declare function renewWebhooks(): Promise<{
    renewed: number;
    failed: number;
}>;
//# sourceMappingURL=webhookRenewal.d.ts.map