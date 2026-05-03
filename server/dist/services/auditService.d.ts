import { Prisma } from '@prisma/client';
export interface AuditLogParams {
    clubId: string;
    userId?: string | null;
    action: string;
    resourceType?: string | null;
    resourceId?: string | null;
    details?: Record<string, unknown> | null;
}
export declare class AuditService {
    logAction(params: AuditLogParams): Promise<void>;
    getLogs(clubId: string, filters?: {
        action?: string;
        userId?: string;
        from?: string;
        to?: string;
        page?: number;
        pageSize?: number;
    }): Promise<{
        data: ({
            user: {
                displayName: string;
            } | null;
        } & {
            id: string;
            clubId: string;
            createdAt: Date;
            action: string;
            resourceType: string | null;
            resourceId: string | null;
            details: Prisma.JsonValue | null;
            userId: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    cleanupOldLogs(): Promise<number>;
}
export declare const auditService: AuditService;
//# sourceMappingURL=auditService.d.ts.map