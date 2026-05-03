import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { searchService } from '../services/searchService'

export const searchRouter = Router()

// GET /api/v1/search
searchRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { q, type, folder, dateFrom, dateTo, uploader, tag } = req.query as Record<string, string | undefined>

    if (!q || q.length < 2) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Query must be at least 2 characters' } })
      return
    }

    const result = await searchService.search((req.user as any).clubId, (req.user as any).role, (req.user as any).id, {
      q,
      type,
      folder,
      dateFrom,
      dateTo,
      uploader,
      tag,
    })

    res.json(result)
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Search failed' } })
  }
})

// GET /api/v1/search/semantic
searchRouter.get('/semantic', requireAuth, async (req, res) => {
  try {
    const { q } = req.query as { q?: string }
    if (!q || q.length < 2) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Query must be at least 2 characters' } })
      return
    }

    const result = await searchService.semanticSearch((req.user as any).clubId, (req.user as any).role, (req.user as any).id, q)
    res.json(result)
  } catch (err) {
    console.error('Semantic search error:', err)
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Semantic search failed' } })
  }
})
