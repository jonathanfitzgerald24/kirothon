export type ProposalType = 'PRESERVE' | 'REORGANIZE' | 'FRESH';
export interface FolderNode {
    name: string;
    description?: string;
    children?: FolderNode[];
}
export interface ArchitectureProposal {
    id: string;
    type: ProposalType;
    rationale: string;
    tree: FolderNode[];
    folderDescriptions: Record<string, string>;
}
export declare class AIArchitect {
    private clubId;
    constructor(clubId: string);
    getProposals(): ArchitectureProposal[] | undefined;
    generateProposals(): Promise<ArchitectureProposal[]>;
    private buildStructureJSON;
    private assessDisorganization;
    private buildPrompt;
    private parseProposals;
    private generateFallbackProposals;
}
//# sourceMappingURL=aiArchitect.d.ts.map