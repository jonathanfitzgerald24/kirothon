import { drive_v3 } from 'googleapis'
import { prisma } from '../lib/prisma'
import { DriveConnector } from './driveConnector'
import { PlacementStatus } from '@prisma/client'

export type JobStatus = 'pending' | 'running' | 'complete' | 'failed'

export interface AnalysisJob {
  id: string
  clubId: string
  status: JobStatus
  progress: number
  totalFiles: number
  inaccessiblePaths: string[]
  error?: string
  completedAt?: Date
}

export interface DriveNode {
  id: string
  name: string
  mimeType: string
  parents: string[]
  size?: string
  modifiedTime?: string
}

// In-memory job store (keyed by jobId)
const jobs = new Map<string, AnalysisJob>()

export class StructureAnalyzer {
  private clubId: string
  private connector: DriveConnector

  constructor(clubId: string) {
    this.clubId = clubId
    this.connector = new DriveConnector(clubId)
  }

  createJob(): string {
    const jobId = crypto.randomUUID()
    jobs.set(jobId, {
      id: jobId,
      clubId: this.clubId,
      status: 'pending',
      progress: 0,
      totalFiles: 0,
      inaccessiblePaths: [],
    })
    return jobId
  }

  getJob(jobId: string): AnalysisJob | undefined {
    return jobs.get(jobId)
  }

  async runAnalysis(jobId: string): Promise<void> {
    const job = jobs.get(jobId)
    if (!job) throw new Error(`Job ${jobId} not found`)

    job.status = 'running'

    try {
      const drive = await this.connector.getDriveClient()

      // Step 1: Fetch all files and folders from Drive
      const allNodes = await this.fetchAllNodes(drive, job)

      // Step 2: Build in-memory tree
      const { folderMap, rootFolders } = this.buildTree(allNodes)

      // Step 3: Persist to Metadata Store
      await this.persistToMetadataStore(folderMap, rootFolders, allNodes, job)

      job.status = 'complete'
      job.completedAt = new Date()
    } catch (err) {
      job.status = 'failed'
      job.error = err instanceof Error ? err.message : 'Unknown error'
    }
  }

  private async fetchAllNodes(drive: drive_v3.Drive, job: AnalysisJob): Promise<DriveNode[]> {
    const allNodes: DriveNode[] = []
    let pageToken: string | undefined

    do {
      try {
        const response = await drive.files.list({
          pageSize: 100,
          pageToken,
          fields: 'nextPageToken, files(id, name, mimeType, parents, size, modifiedTime)',
          q: 'trashed = false',
        })

        const files = response.data.files || []
        for (const file of files) {
          if (file.id && file.name && file.mimeType) {
            allNodes.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              parents: file.parents || [],
              size: file.size || undefined,
              modifiedTime: file.modifiedTime || undefined,
            })
          }
        }

        pageToken = response.data.nextPageToken || undefined
        job.totalFiles = allNodes.length
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string }
        if (error.code === 403 || error.code === 404) {
          job.inaccessiblePaths.push(`Page token: ${pageToken || 'initial'}`)
          break
        }
        throw err
      }
    } while (pageToken)

    return allNodes
  }

  private buildTree(nodes: DriveNode[]): {
    folderMap: Map<string, DriveNode>
    rootFolders: DriveNode[]
  } {
    const folderMap = new Map<string, DriveNode>()
    const allIds = new Set(nodes.map((n) => n.id))

    for (const node of nodes) {
      if (node.mimeType === 'application/vnd.google-apps.folder') {
        folderMap.set(node.id, node)
      }
    }

    // Root folders: folders whose parent is not in our node set
    const rootFolders = Array.from(folderMap.values()).filter(
      (folder) => !folder.parents.length || !folder.parents.some((p) => allIds.has(p))
    )

    return { folderMap, rootFolders }
  }

  private async persistToMetadataStore(
    folderMap: Map<string, DriveNode>,
    rootFolders: DriveNode[],
    allNodes: DriveNode[],
    job: AnalysisJob
  ): Promise<void> {
    // Clear existing categories and files for this club (fresh analysis)
    await prisma.tag.deleteMany({ where: { file: { clubId: this.clubId } } })
    await prisma.fileMeta.deleteMany({ where: { clubId: this.clubId } })
    await prisma.category.deleteMany({ where: { clubId: this.clubId } })

    // Map driveId -> prisma category id
    const categoryIdMap = new Map<string, string>()

    // Recursively create categories
    const createCategory = async (node: DriveNode, parentId: string | null): Promise<void> => {
      const category = await prisma.category.create({
        data: {
          clubId: this.clubId,
          name: node.name,
          parentId: parentId || undefined,
          driveFolderId: node.id,
        },
      })
      categoryIdMap.set(node.id, category.id)

      // Process children
      const children = allNodes.filter(
        (n) => n.parents.includes(node.id) && n.mimeType === 'application/vnd.google-apps.folder'
      )
      for (const child of children) {
        await createCategory(child, category.id)
      }
    }

    for (const root of rootFolders) {
      await createCategory(root, null)
    }

    // Create FileMeta records for non-folder files
    const files = allNodes.filter((n) => n.mimeType !== 'application/vnd.google-apps.folder')
    let processed = 0

    for (const file of files) {
      // Find parent category
      const parentDriveId = file.parents[0]
      const categoryId = parentDriveId ? categoryIdMap.get(parentDriveId) : undefined

      try {
        await prisma.fileMeta.create({
          data: {
            clubId: this.clubId,
            categoryId: categoryId || null,
            driveFileId: file.id,
            name: file.name,
            mimeType: file.mimeType,
            // P9: only driveFileId stored, no binary content
            sizeBytes: file.size ? BigInt(file.size) : BigInt(0),
            placementStatus: PlacementStatus.PLACED,
            driveLastModified: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
            isUnmanaged: !categoryId,
          },
        })
      } catch {
        job.inaccessiblePaths.push(`File: ${file.name} (${file.id})`)
      }

      processed++
      job.progress = Math.round((processed / files.length) * 100)
    }
  }
}
