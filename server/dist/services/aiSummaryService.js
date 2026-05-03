"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSummaryService = exports.AISummaryService = void 0;
const prisma_1 = require("../lib/prisma");
const geminiClient_1 = require("./geminiClient");
const gemini = geminiClient_1.geminiClient;
const SUPPORTED_TYPES = [
    'application/pdf',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
class AISummaryService {
    async generateSummary(fileId) {
        const file = await prisma_1.prisma.fileMeta.findUnique({ where: { id: fileId } });
        if (!file)
            return null;
        // Check if supported type and size
        const isSupported = SUPPORTED_TYPES.some((t) => file.mimeType.includes(t));
        if (!isSupported || Number(file.sizeBytes) > MAX_SIZE)
            return null;
        const prompt = `Generate a single concise sentence summarizing what this file likely contains based on its metadata.
File name: ${file.name}
File type: ${file.mimeType}
File size: ${file.sizeBytes} bytes

Return only the summary sentence, no quotes or extra formatting.`;
        const summary = await gemini.generateContent('gemini-1.5-flash', prompt);
        const cleaned = summary.trim().replace(/^["']|["']$/g, '');
        await prisma_1.prisma.fileMeta.update({
            where: { id: fileId },
            data: { aiSummary: cleaned },
        });
        return cleaned;
    }
}
exports.AISummaryService = AISummaryService;
exports.aiSummaryService = new AISummaryService();
//# sourceMappingURL=aiSummaryService.js.map