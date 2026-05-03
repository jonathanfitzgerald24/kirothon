import { Router, Request, Response } from 'express'
import { requireRole } from '../middleware/auth'
import { StructureAnalyzer } from '../services/structureAnalyzer'
import { Role } from '@prisma/client'

export const structureRouter = Router()

// POST /api/v1/structure/analyze — start analysis job
structureRouter.post('/analyze', requireRole(Role.ADMIN), async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { clubId: string }
  try {
    const analyzer = new StructureAnalyzer(user.clubId)
    const jobId = analyzer.createJob()

    // Run analysis asynchronously (don't await)
    analyzer.runAnalysis(jobId).catch((err) => {
      console.error(`Analysis job ${jobId} failed:`, err)
    })

    res.status(202).json({ jobId, status: 'pending' })
  } catch {
    res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: 'Failed to start analysis' } })
  }
})

// GET /api/v1/structure/analyze/:jobId — poll job status
structureRouter.get('/analyze/:jobId', requireRole(Role.ADMIN), (req: Request, res: Response): void => {
  const user = req.user as { clubId: string }
  const { jobId } = req.params

  const analyzer = new StructureAnalyzer(user.clubId)
  const job = analyzer.getJob(jobId)

  if (!job) {
    res.status(404).json({ error: { code: 'JOB_NOT_FOUND', message: 'Analysis job not found' } })
    return
  }

  if (job.clubId !== user.clubId) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } })
    return
  }

  res.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    totalFiles: job.totalFiles,
    inaccessiblePaths: job.inaccessiblePaths,
    error: job.error,
    completedAt: job.completedAt,
  })
})
