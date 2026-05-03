"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTagService = exports.AITagService = void 0;
const prisma_1 = require("../lib/prisma");
const geminiClient_1 = require("./geminiClient");
const gemini = geminiClient_1.geminiClient;
class AITagService {
    async generateTags(fileId) {
        const file = await prisma_1.prisma.fileMeta.findUnique({
            where: { id: fileId },
            include: { category: { select: { name: true } } },
        });
        if (!file)
            return [];
        const prompt = `Generate up to 5 short keyword tags for this file.
File name: ${file.name}
File type: ${file.mimeType}
Folder: ${file.category?.name ?? 'Unsorted'}

Return a JSON array of strings, e.g. ["tag1", "tag2"]. Tags should be lowercase, 1-2 words each.`;
        const response = await gemini.generateContent('gemini-1.5-flash', prompt);
        let tags = [];
        try {
            tags = JSON.parse(response);
            if (!Array.isArray(tags))
                tags = [];
            tags = tags.slice(0, 5).map((t) => String(t).toLowerCase().trim()).filter(Boolean);
        }
        catch {
            return [];
        }
        // Store tags
        for (const tagName of tags) {
            await prisma_1.prisma.tag.upsert({
                where: { fileId_name: { fileId, name: tagName } },
                create: { fileId, name: tagName, autoGen: true },
                update: {},
            });
        }
        return tags;
    }
    async addManualTag(fileId, name) {
        return prisma_1.prisma.tag.upsert({
            where: { fileId_name: { fileId, name } },
            create: { fileId, name, autoGen: false },
            update: { autoGen: false },
        });
    }
    async removeTag(fileId, name) {
        return prisma_1.prisma.tag.deleteMany({ where: { fileId, name } });
    }
}
exports.AITagService = AITagService;
exports.aiTagService = new AITagService();
//# sourceMappingURL=aiTagService.js.map