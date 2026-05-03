"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIArchitect = void 0;
const prisma_1 = require("../lib/prisma");
const geminiClient_1 = require("./geminiClient");
// In-memory proposal cache keyed by clubId
const proposalCache = new Map();
class AIArchitect {
    constructor(clubId) {
        this.clubId = clubId;
    }
    getProposals() {
        return proposalCache.get(this.clubId);
    }
    async generateProposals() {
        // Fetch current structure from Metadata Store
        const categories = await prisma_1.prisma.category.findMany({
            where: { clubId: this.clubId },
            include: { files: { select: { name: true, mimeType: true } }, children: true },
        });
        const club = await prisma_1.prisma.club.findUnique({
            where: { id: this.clubId },
            select: { clubType: true },
        });
        // Build structure JSON for Gemini
        const structureJSON = this.buildStructureJSON(categories);
        const isDisorganized = this.assessDisorganization(categories);
        const clubType = club?.clubType || 'not specified';
        const prompt = this.buildPrompt(structureJSON, clubType, isDisorganized);
        let rawResponse;
        try {
            rawResponse = await geminiClient_1.geminiClient.generateContent('gemini-1.5-pro', prompt);
        }
        catch (err) {
            // Fallback: generate proposals without AI if API unavailable
            return this.generateFallbackProposals(categories);
        }
        const proposals = this.parseProposals(rawResponse, categories, isDisorganized);
        proposalCache.set(this.clubId, proposals);
        return proposals;
    }
    buildStructureJSON(categories) {
        const rootCategories = categories.filter((c) => !c.parentId);
        const buildNode = (cat) => {
            const children = categories.filter((c) => c.parentId === cat.id);
            return {
                name: cat.name,
                fileCount: cat.files.length,
                fileTypes: [...new Set(cat.files.map((f) => f.mimeType.split('/')[1]))],
                children: children.map(buildNode),
            };
        };
        return rootCategories.map(buildNode);
    }
    assessDisorganization(categories) {
        const rootCount = categories.filter((c) => !c.parentId).length;
        const totalFiles = categories.reduce((sum, c) => sum + c.files.length, 0);
        // Disorganized if: too many root folders, or very few folders with many files
        return rootCount > 10 || (rootCount <= 2 && totalFiles > 20);
    }
    buildPrompt(structureJSON, clubType, isDisorganized) {
        const proposalCount = isDisorganized ? 3 : 2;
        return `You are an expert file organization assistant for college clubs.
You will receive a JSON representation of a Google Drive folder structure including folder names, file types, and file counts.

Generate exactly ${proposalCount} architecture proposals:
1. PRESERVE: Keep the existing structure unchanged.
2. REORGANIZE: Clean up the existing structure into a consistent hierarchy.
${isDisorganized ? '3. FRESH: Create a new structure using common patterns for a ' + clubType + ' organization.' : ''}

For each proposal, return a JSON array with this exact structure:
[
  {
    "type": "PRESERVE" | "REORGANIZE" | "FRESH",
    "rationale": "2-3 sentence explanation",
    "tree": [{ "name": "FolderName", "description": "one sentence", "children": [...] }],
    "folderDescriptions": { "FolderName": "description" }
  }
]

Return ONLY valid JSON, no markdown, no explanation outside the JSON.

Club type context: ${clubType}

Input structure:
${JSON.stringify(structureJSON, null, 2)}`;
    }
    parseProposals(rawResponse, categories, isDisorganized) {
        try {
            // Strip markdown code blocks if present
            const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return parsed.map((p, i) => ({
                id: `proposal-${this.clubId}-${i}`,
                type: p.type,
                rationale: p.rationale,
                tree: p.tree || [],
                folderDescriptions: p.folderDescriptions || {},
            }));
        }
        catch {
            return this.generateFallbackProposals(categories);
        }
    }
    generateFallbackProposals(categories) {
        const rootCategories = categories.filter((c) => !c.parentId);
        const preserveTree = rootCategories.map((c) => ({
            name: c.name,
            description: `Existing ${c.name} folder`,
            children: [],
        }));
        const proposals = [
            {
                id: `proposal-${this.clubId}-0`,
                type: 'PRESERVE',
                rationale: 'Keep the existing folder structure unchanged. This preserves all current organization and requires no migration.',
                tree: preserveTree,
                folderDescriptions: Object.fromEntries(rootCategories.map((c) => [c.name, `Existing ${c.name} folder`])),
            },
            {
                id: `proposal-${this.clubId}-1`,
                type: 'REORGANIZE',
                rationale: 'Reorganize into a clean, consistent hierarchy with clear top-level categories for common club needs.',
                tree: [
                    { name: 'Administration', description: 'Administrative documents and records', children: [] },
                    { name: 'Events', description: 'Event planning and documentation', children: [] },
                    { name: 'Finance', description: 'Financial records and budgets', children: [] },
                    { name: 'Members', description: 'Member resources and information', children: [] },
                    { name: 'Marketing', description: 'Marketing and promotional materials', children: [] },
                ],
                folderDescriptions: {
                    Administration: 'Administrative documents and records',
                    Events: 'Event planning and documentation',
                    Finance: 'Financial records and budgets',
                    Members: 'Member resources and information',
                    Marketing: 'Marketing and promotional materials',
                },
            },
        ];
        return proposals;
    }
}
exports.AIArchitect = AIArchitect;
//# sourceMappingURL=aiArchitect.js.map