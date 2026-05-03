import { prisma } from '../lib/prisma'
import { geminiClient } from './geminiClient'

export type ProposalType = 'PRESERVE' | 'REORGANIZE' | 'FRESH'

export interface FolderNode {
  name: string
  description?: string
  children?: FolderNode[]
}

export interface ArchitectureProposal {
  id: string
  type: ProposalType
  rationale: string
  tree: FolderNode[]
  folderDescriptions: Record<string, string>
}

// In-memory proposal cache keyed by clubId
const proposalCache = new Map<string, ArchitectureProposal[]>()

export class AIArchitect {
  private clubId: string

  constructor(clubId: string) {
    this.clubId = clubId
  }

  getProposals(): ArchitectureProposal[] | undefined {
    return proposalCache.get(this.clubId)
  }

  async generateProposals(): Promise<ArchitectureProposal[]> {
    // Fetch current structure from Metadata Store
    const categories = await prisma.category.findMany({
      where: { clubId: this.clubId },
      include: { files: { select: { name: true, mimeType: true } }, children: true },
    })

    const club = await prisma.club.findUnique({
      where: { id: this.clubId },
      select: { clubType: true },
    })

    // Build structure JSON for Gemini
    const structureJSON = this.buildStructureJSON(categories)
    const isDisorganized = this.assessDisorganization(categories)
    const clubType = club?.clubType || 'not specified'

    const prompt = this.buildPrompt(structureJSON, clubType, isDisorganized)

    let rawResponse: string
    try {
      rawResponse = await geminiClient.generateContent('gemini-1.5-pro', prompt)
    } catch (err) {
      // Fallback: generate proposals without AI if API unavailable
      return this.generateFallbackProposals(categories)
    }

    const proposals = this.parseProposals(rawResponse, categories, isDisorganized)
    proposalCache.set(this.clubId, proposals)
    return proposals
  }

  private buildStructureJSON(
    categories: Array<{
      id: string
      name: string
      parentId: string | null
      files: Array<{ name: string; mimeType: string }>
    }>
  ): object {
    const rootCategories = categories.filter((c) => !c.parentId)

    const buildNode = (cat: (typeof categories)[0]): object => {
      const children = categories.filter((c) => c.parentId === cat.id)
      return {
        name: cat.name,
        fileCount: cat.files.length,
        fileTypes: [...new Set(cat.files.map((f) => f.mimeType.split('/')[1]))],
        children: children.map(buildNode),
      }
    }

    return rootCategories.map(buildNode)
  }

  private assessDisorganization(
    categories: Array<{ name: string; parentId: string | null; files: Array<unknown> }>
  ): boolean {
    const rootCount = categories.filter((c) => !c.parentId).length
    const totalFiles = categories.reduce((sum, c) => sum + c.files.length, 0)
    // Disorganized if: too many root folders, or very few folders with many files
    return rootCount > 10 || (rootCount <= 2 && totalFiles > 20)
  }

  private buildPrompt(structureJSON: object, clubType: string, isDisorganized: boolean): string {
    const proposalCount = isDisorganized ? 3 : 2
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
${JSON.stringify(structureJSON, null, 2)}`
  }

  private parseProposals(
    rawResponse: string,
    categories: Array<{ name: string; parentId: string | null; files: Array<unknown> }>,
    isDisorganized: boolean
  ): ArchitectureProposal[] {
    try {
      // Strip markdown code blocks if present
      const cleaned = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned) as Array<{
        type: ProposalType
        rationale: string
        tree: FolderNode[]
        folderDescriptions: Record<string, string>
      }>

      return parsed.map((p, i) => ({
        id: `proposal-${this.clubId}-${i}`,
        type: p.type,
        rationale: p.rationale,
        tree: p.tree || [],
        folderDescriptions: p.folderDescriptions || {},
      }))
    } catch {
      return this.generateFallbackProposals(categories)
    }
  }

  private generateFallbackProposals(
    categories: Array<{ name: string; parentId: string | null; files: Array<unknown> }>
  ): ArchitectureProposal[] {
    const rootCategories = categories.filter((c) => !c.parentId)

    const preserveTree: FolderNode[] = rootCategories.map((c) => ({
      name: c.name,
      description: `Existing ${c.name} folder`,
      children: [],
    }))

    const proposals: ArchitectureProposal[] = [
      {
        id: `proposal-${this.clubId}-0`,
        type: 'PRESERVE',
        rationale:
          'Keep the existing folder structure unchanged. This preserves all current organization and requires no migration.',
        tree: preserveTree,
        folderDescriptions: Object.fromEntries(
          rootCategories.map((c) => [c.name, `Existing ${c.name} folder`])
        ),
      },
      {
        id: `proposal-${this.clubId}-1`,
        type: 'REORGANIZE',
        rationale:
          'Reorganize into a clean, consistent hierarchy with clear top-level categories for common club needs.',
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
    ]

    return proposals
  }
}
