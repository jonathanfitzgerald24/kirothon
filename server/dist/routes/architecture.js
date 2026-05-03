"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.architectureRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const aiArchitect_1 = require("../services/aiArchitect");
const architectureService_1 = require("../services/architectureService");
const client_1 = require("@prisma/client");
exports.architectureRouter = (0, express_1.Router)();
// POST /api/v1/architecture/propose
exports.architectureRouter.post('/propose', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    try {
        const architect = new aiArchitect_1.AIArchitect(user.clubId);
        const proposals = await architect.generateProposals();
        res.json({ proposals });
    }
    catch {
        res.status(500).json({
            error: { code: 'PROPOSAL_FAILED', message: 'Failed to generate architecture proposals' },
        });
    }
});
// GET /api/v1/architecture/proposals
exports.architectureRouter.get('/proposals', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const architect = new aiArchitect_1.AIArchitect(user.clubId);
    const proposals = architect.getProposals();
    if (!proposals) {
        res.status(404).json({
            error: {
                code: 'NO_PROPOSALS',
                message: 'No proposals found. Run POST /architecture/propose first.',
            },
        });
        return;
    }
    res.json({ proposals });
});
// POST /api/v1/architecture/select — select proposal as draft (7.2)
exports.architectureRouter.post('/select', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    const { proposalId, tree } = req.body;
    if (!proposalId || !tree) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'proposalId and tree are required' } });
        return;
    }
    try {
        const service = new architectureService_1.ArchitectureService(user.clubId);
        await service.selectProposal(proposalId, tree);
        res.json({ message: 'Proposal selected as draft', proposalId });
    }
    catch {
        res.status(500).json({ error: { code: 'SELECT_FAILED', message: 'Failed to select proposal' } });
    }
});
// PUT /api/v1/architecture/draft — update draft (7.3)
exports.architectureRouter.put('/draft', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const { tree } = req.body;
    if (!tree) {
        res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'tree is required' } });
        return;
    }
    try {
        const service = new architectureService_1.ArchitectureService(user.clubId);
        const updated = service.updateDraft(tree);
        res.json({ tree: updated });
    }
    catch {
        res.status(404).json({ error: { code: 'NO_DRAFT', message: 'No draft found' } });
    }
});
// GET /api/v1/architecture/draft/preview — get draft preview (7.4)
exports.architectureRouter.get('/draft/preview', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const service = new architectureService_1.ArchitectureService(user.clubId);
    const draft = service.getDraft();
    if (!draft) {
        res.status(404).json({ error: { code: 'NO_DRAFT', message: 'No draft found' } });
        return;
    }
    res.json({ tree: draft });
});
// POST /api/v1/architecture/activate — activate draft (7.6)
exports.architectureRouter.post('/activate', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    const { confirmed } = req.body;
    try {
        const service = new architectureService_1.ArchitectureService(user.clubId);
        const result = await service.activateDraft(confirmed ?? false);
        if (!result.success) {
            res.status(409).json({
                warning: result.warning,
                affectedFiles: result.affectedFiles,
                requiresConfirmation: true,
            });
            return;
        }
        res.json({ message: 'Architecture activated successfully' });
    }
    catch (err) {
        res.status(500).json({
            error: {
                code: 'ACTIVATION_FAILED',
                message: err instanceof Error ? err.message : 'Failed to activate',
            },
        });
    }
});
// GET /api/v1/architecture/current — get active architecture (7.7)
exports.architectureRouter.get('/current', auth_1.requireAuth, async (req, res) => {
    const user = req.user;
    try {
        const service = new architectureService_1.ArchitectureService(user.clubId);
        const tree = await service.getCurrentArchitecture();
        if (!tree) {
            res.status(404).json({ error: { code: 'NO_ARCHITECTURE', message: 'No active architecture found' } });
            return;
        }
        res.json({ tree });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get architecture' } });
    }
});
// GET /api/v1/architecture/versions — version history (7.8)
exports.architectureRouter.get('/versions', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    try {
        const service = new architectureService_1.ArchitectureService(user.clubId);
        const versions = await service.getVersionHistory();
        res.json({ versions });
    }
    catch {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get versions' } });
    }
});
// POST /api/v1/architecture/rollback/:versionId — rollback (7.10)
exports.architectureRouter.post('/rollback/:versionId', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    const { versionId } = req.params;
    try {
        const service = new architectureService_1.ArchitectureService(user.clubId);
        await service.rollback(versionId);
        res.json({ message: 'Rollback successful' });
    }
    catch (err) {
        res.status(500).json({
            error: {
                code: 'ROLLBACK_FAILED',
                message: err instanceof Error ? err.message : 'Rollback failed',
            },
        });
    }
});
// POST /api/v1/architecture/migrate — start migration (7.12)
exports.architectureRouter.post('/migrate', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const { mode } = req.body;
    if (!mode || !['move', 'copy'].includes(mode)) {
        res.status(400).json({ error: { code: 'INVALID_MODE', message: 'mode must be "move" or "copy"' } });
        return;
    }
    const service = new architectureService_1.ArchitectureService(user.clubId);
    const jobId = service.startMigration(mode);
    res.status(202).json({ jobId, status: 'pending' });
});
// GET /api/v1/architecture/migrate/:jobId — migration status (7.13)
exports.architectureRouter.get('/migrate/:jobId', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const { jobId } = req.params;
    const service = new architectureService_1.ArchitectureService(user.clubId);
    const job = service.getMigrationJob(jobId);
    if (!job) {
        res.status(404).json({ error: { code: 'JOB_NOT_FOUND', message: 'Migration job not found' } });
        return;
    }
    res.json(job);
});
//# sourceMappingURL=architecture.js.map