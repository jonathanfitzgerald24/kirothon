export declare class DemoService {
    createDemoClub(): Promise<{
        club: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            clubType: string | null;
            driveConnected: boolean;
            driveAccessToken: string | null;
            driveRefreshToken: string | null;
            driveTokenExpiry: Date | null;
            webhookChannelId: string | null;
            webhookResourceId: string | null;
            webhookExpiry: Date | null;
            drivePageToken: string | null;
            setupStep: number;
            demoMode: boolean;
            lastSyncAt: Date | null;
            driftUnresolvedCount: number;
        };
        user: {
            email: string;
            id: string;
            googleId: string | null;
            passwordHash: string | null;
            displayName: string;
            role: import(".prisma/client").$Enums.Role;
            clubId: string;
            darkMode: boolean;
            firstLoginComplete: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    cleanupExpiredDemos(): Promise<number>;
}
export declare const demoService: DemoService;
//# sourceMappingURL=demoService.d.ts.map