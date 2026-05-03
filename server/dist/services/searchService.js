"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchService = exports.SearchService = void 0;
const prisma_1 = require("../lib/prisma");
const geminiClient_1 = require("./geminiClient");
const roleLevel = { MEMBER: 1, MOD: 2, ADMIN: 3 };
class SearchService {
    async search(clubId, userRole, userId, params) {
        const where = { clubId };
        // Text search on name
        if (params.q) {
            where.name = { contains: params.q, mode: 'insensitive' };
        }
        if (params.type) {
            where.mimeType = { contains: params.type, mode: 'insensitive' };
        }
        if (params.folder) {
            where.categoryId = params.folder;
        }
        if (params.uploader) {
            where.uploaderId = params.uploader;
        }
        if (params.dateFrom || params.dateTo) {
            const uploadedAt = {};
            if (params.dateFrom)
                uploadedAt.gte = new Date(params.dateFrom);
            if (params.dateTo)
                uploadedAt.lte = new Date(params.dateTo);
            where.uploadedAt = uploadedAt;
        }
        if (params.tag) {
            where.tags = { some: { name: { equals: params.tag, mode: 'insensitive' } } };
        }
        const files = await prisma_1.prisma.fileMeta.findMany({
            where,
            include: {
                category: { select: { id: true, name: true, minimumRole: true } },
                tags: { select: { id: true, name: true } },
                uploader: { select: { id: true, displayName: true } },
            },
            orderBy: { uploadedAt: 'desc' },
            take: 50,
        });
        // Filter by access
        const accessGrants = await prisma_1.prisma.accessGrant.findMany({
            where: { userId },
            select: { categoryId: true },
        });
        const grantedIds = new Set(accessGrants.map((g) => g.categoryId));
        const userLevel = roleLevel[userRole];
        const accessible = files.filter((f) => {
            if (!f.category)
                return true;
            const minLevel = roleLevel[f.category.minimumRole];
            return userLevel >= minLevel || grantedIds.has(f.category.id);
        });
        return { files: accessible, total: accessible.length };
    }
    async semanticSearch(clubId, userRole, userId, query) {
        // Get all file metadata for the club
        const allFiles = await prisma_1.prisma.fileMeta.findMany({
            where: { clubId },
            include: {
                category: { select: { id: true, name: true, minimumRole: true } },
                tags: { select: { name: true } },
            },
            take: 500,
        });
        // Build context for Gemini
        const fileContext = allFiles.map((f) => ({
            id: f.id,
            name: f.name,
            folder: f.category?.name ?? 'Unsorted',
            tags: f.tags.map((t) => t.name),
            summary: f.aiSummary ?? '',
        }));
        const prompt = `Given this search query: "${query}"
And these files: ${JSON.stringify(fileContext)}
Return a JSON array of file IDs ranked by relevance to the query. Only include relevant files.
Format: ["id1", "id2", ...]`;
        const response = await geminiClient_1.geminiClient.generateContent('gemini-1.5-flash', prompt);
        let rankedIds = [];
        try {
            rankedIds = JSON.parse(response);
        }
        catch {
            return { files: [], total: 0 };
        }
        // Filter by access
        const accessGrants = await prisma_1.prisma.accessGrant.findMany({
            where: { userId },
            select: { categoryId: true },
        });
        const grantedIds = new Set(accessGrants.map((g) => g.categoryId));
        const userLevel = roleLevel[userRole];
        const fileMap = new Map(allFiles.map((f) => [f.id, f]));
        const results = rankedIds
            .map((id) => fileMap.get(id))
            .filter((f) => {
            if (!f)
                return false;
            if (!f.category)
                return true;
            const minLevel = roleLevel[f.category.minimumRole];
            return userLevel >= minLevel || grantedIds.has(f.category.id);
        });
        return { files: results, total: results.length };
    }
    async getSimilarFiles(clubId, fileId, userRole, userId) {
        const file = await prisma_1.prisma.fileMeta.findUnique({
            where: { id: fileId },
            include: { tags: true, category: true },
        });
        if (!file)
            return [];
        // Simple similarity: same category or overlapping tags
        const tagNames = file.tags.map((t) => t.name);
        const similar = await prisma_1.prisma.fileMeta.findMany({
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
        });
        // Filter by access
        const accessGrants = await prisma_1.prisma.accessGrant.findMany({
            where: { userId },
            select: { categoryId: true },
        });
        const grantedIds = new Set(accessGrants.map((g) => g.categoryId));
        const userLevel = roleLevel[userRole];
        return similar.filter((f) => {
            if (!f.category)
                return true;
            const minLevel = roleLevel[f.category.minimumRole];
            return userLevel >= minLevel || grantedIds.has(f.category.id);
        });
    }
}
exports.SearchService = SearchService;
exports.searchService = new SearchService();
//# sourceMappingURL=searchService.js.map