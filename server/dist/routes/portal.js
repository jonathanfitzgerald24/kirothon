"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portalRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const filterByAccess_1 = require("../middleware/filterByAccess");
const driveConnector_1 = require("../services/driveConnector");
const prisma_1 = require("../lib/prisma");
const archiver_1 = __importDefault(require("archiver"));
exports.portalRouter = (0, express_1.Router)();
// Apply auth + access loading to all portal routes
exports.portalRouter.use(auth_1.requireAuth);
exports.portalRouter.use(filterByAccess_1.loadAccessibleCategories);
// GET /api/v1/portal/tree — folder tree filtered by access (8.2)
exports.portalRouter.get('/tree', async (req, res) => {
    const user = req.user;
    try {
        const categories = await prisma_1.prisma.category.findMany({
            where: { clubId: user.clubId },
            orderBy: { sortOrder: 'asc' },
        });
        const accessible = categories.filter((c) => req.accessibleCategoryIds?.has(c.id));
        const lastLogin = user.lastLoginAt || new Date(0);
        const tree = accessible.map((c) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId,
            description: c.description,
            minimumRole: c.minimumRole,
            sortOrder: c.sortOrder,
            lastUpdatedAt: c.lastUpdatedAt,
            isNew: c.lastUpdatedAt > lastLogin,
        }));
        res.json({ tree });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get folder tree' } });
    }
});
// GET /api/v1/portal/folder/:categoryId — folder contents (8.3)
exports.portalRouter.get('/folder/:categoryId', async (req, res) => {
    const user = req.user;
    const { categoryId } = req.params;
    if (!(0, filterByAccess_1.checkCategoryAccess)(categoryId, req, res))
        return;
    try {
        const [category, subfolders, files] = await Promise.all([
            prisma_1.prisma.category.findUnique({ where: { id: categoryId } }),
            prisma_1.prisma.category.findMany({
                where: { parentId: categoryId, clubId: user.clubId },
                orderBy: { sortOrder: 'asc' },
            }),
            prisma_1.prisma.fileMeta.findMany({
                where: { categoryId, clubId: user.clubId },
                include: { uploader: { select: { displayName: true } }, tags: true },
                orderBy: { uploadedAt: 'desc' },
            }),
        ]);
        if (!category) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Folder not found' } });
            return;
        }
        // Build breadcrumb ancestors
        const ancestors = [];
        let current = category;
        while (current.parentId) {
            const parent = await prisma_1.prisma.category.findUnique({ where: { id: current.parentId } });
            if (!parent)
                break;
            ancestors.unshift({ id: parent.id, name: parent.name });
            current = parent;
        }
        const accessibleSubfolders = subfolders.filter((s) => req.accessibleCategoryIds?.has(s.id));
        const lastLogin = user.lastLoginAt || new Date(0);
        res.json({
            folder: { id: category.id, name: category.name, description: category.description, lastUpdatedAt: category.lastUpdatedAt },
            ancestors,
            subfolders: accessibleSubfolders.map((s) => ({ id: s.id, name: s.name, lastUpdatedAt: s.lastUpdatedAt, isNew: s.lastUpdatedAt > lastLogin })),
            files: files.map((f) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                sizeBytes: f.sizeBytes.toString(),
                uploadedAt: f.uploadedAt,
                driveLastModified: f.driveLastModified,
                uploader: f.uploader?.displayName,
                tags: f.tags.map((t) => t.name),
                isNew: f.uploadedAt > lastLogin,
            })),
        });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get folder contents' } });
    }
});
// GET /api/v1/portal/file/:fileId — file detail (8.4)
exports.portalRouter.get('/file/:fileId', async (req, res) => {
    const { fileId } = req.params;
    try {
        const file = await prisma_1.prisma.fileMeta.findUnique({
            where: { id: fileId },
            include: { uploader: { select: { displayName: true } }, tags: true, category: true },
        });
        if (!file) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
            return;
        }
        if (file.categoryId && !(0, filterByAccess_1.checkCategoryAccess)(file.categoryId, req, res))
            return;
        res.json({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes.toString(),
            uploadedAt: file.uploadedAt,
            driveLastModified: file.driveLastModified,
            uploader: file.uploader?.displayName,
            uploadNote: file.uploadNote,
            aiSummary: file.aiSummary,
            routingExplanation: file.routingExplanation,
            confidenceScore: file.confidenceScore,
            placementStatus: file.placementStatus,
            tags: file.tags.map((t) => ({ name: t.name, autoGen: t.autoGen })),
            category: file.category ? { id: file.category.id, name: file.category.name } : null,
        });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get file' } });
    }
});
// GET /api/v1/portal/file/:fileId/preview — proxy preview from Drive (8.5)
exports.portalRouter.get('/file/:fileId/preview', async (req, res) => {
    const user = req.user;
    const { fileId } = req.params;
    try {
        const file = await prisma_1.prisma.fileMeta.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
            return;
        }
        if (file.categoryId && !(0, filterByAccess_1.checkCategoryAccess)(file.categoryId, req, res))
            return;
        const connector = new driveConnector_1.DriveConnector(user.clubId);
        const drive = await connector.getDriveClient();
        // For Google Docs/Sheets/Slides, export as PDF
        const exportMimeTypes = {
            'application/vnd.google-apps.document': 'application/pdf',
            'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.google-apps.presentation': 'application/pdf',
        };
        const exportMime = exportMimeTypes[file.mimeType];
        if (exportMime) {
            const response = await drive.files.export({ fileId: file.driveFileId, mimeType: exportMime }, { responseType: 'stream' });
            res.setHeader('Content-Type', exportMime);
            response.data.pipe(res);
        }
        else {
            const response = await drive.files.get({ fileId: file.driveFileId, alt: 'media' }, { responseType: 'stream' });
            res.setHeader('Content-Type', file.mimeType);
            response.data.pipe(res);
        }
    }
    catch {
        res.status(502).json({ error: { code: 'DRIVE_ERROR', message: 'Failed to fetch file preview from Drive' } });
    }
});
// GET /api/v1/portal/file/:fileId/download — proxy download from Drive (8.6)
exports.portalRouter.get('/file/:fileId/download', async (req, res) => {
    const user = req.user;
    const { fileId } = req.params;
    try {
        const file = await prisma_1.prisma.fileMeta.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
            return;
        }
        if (file.categoryId && !(0, filterByAccess_1.checkCategoryAccess)(file.categoryId, req, res))
            return;
        const connector = new driveConnector_1.DriveConnector(user.clubId);
        const drive = await connector.getDriveClient();
        const response = await drive.files.get({ fileId: file.driveFileId, alt: 'media' }, { responseType: 'stream' });
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
        res.setHeader('Content-Type', file.mimeType);
        response.data.pipe(res);
    }
    catch {
        res.status(502).json({ error: { code: 'DRIVE_ERROR', message: 'Failed to download file from Drive' } });
    }
});
// POST /api/v1/portal/files/download — bulk ZIP download (8.7)
exports.portalRouter.post('/files/download', async (req, res) => {
    const user = req.user;
    const { fileIds } = req.body;
    if (!fileIds?.length) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'fileIds array is required' } });
        return;
    }
    try {
        const files = await prisma_1.prisma.fileMeta.findMany({ where: { id: { in: fileIds }, clubId: user.clubId } });
        const accessible = files.filter((f) => !f.categoryId || req.accessibleCategoryIds?.has(f.categoryId));
        const connector = new driveConnector_1.DriveConnector(user.clubId);
        const drive = await connector.getDriveClient();
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="intakeflow-download.zip"');
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 6 } });
        archive.pipe(res);
        for (const file of accessible) {
            try {
                const response = await drive.files.get({ fileId: file.driveFileId, alt: 'media' }, { responseType: 'stream' });
                archive.append(response.data, { name: file.name });
            }
            catch {
                // Skip files that fail
            }
        }
        await archive.finalize();
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create ZIP archive' } });
    }
});
// GET /api/v1/portal/timeline — timeline view (8.8)
exports.portalRouter.get('/timeline', async (req, res) => {
    const user = req.user;
    const { folder, tag } = req.query;
    try {
        const files = await prisma_1.prisma.fileMeta.findMany({
            where: {
                clubId: user.clubId,
                categoryId: folder
                    ? folder
                    : { in: Array.from(req.accessibleCategoryIds || []) },
                ...(tag ? { tags: { some: { name: tag } } } : {}),
            },
            include: { uploader: { select: { displayName: true } }, tags: true, category: { select: { id: true, name: true } } },
            orderBy: { uploadedAt: 'desc' },
        });
        // Group by month
        const grouped = {};
        for (const file of files) {
            if (file.categoryId && !req.accessibleCategoryIds?.has(file.categoryId))
                continue;
            const month = file.uploadedAt.toISOString().slice(0, 7); // YYYY-MM
            if (!grouped[month])
                grouped[month] = [];
            grouped[month].push(file);
        }
        const timeline = Object.entries(grouped).map(([month, monthFiles]) => ({
            month,
            files: monthFiles.map((f) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                sizeBytes: f.sizeBytes.toString(),
                uploadedAt: f.uploadedAt,
                uploader: f.uploader?.displayName,
                category: f.category,
                tags: f.tags.map((t) => t.name),
            })),
        }));
        res.json({ timeline });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get timeline' } });
    }
});
// GET /api/v1/portal/folder/:categoryId/hover — folder preview popover (8.9)
exports.portalRouter.get('/folder/:categoryId/hover', async (req, res) => {
    const user = req.user;
    const { categoryId } = req.params;
    if (!(0, filterByAccess_1.checkCategoryAccess)(categoryId, req, res))
        return;
    try {
        const [recentFiles, totalCount] = await Promise.all([
            prisma_1.prisma.fileMeta.findMany({
                where: { categoryId, clubId: user.clubId },
                orderBy: { driveLastModified: 'desc' },
                take: 5,
                select: { id: true, name: true, mimeType: true, driveLastModified: true },
            }),
            prisma_1.prisma.fileMeta.count({ where: { categoryId, clubId: user.clubId } }),
        ]);
        res.json({ recentFiles, totalCount });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get folder preview' } });
    }
});
//# sourceMappingURL=portal.js.map