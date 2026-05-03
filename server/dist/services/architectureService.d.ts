import { FolderNode } from './aiArchitect';
export interface DraftUpdate {
    tree: FolderNode[];
}
export interface MigrationJob {
    id: string;
    clubId: string;
    status: 'pending' | 'running' | 'complete' | 'failed';
    mode: 'move' | 'copy';
    totalFiles: number;
    processedFiles: number;
    unsortedFiles: number;
    errors: string[];
    completedAt?: Date;
}
export declare class ArchitectureService {
    private clubId;
    private connector;
    constructor(clubId: string);
    selectProposal(proposalId: string, tree: FolderNode[]): Promise<void>;
    updateDraft(tree: FolderNode[]): FolderNode[];
    getDraft(): FolderNode[] | null;
    activateDraft(confirmed?: boolean): Promise<{
        success: boolean;
        warning?: string;
        affectedFiles?: number;
    }>;
    getCurrentArchitecture(): Promise<FolderNode[] | null>;
    getVersionHistory(): Promise<object[]>;
    rollback(versionId: string): Promise<void>;
    startMigration(mode: 'move' | 'copy'): string;
    getMigrationJob(jobId: string): MigrationJob | undefined;
    private runMigration;
    private flattenTree;
    private applyTreeToDrive;
    private syncCategoriesToTree;
}
//# sourceMappingURL=architectureService.d.ts.map