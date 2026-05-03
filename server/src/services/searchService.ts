import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import { geminiClient } from './geminiClient'

const roleLevel = { MEMBER: 1, MOD: 2, ADMIN: 3 } as const

export class SearchService {
  async search(
    clubId: string,
    userRole: Role,
    userId: string,
    params: {
      q: string
      type?: string
      folder?: string
      dateFrom?: string
      dateTo?: string
      uploader?: string
      tag?: string
    }
  ) {
    const where: Record<string, unknown> = { clubId }

    // Text search on name, tags, and category name
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { tags: { some: { name: { contains: params.q, mode: 'insensitive' } } } },
        { category: { name: { contains: params.q, mode: 'insensitive' } } },
      ]
    }

    if (params.type) {
      where.mimeType = { contains: params.type, mode: 'insensitive' }
    }

    if (params.folder) {
      where.categoryId = params.folder
    }

    if (params.uploader) {
      where.uploaderId = params.uploader
    }

    if (params.dateFrom || params.dateTo) {
      const uploadedAt: Record<string, Date> = {}
      if (params.dateFrom) uploadedAt.gte = new Date(params.dateFrom)
      if (params.dateTo) uploadedAt.lte = new Date(params.dateTo)
      where.uploadedAt = uploadedAt
    }

    if (params.tag) {
      where.tags = { some: { name: { equals: params.tag, mode: 'insensitive' } } }
    }

    const files = await prisma.fileMeta.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, minimumRole: true } },
        tags: { select: { id: true, name: true } },
        uploader: { select: { id: true, displayName: true } },
      },
      orderBy: { uploadedAt: 'desc' },
      take: 50,
    })

    // Filter by access
    const accessGrants = await prisma.accessGrant.findMany({
      where: { userId },
      select: { categoryId: true },
    })
    const grantedIds = new Set(accessGrants.map((g) => g.categoryId))
    const userLevel = roleLevel[userRole]

    const accessible = files.filter((f) => {
      if (!f.category) return true
      const minLevel = roleLevel[f.category.minimumRole]
      return userLevel >= minLevel || grantedIds.has(f.category.id)
    })

    return { files: accessible, total: accessible.length }
  }

  async semanticSearch(clubId: string, userRole: Role, userId: string, query: string) {
    // Get all file metadata for the club
    const allFiles = await prisma.fileMeta.findMany({
      where: { clubId },
      include: {
        category: { select: { id: true, name: true, minimumRole: true } },
        tags: { select: { name: true } },
      },
      take: 500,
    })

    // Build context for Gemini
    const fileContext = allFiles.map((f) => ({
      id: f.id,
      name: f.name,
      folder: f.category?.name ?? 'Unsorted',
      tags: f.tags.map((t) => t.name),
      summary: f.aiSummary ?? '',
    }))

    const prompt = `Given this search query: "${query}"
And these files: ${JSON.stringify(fileContext)}
Return a JSON array of file IDs ranked by relevance to the query. Only include relevant files.
Format: ["id1", "id2", ...]`

    const response = await geminiClient.generateContent('gemini-1.5-flash', prompt)
    let rankedIds: string[] = []
    try {
      rankedIds = JSON.parse(response)
    } catch {
      return { files: [], total: 0 }
    }

    // Filter by access
    const accessGrants = await prisma.accessGrant.findMany({
      where: { userId },
      select: { categoryId: true },
    })
    const grantedIds = new Set(accessGrants.map((g) => g.categoryId))
    const userLevel = roleLevel[userRole]

    const fileMap = new Map(allFiles.map((f) => [f.id, f]))
    const results = rankedIds
      .map((id) => fileMap.get(id))
      .filter((f): f is NonNullable<typeof f> => {
        if (!f) return false
        if (!f.category) return true
        const minLevel = roleLevel[f.category.minimumRole]
        return userLevel >= minLevel || grantedIds.has(f.category.id)
      })

    return { files: results, total: results.length }
  }

  async getSimilarFiles(clubId: string, fileId: string, userRole: Role, userId: string) {
    const file = await prisma.fileMeta.findUnique({
      where: { id: fileId },
      include: { tags: true, category: true },
    })

    if (!file) return []

    // Simple similarity: same category or overlapping tags
    const tagNames = file.tags.map((t) => t.name)

    const similar = await prisma.fileMeta.findMany({
      where: {
        clubId,
        id: { not: fileId },
        OR: [
          { categoryId: file.categoryId },
          { tags: { some: { name: { in: tagNames } } } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, minimumRole: true } },
        tags: { select: { id: true, name: true } },
      },
      take: 5,
    })

    // Filter by access
    const accessGrants = await prisma.accessGrant.findMany({
      where: { userId },
      select: { categoryId: true },
    })
    const grantedIds = new Set(accessGrants.map((g) => g.categoryId))
    const userLevel = roleLevel[userRole]

    return similar.filter((f) => {
      if (!f.category) return true
      const minLevel = roleLevel[f.category.minimumRole]
      return userLevel >= minLevel || grantedIds.has(f.category.id)
    })
  }
}

export const searchService = new SearchService()
