"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const uploadRouter_1 = require("../services/uploadRouter");
const driveConnector_1 = require("../services/driveConnector");
const auditService_1 = require("../services/auditService");
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
exports.uploadRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB
// POST /api/v1/upload/single (9.8)
exports.uploadRouter.post('/single', (0, auth_1.requireRole)(client_1.Role.MOD), upload.single('file'), async (req, res) => {
    const user = req.user;
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
    }
    const uploadNote = req.body.uploadNote?.slice(0, 280);
    try {
        const router = new uploadRouter_1.UploadRouter(user.clubId);
        const result = await router.routeFile(file.buffer, file.originalname, file.mimetype, user.id, uploadNote);
        res.json(result);
    }
    catch {
        res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: 'Failed to process upload' } });
    }
});
// POST /api/v1/upload/batch (9.9)
exports.uploadRouter.post('/batch', (0, auth_1.requireRole)(client_1.Role.MOD), upload.array('files', 20), async (req, res) => {
    const user = req.user;
    const files = req.files;
    if (!files?.length) {
        res.status(400).json({ error: { code: 'NO_FILES', message: 'No files uploaded' } });
        return;
    }
    try {
        const router = new uploadRouter_1.UploadRouter(user.clubId);
        const results = await Promise.all(files.map(f => router.routeFile(f.buffer, f.originalname, f.mimetype, user.id)));
        const autoPlaced = results.filter(r => r.decision.type === 'auto_placed');
        const needsSelection = results.filter(r => r.decision.type === 'needs_selection');
        const noMatch = results.filter(r => r.decision.type === 'no_match');
        res.json({ autoPlaced, needsSelection, noMatch, total: results.length });
    }
    catch {
        res.status(500).json({ error: { code: 'BATCH_FAILED', message: 'Failed to process batch upload' } });
    }
});
// POST /api/v1/upload/drop/:categoryId (9.10)
exports.uploadRouter.post('/drop/:categoryId', (0, auth_1.requireRole)(client_1.Role.MOD), upload.single('file'), async (req, res) => {
    const user = req.user;
    const { categoryId } = req.params;
    const file = req.file;
    if (!file) {
        res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });
        return;
    }
    try {
        const router = new uploadRouter_1.UploadRouter(user.clubId);
        // Only duplicate detection for drag-and-drop
        const duplicate = await router.checkDuplicate(file.originalname, BigInt(file.buffer.length), categoryId);
        if (duplicate) {
            res.json({ duplicateWarning: duplicate, requiresConfirmation: true });
            return;
        }
        const fileId = await router.placeFile(file.buffer, file.originalname, file.mimetype, categoryId, user.id);
        res.json({ fileId, placed: true });
    }
    catch {
        res.status(500).json({ error: { code: 'DROP_FAILED', message: 'Failed to process drop upload' } });
    }
});
// POST /api/v1/upload/route/:fileId/confirm (9.11)
exports.uploadRouter.post('/route/:fileId/confirm', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    const user = req.user;
    const { fileId } = req.params;
    const { categoryId } = req.body;
    if (!categoryId) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'categoryId required' } });
        return;
    }
    try {
        const file = await prisma_1.prisma.fileMeta.findUnique({ where: { id: fileId } });
        if (!file || file.clubId !== user.clubId) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
            return;
        }
        await prisma_1.prisma.fileMeta.update({
            where: { id: fileId },
            data: { categoryId, placementStatus: client_1.PlacementStatus.PLACED },
        });
        await prisma_1.prisma.category.update({
            where: { id: categoryId },
            data: { lastUpdatedAt: new Date() },
        });
        await auditService_1.auditService.logAction({
            clubId: user.clubId,
            userId: user.id,
            action: 'FILE_PLACEMENT',
            resourceType: 'FileMeta',
            resourceId: fileId,
            details: { categoryId, manual: true },
        });
        res.json({ message: 'File placed successfully' });
    }
    catch {
        res.status(500).json({ error: { code: 'CONFIRM_FAILED', message: 'Failed to confirm placement' } });
    }
});
// POST /api/v1/upload/route/:fileId/new-category (9.12)
exports.uploadRouter.post('/route/:fileId/new-category', (0, auth_1.requireRole)(client_1.Role.MOD), async (req, res) => {
    const user = req.user;
    const { fileId } = req.params;
    const { name, parentId } = req.body;
    if (!name) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Category name required' } });
        return;
    }
    try {
        // Mod suggestions require admin approval
        if (user.role === client_1.Role.MOD) {
            res.json({ message: 'Category suggestion submitted for admin approval', pending: true, suggestedName: name });
            return;
        }
        // Admin can create immediately
        let driveFolderId;
        try {
            const connector = new driveConnector_1.DriveConnector(user.clubId);
            const drive = await connector.getDriveClient();
            const parent = parentId ? await prisma_1.prisma.category.findUnique({ where: { id: parentId } }) : null;
            const response = await drive.files.create({
                requestBody: {
                    name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: parent?.driveFolderId ? [parent.driveFolderId] : undefined,
                },
                fields: 'id',
            });
            driveFolderId = response.data.id || undefined;
        }
        catch { /* continue without Drive */ }
        const category = await prisma_1.prisma.category.create({
            data: { clubId: user.clubId, name, parentId, driveFolderId },
        });
        // Place the file in the new category
        await prisma_1.prisma.fileMeta.update({
            where: { id: fileId },
            data: { categoryId: category.id, placementStatus: client_1.PlacementStatus.PLACED },
        });
        res.json({ categoryId: category.id, fileId, placed: true });
    }
    catch {
        res.status(500).json({ error: { code: 'CREATE_FAILED', message: 'Failed to create category' } });
    }
});
// GET /api/v1/upload/history (9.13)
exports.uploadRouter.get('/history', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    try {
        const [data, total] = await Promise.all([
            prisma_1.prisma.fileMeta.findMany({
                where: { uploaderId: user.id, clubId: user.clubId },
                include: { category: { select: { name: true } } },
                orderBy: { uploadedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma_1.prisma.fileMeta.count({ where: { uploaderId: user.id, clubId: user.clubId } }),
        ]);
        res.json({
            data: data.map(f => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                uploadedAt: f.uploadedAt,
                category: f.category?.name,
                placementStatus: f.placementStatus,
            })),
            total,
            page,
            pageSize,
        });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get upload history' } });
    }
});
//# sourceMappingURL=upload.js.map