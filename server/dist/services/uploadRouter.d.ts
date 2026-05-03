export interface RoutingScore {
    categoryId: string;
    categoryName: string;
    score: number;
    explanation: string;
}
export type RoutingDecision = {
    type: 'auto_placed';
    categoryId: string;
    explanation: string;
} | {
    type: 'needs_selection';
    options: RoutingScore[];
} | {
    type: 'no_match';
    suggestedCategory?: {
        name: string;
        parentId?: string;
        rationale: string;
    };
};
export interface RoutingResult {
    fileId: string;
    fileName: string;
    decision: RoutingDecision;
    duplicateWarning?: {
        existingFileId: string;
        existingFileName: string;
    };
    renameSuggestion?: string;
}
export declare class UploadRouter {
    private clubId;
    private connector;
    constructor(clubId: string);
    checkDuplicate(fileName: string, sizeBytes: bigint, categoryId?: string): Promise<{
        existingFileId: string;
        existingFileName: string;
    } | null>;
    suggestRename(fileName: string): Promise<string | null>;
    scoreCategories(fileName: string, mimeType: string, sizeBytes: bigint): Promise<RoutingScore[]>;
    makeRoutingDecision(scores: RoutingScore[]): RoutingDecision;
    suggestNewCategory(fileName: string, mimeType: string): Promise<{
        name: string;
        parentId?: string;
        rationale: string;
    } | null>;
    placeFile(fileBuffer: Buffer, fileName: string, mimeType: string, categoryId: string, uploaderId: string, uploadNote?: string, explanation?: string, confidenceScore?: number): Promise<string>;
    routeFile(fileBuffer: Buffer, fileName: string, mimeType: string, uploaderId: string, uploadNote?: string): Promise<RoutingResult>;
}
//# sourceMappingURL=uploadRouter.d.ts.map