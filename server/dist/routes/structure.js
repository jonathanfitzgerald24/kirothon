"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.structureRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const structureAnalyzer_1 = require("../services/structureAnalyzer");
const client_1 = require("@prisma/client");
exports.structureRouter = (0, express_1.Router)();
// POST /api/v1/structure/analyze — start analysis job
exports.structureRouter.post('/analyze', (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res) => {
    const user = req.user;
    try {
        const analyzer = new structureAnalyzer_1.StructureAnalyzer(user.clubId);
        const jobId = analyzer.createJob();
        // Run analysis asynchronously (don't await)
        analyzer.runAnalysis(jobId).catch((err) => {
            console.error(`Analysis job ${jobId} failed:`, err);
        });
        res.status(202).json({ jobId, status: 'pending' });
    }
    catch {
        res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: 'Failed to start analysis' } });
    }
});
// GET /api/v1/structure/analyze/:jobId — poll job status
exports.structureRouter.get('/analyze/:jobId', (0, auth_1.requireRole)(client_1.Role.ADMIN), (req, res) => {
    const user = req.user;
    const { jobId } = req.params;
    const analyzer = new structureAnalyzer_1.StructureAnalyzer(user.clubId);
    const job = analyzer.getJob(jobId);
    if (!job) {
        res.status(404).json({ error: { code: 'JOB_NOT_FOUND', message: 'Analysis job not found' } });
        return;
    }
    if (job.clubId !== user.clubId) {
        res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        return;
    }
    res.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        totalFiles: job.totalFiles,
        inaccessiblePaths: job.inaccessiblePaths,
        error: job.error,
        completedAt: job.completedAt,
    });
});
//# sourceMappingURL=structure.js.map