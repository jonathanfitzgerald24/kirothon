import { Response } from 'express';
export declare class NotificationService {
    create(params: {
        clubId: string;
        userId: string;
        type: string;
        title: string;
        body?: string;
        resourceId?: string;
    }): Promise<{
        id: string;
        clubId: string;
        createdAt: Date;
        type: string;
        body: string | null;
        resourceId: string | null;
        userId: string;
        title: string;
        isRead: boolean;
        isDismissed: boolean;
    }>;
    getForUser(userId: string): Promise<{
        id: string;
        clubId: string;
        createdAt: Date;
        type: string;
        body: string | null;
        resourceId: string | null;
        userId: string;
        title: string;
        isRead: boolean;
        isDismissed: boolean;
    }[]>;
    markRead(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    dismiss(id: string, userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    addConnection(userId: string, res: Response): void;
    pushToUser(userId: string, data: unknown): void;
}
export declare const activitySSE: {
    addConnection(res: Response): void;
    broadcast(data: unknown): void;
};
export declare const notificationService: NotificationService;
//# sourceMappingURL=notificationService.d.ts.map