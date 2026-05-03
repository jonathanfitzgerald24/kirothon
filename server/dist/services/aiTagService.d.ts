export declare class AITagService {
    generateTags(fileId: string): Promise<string[]>;
    addManualTag(fileId: string, name: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        fileId: string;
        autoGen: boolean;
    }>;
    removeTag(fileId: string, name: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
export declare const aiTagService: AITagService;
//# sourceMappingURL=aiTagService.d.ts.map