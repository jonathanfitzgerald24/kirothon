export declare class DriveSyncService {
    private clubId;
    private connector;
    constructor(clubId: string);
    registerWebhook(): Promise<{
        channelId: string;
        expiry: Date;
    }>;
    processChanges(): Promise<{
        processed: number;
        drifts: number;
    }>;
    getDriftItems(): Promise<{
        id: string;
        clubId: string;
        createdAt: Date;
        changeType: string;
        drivePath: string;
        driveId: string | null;
        resolved: boolean;
        resolution: string | null;
    }[]>;
    resolveDrift(driftId: string, resolution: 'ACCEPTED' | 'IGNORED'): Promise<void>;
}
//# sourceMappingURL=driveSyncService.d.ts.map