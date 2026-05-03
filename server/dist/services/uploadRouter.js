"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadRouter = void 0;
const prisma_1 = require("../lib/prisma");
const driveConnector_1 = require("./driveConnector");
const geminiClient_1 = require("./geminiClient");
const auditService_1 = require("./auditService");
const client_1 = require("@prisma/client");
const stream_1 = require("stream");
class UploadRouter {
    constructor(clubId) {
        this.clubId = clubId;
        this.connector = new driveConnector_1.DriveConnector(clubId);
    }
    // Duplicate detection (9.2)
    async checkDuplicate(fileName, sizeBytes, categoryId) {
        const sizeMin = BigInt(Math.floor(Number(sizeBytes) * 0.95));
        const sizeMax = BigInt(Math.ceil(Number(sizeBytes) * 1.05));
        const existing = await prisma_1.prisma.fileMeta.findFirst({
            where: {
                clubId: this.clubId,
                name: fileName,
                sizeBytes: { gte: sizeMin, lte: sizeMax },
                ...(categoryId ? { categoryId } : {}),
            },
        });
        return existing ? { existingFileId: existing.id, existingFileName: existing.name } : null;
    }
    // AI rename suggestion (9.3)
    async suggestRename(fileName) {
        const noisePatterns = /(?:final|FINAL|copy\s*of|untitled|v\d+|_v\d+|\(\d+\))/i;
        if (!noisePatterns.test(fileName))
            return null;
        try {
            const response = await geminiClient_1.geminiClient.generateContent('gemini-1.5-flash', `Given this filename: "${fileName}"
It appears to have noise patterns (like "final", "copy of", version numbers).
Suggest a clean canonical filename. Return ONLY the suggested filename, nothing else.`);
            return response.trim();
        }
        catch {
            return null;
        }
    }
    // Confidence scoring (9.4)
    async scoreCategories(fileName, mimeType, sizeBytes) {
        const categories = await prisma_1.prisma.category.findMany({
            where: { clubId: this.clubId },
            select: { id: true, name: true, description: true },
        });
        if (!categories.length)
            return [];
        try {
            const prompt = `You are a file routing assistant. Given a file's metadata and a folder architecture, determine the best folder for this file.

Return a JSON array of the top 3 matches:
[{ "categoryName": "...", "score": 0-100, "explanation": "..." }]

Score guidelines:
- 90-100: Filename and type strongly match the folder's purpose
- 70-89: Reasonable match based on type or partial name match
- Below 70: Weak or no match

File: { name: "${fileName}", mimeType: "${mimeType}", sizeBytes: ${sizeBytes.toString()} }
Categories: ${JSON.stringify(categories.map(c => ({ name: c.name, description: c.description })))}

Return ONLY valid JSON.`;
            const response = await geminiClient_1.geminiClient.generateContent('gemini-1.5-flash', prompt);
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return parsed.map(p => {
                const cat = categories.find(c => c.name === p.categoryName);
                return {
                    categoryId: cat?.id || '',
                    categoryName: p.categoryName,
                    score: p.score,
                    explanation: p.explanation,
                };
            }).filter(s => s.categoryId);
        }
        catch {
            return [];
        }
    }
    // Routing decision (9.5)
    makeRoutingDecision(scores) {
        const above80 = scores.filter(s => s.score >= 80);
        if (above80.length === 1) {
            return { type: 'auto_placed', categoryId: above80[0].categoryId, explanation: above80[0].explanation };
        }
        if (above80.length > 1) {
            return { type: 'needs_selection', options: above80 };
        }
        return { type: 'no_match' };
    }
    // New category suggestion (9.6)
    async suggestNewCategory(fileName, mimeType) {
        const categories = await prisma_1.prisma.category.findMany({
            where: { clubId: this.clubId },
            select: { id: true, name: true },
        });
        try {
            const prompt = `A file named "${fileName}" (type: ${mimeType}) doesn't fit any existing categories: ${categories.map(c => c.name).join(', ')}.
Suggest a new category. Return JSON: { "name": "CategoryName", "rationale": "why this category is needed" }
Return ONLY valid JSON.`;
            const response = await geminiClient_1.geminiClient.generateContent('gemini-1.5-flash', prompt);
            const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        }
        catch {
            return null;
        }
    }
    // File placement (9.7)
    async placeFile(fileBuffer, fileName, mimeType, categoryId, uploaderId, uploadNote, explanation, confidenceScore) {
        // Upload to Drive
        let driveFileId = `local-${crypto.randomUUID()}`;
        try {
            const drive = await this.connector.getDriveClient();
            const category = await prisma_1.prisma.category.findUnique({ where: { id: categoryId } });
            const response = await drive.files.create({
                requestBody: {
                    name: fileName,
                    parents: category?.driveFolderId ? [category.driveFolderId] : undefined,
                },
                media: {
                    mimeType,
                    body: stream_1.Readable.from(fileBuffer),
                },
                fields: 'id',
            });
            driveFileId = response.data.id || driveFileId;
        }
        catch {
            // Continue with local ID if Drive unavailable
        }
        // Create FileMeta record
        const file = await prisma_1.prisma.fileMeta.create({
            data: {
                clubId: this.clubId,
                categoryId,
                driveFileId,
                name: fileName,
                mimeType,
                sizeBytes: BigInt(fileBuffer.length),
                uploaderId,
                placementStatus: client_1.PlacementStatus.PLACED,
                confidenceScore,
                routingExplanation: explanation,
                uploadNote: uploadNote?.slice(0, 280),
            },
        });
        // Update category lastUpdatedAt
        await prisma_1.prisma.category.update({
            where: { id: categoryId },
            data: { lastUpdatedAt: new Date() },
        });
        // Audit log
        await auditService_1.auditService.logAction({
            clubId: this.clubId,
            userId: uploaderId,
            action: 'FILE_UPLOAD',
            resourceType: 'FileMeta',
            resourceId: file.id,
            details: { fileName, categoryId, confidenceScore },
        });
        await auditService_1.auditService.logAction({
            clubId: this.clubId,
            userId: uploaderId,
            action: 'FILE_PLACEMENT',
            resourceType: 'FileMeta',
            resourceId: file.id,
            details: { categoryId, explanation },
        });
        return file.id;
    }
    // Full routing pipeline for a single file
    async routeFile(fileBuffer, fileName, mimeType, uploaderId, uploadNote) {
        const sizeBytes = BigInt(fileBuffer.length);
        // 1. Duplicate detection
        const duplicate = await this.checkDuplicate(fileName, sizeBytes);
        // 2. AI rename suggestion
        const renameSuggestion = await this.suggestRename(fileName) || undefined;
        // 3. Confidence scoring
        const scores = await this.scoreCategories(fileName, mimeType, sizeBytes);
        // 4. Routing decision
        const decision = this.makeRoutingDecision(scores);
        // 5. Auto-place if possible
        let fileId = '';
        if (decision.type === 'auto_placed') {
            fileId = await this.placeFile(fileBuffer, fileName, mimeType, decision.categoryId, uploaderId, uploadNote, decision.explanation, scores.find(s => s.categoryId === decision.categoryId)?.score);
        }
        else if (decision.type === 'no_match') {
            const suggestion = await this.suggestNewCategory(fileName, mimeType);
            if (suggestion) {
                decision.suggestedCategory = suggestion;
            }
            // Store as pending
            const pendingFile = await prisma_1.prisma.fileMeta.create({
                data: {
                    clubId: this.clubId,
                    driveFileId: `pending-${crypto.randomUUID()}`,
                    name: fileName,
                    mimeType,
                    sizeBytes,
                    uploaderId,
                    placementStatus: client_1.PlacementStatus.PENDING,
                    uploadNote: uploadNote?.slice(0, 280),
                },
            });
            fileId = pendingFile.id;
        }
        else {
            // needs_selection — store as pending
            const pendingFile = await prisma_1.prisma.fileMeta.create({
                data: {
                    clubId: this.clubId,
                    driveFileId: `pending-${crypto.randomUUID()}`,
                    name: fileName,
                    mimeType,
                    sizeBytes,
                    uploaderId,
                    placementStatus: client_1.PlacementStatus.PENDING,
                    uploadNote: uploadNote?.slice(0, 280),
                },
            });
            fileId = pendingFile.id;
        }
        return {
            fileId,
            fileName,
            decision,
            duplicateWarning: duplicate || undefined,
            renameSuggestion,
        };
    }
}
exports.UploadRouter = UploadRouter;
//# sourceMappingURL=uploadRouter.js.map