"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const searchService_1 = require("../services/searchService");
exports.searchRouter = (0, express_1.Router)();
// GET /api/v1/search
exports.searchRouter.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const { q, type, folder, dateFrom, dateTo, uploader, tag } = req.query;
        if (!q || q.length < 2) {
            res.status(400).json({ error: { code: 'VALIDATION', message: 'Query must be at least 2 characters' } });
            return;
        }
        const result = await searchService_1.searchService.search(req.user.clubId, req.user.role, req.user.id, {
            q,
            type,
            folder,
            dateFrom,
            dateTo,
            uploader,
            tag,
        });
        res.json(result);
    }
    catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Search failed' } });
    }
});
// GET /api/v1/search/semantic
exports.searchRouter.get('/semantic', auth_1.requireAuth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            res.status(400).json({ error: { code: 'VALIDATION', message: 'Query must be at least 2 characters' } });
            return;
        }
        const result = await searchService_1.searchService.semanticSearch(req.user.clubId, req.user.role, req.user.id, q);
        res.json(result);
    }
    catch (err) {
        console.error('Semantic search error:', err);
        res.status(500).json({ error: { code: 'INTERNAL', message: 'Semantic search failed' } });
    }
});
//# sourceMappingURL=search.js.map