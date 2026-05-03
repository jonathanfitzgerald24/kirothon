import { Router, Request, Response } from 'express'
import passport from 'passport'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { Role } from '@prisma/client'

export const authRouter = Router()

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[0-9]/, 'Must contain number'),
    clubName: z.string().min(2).max(100),
  }),
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
})

// POST /api/v1/auth/register
authRouter.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, clubName } = req.body as { email: string; password: string; clubName: string }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists' } })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const club = await prisma.club.create({ data: { name: clubName } })
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: email.split('@')[0],
        role: Role.ADMIN,
        clubId: club.id,
      },
      include: { club: true },
    })

    req.login(user, (err) => {
      if (err) {
        res.status(500).json({ error: { code: 'SESSION_ERROR', message: 'Failed to create session' } })
        return
      }
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          club: { id: club.id, name: club.name },
        },
      })
    })
  } catch (_err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } })
  }
})

// POST /api/v1/auth/login
authRouter.post('/login', validate(loginSchema), (req: Request, res: Response, next) => {
  passport.authenticate(
    'local',
    (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err)
      if (!user) {
        res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: info?.message || 'Invalid credentials' } })
        return
      }
      req.login(user, async (loginErr) => {
        if (loginErr) return next(loginErr)
        const u = user as {
          id: string
          email: string
          displayName: string
          role: Role
          club: { id: string; name: string }
        }
        await prisma.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } })
        res.json({ user: { id: u.id, email: u.email, displayName: u.displayName, role: u.role, club: u.club } })
      })
    }
  )(req, res, next)
})

// GET /api/v1/auth/google
authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

// GET /api/v1/auth/google/callback
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth`,
  }),
  async (req: Request, res: Response) => {
    const u = req.user as { id: string }
    await prisma.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } })
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`)
  }
)

// POST /api/v1/auth/logout
authRouter.post('/logout', requireAuth, (req: Request, res: Response, next) => {
  req.logout((err) => {
    if (err) return next(err)
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr)
      res.clearCookie('connect.sid')
      res.json({ message: 'Logged out successfully' })
    })
  })
})

// GET /api/v1/auth/me
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const u = req.user as {
    id: string
    email: string
    displayName: string
    role: Role
    darkMode: boolean
    firstLoginComplete: boolean
    club: {
      id: string
      name: string
      setupStep: number
      demoMode: boolean
      driveConnected: boolean
    }
  }
  res.json({
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      darkMode: u.darkMode,
      firstLoginComplete: u.firstLoginComplete,
      club: u.club,
    },
  })
})
