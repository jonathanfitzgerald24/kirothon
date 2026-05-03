"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const aiTagService_1 = require("../services/aiTagService");
const prisma_1 = require("../lib/prisma");
const geminiClient_1 = require("../services/geminiClient");
exports.aiRouter = (0, express_1.Router)();
const gemini = geminiClient_1.geminiClient;
// POST /api/v1/ai/tags/:fileId — regenerate auto-tags
exports.aiRouter.post('/tags/:fileId', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    try {
        const tags = await aiTagService_1.aiTagService.generateTags(req.params.fileId);
        res.json({ tags });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to generate tags' } });
    }
});
// PUT /api/v1/ai/tags/:fileId — manually add/remove tags
exports.aiRouter.put('/tags/:fileId', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    try {
        const { add, remove } = req.body;
        if (add) {
            for (const name of add) {
                await aiTagService_1.aiTagService.addManualTag(req.params.fileId, name);
            }
        }
        if (remove) {
            for (const name of remove) {
                await aiTagService_1.aiTagService.removeTag(req.params.fileId, name);
            }
        }
        const tags = await prisma_1.prisma.tag.findMany({ where: { fileId: req.params.fileId } });
        res.json({ tags });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update tags' } });
    }
});
// POST /api/v1/ai/smart-name — check a proposed category name
exports.aiRouter.post('/smart-name', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    try {
        const { name, clubId } = req.body;
        const cId = clubId ?? req.user.clubId;
        const existingCategories = await prisma_1.prisma.category.findMany({
            where: { clubId: cId },
            select: { name: true },
        });
        const existingNames = existingCategories.map((c) => c.name);
        const prompt = `A user wants to create a folder named "${name}" in a file organization system.
Existing folder names: ${JSON.stringify(existingNames)}

If the proposed name is inconsistent with the existing naming conventions (e.g., different casing, abbreviation style, or format), suggest a normalized version.
If the name is fine, return the same name.

Return only the suggested name as plain text, nothing else.`;
        const suggestion = await gemini.generateContent('gemini-1.5-flash', prompt);
        const cleaned = suggestion.trim().replace(/^["']|["']$/g, '');
        res.json({
            original: name,
            suggestion: cleaned,
            changed: cleaned.toLowerCase() !== name.toLowerCase(),
        });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Smart naming failed' } });
    }
});
// GET /api/v1/ai/reorganize — trigger re-organization analysis
exports.aiRouter.get('/reorganize', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({
            where: { clubId: req.user.clubId },
            include: { files: { select: { id: true, name: true, mimeType: true, placementStatus: true } } },
        });
        const unsortedFiles = await prisma_1.prisma.fileMeta.findMany({
            where: { clubId: req.user.clubId, placementStatus: 'UNSORTED' },
            select: { id: true, name: true, mimeType: true },
        });
        const prompt = `Analyze this folder structure and suggest reorganization improvements.
Folders: ${JSON.stringify(categories.map((c) => ({ name: c.name, fileCount: c.files.length })))}
Unsorted files: ${JSON.stringify(unsortedFiles.map((f) => ({ name: f.name, type: f.mimeType })))}

Return a JSON object with:
{
  "suggestions": [
    { "type": "move" | "merge" | "rename" | "create", "description": "...", "details": {} }
  ]
}`;
        const response = await gemini.generateContent('gemini-1.5-pro', prompt);
        let suggestions = [];
        try {
            const parsed = JSON.parse(response);
            suggestions = parsed.suggestions ?? [];
        }
        catch {
            suggestions = [];
        }
        res.json({ suggestions });
    }
    catch (err) {
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Reorganization analysis failed' } });
    }
});
//# sourceMappingURL=ai.js.map