import { Router } from 'express'
import { demoService } from '../services/demoService'

export const demoRouter = Router()

// POST /api/v1/demo/start — no auth required
demoRouter.post('/start', async (req, res) => {
  try {
    const { club, user } = await demoService.createDemoClub()

    // Log the user in by setting session
    if (req.login) {
      req.login(user as Express.User, (err) => {
        if (err) {
          res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create demo session' } })
          return
        }
        res.json({ clubId: club.id, userId: user.id, demoMode: true })
      })
    } else {
      res.json({ clubId: club.id, userId: user.id, demoMode: true })
    }
  } catch (err) {
    console.error('Demo start error:', err)
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to start demo' } })
  }
})

// GET /api/v1/demo/status
demoRouter.get('/status', (req, res) => {
  const user = req.user as any
  res.json({ demoMode: user?.club?.demoMode ?? false })
})
