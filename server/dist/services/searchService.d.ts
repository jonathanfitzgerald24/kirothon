import { Role } from '@prisma/client';
export declare class SearchService {
    search(clubId: string, userRole: Role, userId: string, params: {
        q: string;
        type?: string;
        folder?: string;
        dateFrom?: string;
        dateTo?: string;
        uploader?: string;
        tag?: string;
    }): Promise<{
        files: ({
            category: {
                id: string;
                name: string;
                minimumRole: import(".prisma/client").$Enums.Role;
            } | null;
            uploader: {
                id: string;
                displayName: string;
            } | null;
            tags: {
                id: string;
                name: string;
            }[];
        } & {
            id: string;
            clubId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            categoryId: string | null;
            driveFileId: string;
            mimeType: string;
            sizeBytes: bigint;
            uploaderId: string | null;
            placementStatus: import(".prisma/client").$Enums.PlacementStatus;
            confidenceScore: number | null;
            routingExplanation: string | null;
            aiSummary: string | null;
            uploadNote: string | null;
            isUnmanaged: boolean;
            driveLastModified: Date | null;
            uploadedAt: Date;
        })[];
        total: number;
    }>;
    semanticSearch(clubId: string, userRole: Role, userId: string, query: string): Promise<{
        files: ({
            category: {
                id: string;
                name: string;
                minimumRole: import(".prisma/client").$Enums.Role;
            } | null;
            tags: {
                name: string;
            }[];
        } & {
            id: string;
            clubId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            categoryId: string | null;
            driveFileId: string;
            mimeType: string;
            sizeBytes: bigint;
            uploaderId: string | null;
            placementStatus: import(".prisma/client").$Enums.PlacementStatus;
            confidenceScore: number | null;
            routingExplanation: string | null;
            aiSummary: string | null;
            uploadNote: string | null;
            isUnmanaged: boolean;
            driveLastModified: Date | null;
            uploadedAt: Date;
        })[];
        total: number;
    }>;
    getSimilarFiles(clubId: string, fileId: string, userRole: Role, userId: string): Promise<({
        category: {
            id: string;
            name: string;
            minimumRole: import(".prisma/client").$Enums.Role;
        } | null;
        tags: {
            id: string;
            name: string;
        }[];
    } & {
        id: string;
        clubId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        categoryId: string | null;
        driveFileId: string;
        mimeType: string;
        sizeBytes: bigint;
        uploaderId: string | null;
        placementStatus: import(".prisma/client").$Enums.PlacementStatus;
        confidenceScore: number | null;
        routingExplanation: string | null;
        aiSummary: string | null;
        uploadNote: string | null;
        isUnmanaged: boolean;
        driveLastModified: Date | null;
        uploadedAt: Date;
    })[]>;
}
export declare const searchService: SearchService;
//# sourceMappingURL=searchService.d.ts.map