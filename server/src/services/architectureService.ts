import { prisma } from '../lib/prisma'
import { DriveConnector } from './driveConnector'
import { geminiClient } from './geminiClient'
import { FolderNode } from './aiArchitect'
import { drive_v3 } from 'googleapis'

export interface DraftUpdate {
  tree: FolderNode[]
}

export interface MigrationJob {
  id: string
  clubId: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  mode: 'move' | 'copy'
  totalFiles: number
  processedFiles: number
  unsortedFiles: number
  errors: string[]
  completedAt?: Date
}

// In-memory draft store keyed by clubId
const draftStore = new Map<string, { proposalId: string; tree: FolderNode[] }>()
// In-memory migration job store
const migrationJobs = new Map<string, MigrationJob>()

export class ArchitectureService {
  private clubId: string
  private connector: DriveConnector

  constructor(clubId: string) {
    this.clubId = clubId
    this.connector = new DriveConnector(clubId)
  }

  // 7.2 — Select proposal as draft
  async selectProposal(proposalId: string, tree: FolderNode[]): Promise<void> {
    // Get current max version
    const latest = await prisma.architectureVersion.findFirst({
      where: { clubId: this.clubId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    // Delete any existing draft
    await prisma.architectureVersion.deleteMany({
      where: { clubId: this.clubId, isDraft: true },
    })

    // Create new draft
    await prisma.architectureVersion.create({
      data: {
        clubId: this.clubId,
        version: nextVersion,
        treeSnapshot: tree as object,
        isActive: false,
        isDraft: true,
      },
    })

    draftStore.set(this.clubId, { proposalId, tree })
  }

  // 7.3 — Update draft tree
  updateDraft(tree: FolderNode[]): FolderNode[] {
    const existing = draftStore.get(this.clubId)
    if (!existing) throw new Error('No draft found for this club')
    draftStore.set(this.clubId, { ...existing, tree })
    return tree
  }

  // 7.4 — Get draft preview
  getDraft(): FolderNode[] | null {
    return draftStore.get(this.clubId)?.tree ?? null
  }

  // 7.5 — Activate draft
  async activateDraft(
    confirmed: boolean = false
  ): Promise<{ success: boolean; warning?: string; affectedFiles?: number }> {
    const draft = draftStore.get(this.clubId)
    if (!draft) throw new Error('No draft found for this club')

    // Check for categories with files that would be deleted
    const existingCategories = await prisma.category.findMany({
      where: { clubId: this.clubId },
      include: { _count: { select: { files: true } } },
    })

    const draftNames = new Set(this.flattenTree(draft.tree).map((n) => n.name))
    const deletedWithFiles = existingCategories.filter(
      (c) => !draftNames.has(c.name) && c._count.files > 0
    )

    if (deletedWithFiles.length > 0 && !confirmed) {
      const affectedFiles = deletedWithFiles.reduce((sum, c) => sum + c._count.files, 0)
      return {
        success: false,
        warning: `Activating this draft will delete ${deletedWithFiles.length} categories containing ${affectedFiles} files.`,
        affectedFiles,
      }
    }

    // Get current active version
    const currentActive = await prisma.architectureVersion.findFirst({
      where: { clubId: this.clubId, isActive: true },
    })

    // Get next version number
    const latest = await prisma.architectureVersion.findFirst({
      where: { clubId: this.clubId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    // Apply to Drive (create folders)
    try {
      const drive = await this.connector.getDriveClient()
      await this.applyTreeToDrive(drive, draft.tree, null)
    } catch {
      // Continue even if Drive is unavailable — update metadata store
    }

    // Deactivate current version
    if (currentActive) {
      await prisma.architectureVersion.update({
        where: { id: currentActive.id },
        data: { isActive: false },
      })
    }

    // Create new active version
    await prisma.architectureVersion.create({
      data: {
        clubId: this.clubId,
        version: nextVersion,
        treeSnapshot: draft.tree as object,
        isActive: true,
        isDraft: false,
        activatedAt: new Date(),
      },
    })

    // Delete draft version
    await prisma.architectureVersion.deleteMany({
      where: { clubId: this.clubId, isDraft: true },
    })

    // Update categories in metadata store
    await this.syncCategoriesToTree(draft.tree)

    // Clear draft
    draftStore.delete(this.clubId)

    // Log audit event
    await prisma.auditLog.create({
      data: {
        clubId: this.clubId,
        action: 'ARCHITECTURE_ACTIVATE',
        resourceType: 'ArchitectureVersion',
        resourceId: this.clubId,
        details: { version: nextVersion },
      },
    })

    return { success: true }
  }

  // 7.7 — Get current active architecture
  async getCurrentArchitecture(): Promise<FolderNode[] | null> {
    const active = await prisma.architectureVersion.findFirst({
      where: { clubId: this.clubId, isActive: true },
    })
    if (!active) return null
    return active.treeSnapshot as unknown as FolderNode[]
  }

  // 7.8 — Get version history
  async getVersionHistory(): Promise<object[]> {
    const versions = await prisma.architectureVersion.findMany({
      where: { clubId: this.clubId, isActive: false, isDraft: false },
      orderBy: { version: 'desc' },
      take: 10,
    })
    return versions
  }

  // 7.9 — Rollback to version
  async rollback(versionId: string): Promise<void> {
    const version = await prisma.architectureVersion.findUnique({ where: { id: versionId } })
    if (!version || version.clubId !== this.clubId) throw new Error('Version not found')

    const tree = version.treeSnapshot as unknown as FolderNode[]

    // Deactivate current
    await prisma.architectureVersion.updateMany({
      where: { clubId: this.clubId, isActive: true },
      data: { isActive: false },
    })

    // Get next version number
    const latest = await prisma.architectureVersion.findFirst({
      where: { clubId: this.clubId },
      orderBy: { version: 'desc' },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    // Create new active version from rollback
    await prisma.architectureVersion.create({
      data: {
        clubId: this.clubId,
        version: nextVersion,
        treeSnapshot: tree as object,
        isActive: true,
        isDraft: false,
        activatedAt: new Date(),
      },
    })

    // Sync categories
    await this.syncCategoriesToTree(tree)

    // Log audit event
    await prisma.auditLog.create({
      data: {
        clubId: this.clubId,
        action: 'ROLLBACK',
        resourceType: 'ArchitectureVersion',
        resourceId: versionId,
        details: { rolledBackTo: version.version, newVersion: nextVersion },
      },
    })
  }

  // 7.11 — Start migration job
  startMigration(mode: 'move' | 'copy'): string {
    const jobId = crypto.randomUUID()
    migrationJobs.set(jobId, {
      id: jobId,
      clubId: this.clubId,
      status: 'pending',
      mode,
      totalFiles: 0,
      processedFiles: 0,
      unsortedFiles: 0,
      errors: [],
    })

    // Run migration async
    this.runMigration(jobId, mode).catch((err) => {
      const job = migrationJobs.get(jobId)
      if (job) {
        job.status = 'failed'
        job.errors.push(err instanceof Error ? err.message : 'Unknown error')
      }
    })

    return jobId
  }

  getMigrationJob(jobId: string): MigrationJob | undefined {
    return migrationJobs.get(jobId)
  }

  private async runMigration(jobId: string, mode: 'move' | 'copy'): Promise<void> {
    const job = migrationJobs.get(jobId)
    if (!job) return

    job.status = 'running'

    const files = await prisma.fileMeta.findMany({
      where: { clubId: this.clubId },
      include: { category: true },
    })

    const categories = await prisma.category.findMany({ where: { clubId: this.clubId } })
    job.totalFiles = files.length

    let drive: drive_v3.Drive | null = null
    try {
      drive = await this.connector.getDriveClient()
    } catch {
      // Continue without Drive if unavailable
    }

    for (const file of files) {
      try {
        // Use Gemini Flash to determine best category
        const prompt = `Given this file: name="${file.name}", type="${file.mimeType}", current folder="${file.category?.name || 'none'}"
Available categories: ${categories.map((c) => c.name).join(', ')}
Return JSON: {"categoryName": "best match", "confidence": 0-100}
Return ONLY JSON.`

        let targetCategory = categories.find((c) => c.name === 'Unsorted') || categories[0]
        let confidence = 0

        try {
          const response = await geminiClient.generateContent('gemini-1.5-flash', prompt)
          const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
          const parsed = JSON.parse(cleaned) as { categoryName: string; confidence: number }
          confidence = parsed.confidence
          if (confidence >= 50) {
            const matched = categories.find((c) => c.name === parsed.categoryName)
            if (matched) targetCategory = matched
          }
        } catch {
          // Use unsorted on AI failure
        }

        if (confidence < 50) {
          job.unsortedFiles++
        }

        // Move/copy in Drive if available
        if (drive && file.driveFileId && targetCategory?.driveFolderId) {
          try {
            if (mode === 'move') {
              await drive.files.update({
                fileId: file.driveFileId,
                addParents: targetCategory.driveFolderId,
                removeParents: file.category?.driveFolderId || undefined,
                fields: 'id',
              })
            } else {
              await drive.files.copy({
                fileId: file.driveFileId,
                requestBody: { parents: [targetCategory.driveFolderId] },
                fields: 'id',
              })
            }
          } catch {
            // Continue on Drive error
          }
        }

        // Update metadata store
        if (targetCategory) {
          await prisma.fileMeta.update({
            where: { id: file.id },
            data: { categoryId: targetCategory.id },
          })
        }

        job.processedFiles++
      } catch (err) {
        job.errors.push(`File ${file.name}: ${err instanceof Error ? err.message : 'error'}`)
      }
    }

    job.status = 'complete'
    job.completedAt = new Date()
  }

  private flattenTree(tree: FolderNode[]): FolderNode[] {
    const result: FolderNode[] = []
    const traverse = (nodes: FolderNode[]) => {
      for (const node of nodes) {
        result.push(node)
        if (node.children) traverse(node.children)
      }
    }
    traverse(tree)
    return result
  }

  private async applyTreeToDrive(
    drive: drive_v3.Drive,
    tree: FolderNode[],
    parentFolderId: string | null
  ): Promise<void> {
    for (const node of tree) {
      try {
        const response = await drive.files.create({
          requestBody: {
            name: node.name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: parentFolderId ? [parentFolderId] : undefined,
          },
          fields: 'id',
        })
        const folderId = response.data.id
        if (folderId && node.children?.length) {
          await this.applyTreeToDrive(drive, node.children, folderId)
        }
      } catch {
        // Skip on error
      }
    }
  }

  private async syncCategoriesToTree(tree: FolderNode[]): Promise<void> {
    // Clear existing categories (nullify file references first)
    await prisma.fileMeta.updateMany({
      where: { clubId: this.clubId },
      data: { categoryId: null },
    })
    await prisma.category.deleteMany({ where: { clubId: this.clubId } })

    // Recreate from tree
    const createCategories = async (nodes: FolderNode[], parentId: string | null): Promise<void> => {
      for (const node of nodes) {
        const category = await prisma.category.create({
          data: {
            clubId: this.clubId,
            name: node.name,
            parentId: parentId || undefined,
            description: node.description,
          },
        })
        if (node.children?.length) {
          await createCategories(node.children, category.id)
        }
      }
    }

    await createCategories(tree, null)
  }
}
