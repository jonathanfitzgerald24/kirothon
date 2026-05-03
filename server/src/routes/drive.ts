import { Router, Request, Response } from 'express'
import { DriveConnector } from '../services/driveConnector'
import { requireRole } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'

export const driveRouter = Router()

// GET /api/v1/drive/connect — initiate Drive OAuth (task 4.3)
driveRouter.get('/connect', requireRole(Role.ADMIN), (req: Request, res: Response) => {
  const user = req.user as { clubId: string }
  const connector = new DriveConnector(user.clubId)
  const authUrl = connector.generateAuthUrl()
  res.redirect(authUrl)
})

// GET /api/v1/drive/callback — handle OAuth callback (task 4.4)
driveRouter.get('/callback', requireRole(Role.ADMIN), async (req: Request, res: Response): Promise<void> => {
  const { code, state: clubId, error } = req.query as { code?: string; state?: string; error?: string }

  if (error || !code || !clubId) {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup?error=drive_auth_failed`)
    return
  }

  try {
    const connector = new DriveConnector(clubId)
    await connector.exchangeCodeForTokens(code)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup?step=2&success=drive_connected`)
  } catch {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/setup?error=drive_token_exchange_failed`)
  }
})

// POST /api/v1/drive/disconnect (task 4.5)
driveRouter.post('/disconnect', requireRole(Role.ADMIN), async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { clubId: string }
  try {
    const connector = new DriveConnector(user.clubId)
    await connector.disconnect()
    res.json({ message: 'Google Drive disconnected successfully' })
  } catch {
    res.status(500).json({ error: { code: 'DISCONNECT_FAILED', message: 'Failed to disconnect Google Drive' } })
  }
})

// GET /api/v1/drive/status (task 4.6)
driveRouter.get('/status', requireRole(Role.ADMIN), async (req: Request, res: Response): Promise<void> => {
  const user = req.user as { clubId: string }
  try {
    const club = await prisma.club.findUnique({
      where: { id: user.clubId },
      select: { driveConnected: true, lastSyncAt: true, driftUnresolvedCount: true, driveTokenExpiry: true },
    })
    if (!club) {
      res.status(404).json({ error: { code: 'CLUB_NOT_FOUND', message: 'Club not found' } })
      return
    }
    res.json({
      driveConnected: club.driveConnected,
      lastSyncAt: club.lastSyncAt,
      driftUnresolvedCount: club.driftUnresolvedCount,
      tokenExpiry: club.driveTokenExpiry,
    })
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get Drive status' } })
  }
})
