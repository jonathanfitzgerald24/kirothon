export type JobStatus = 'pending' | 'running' | 'complete' | 'failed';
export interface AnalysisJob {
    id: string;
    clubId: string;
    status: JobStatus;
    progress: number;
    totalFiles: number;
    inaccessiblePaths: string[];
    error?: string;
    completedAt?: Date;
}
export interface DriveNode {
    id: string;
    name: string;
    mimeType: string;
    parents: string[];
    size?: string;
    modifiedTime?: string;
}
export declare class StructureAnalyzer {
    private clubId;
    private connector;
    constructor(clubId: string);
    createJob(): string;
    getJob(jobId: string): AnalysisJob | undefined;
    runAnalysis(jobId: string): Promise<void>;
    private fetchAllNodes;
    private buildTree;
    private persistToMetadataStore;
}
//# sourceMappingURL=structureAnalyzer.d.ts.map