import { Router } from 'express'
import { Role } from '@prisma/client'
import { requireAuth, requireRole } from '../middleware/auth'
import { userService } from '../services/userService'

export const usersRouter = Router()

// GET /api/v1/users — Admin only
usersRouter.get('/', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const users = await userService.listUsers(req.user!.clubId)
    res.json(users)
  } catch (err) {
    console.error('List users error:', err)
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to list users' } })
  }
})

// POST /api/v1/users/invite — Admin only
usersRouter.post('/invite', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { email, role } = req.body as { email: string; role: Role }
    if (!email || !role) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Email and role are required' } })
      return
    }
    const result = await userService.createInvitation(req.user!.clubId, email, role, req.user!.id)
    res.status(201).json(result)
  } catch (err) {
    console.error('Invite error:', err)
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to send invitation' } })
  }
})

// PUT /api/v1/users/:userId/role — Admin only
usersRouter.put('/:userId/role', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { role } = req.body as { role: Role }
    const user = await userService.changeRole(req.user!.clubId, req.params.userId, role, req.user!.id)
    res.json(user)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to change role'
    const status = message.includes('Cannot') ? 400 : 500
    res.status(status).json({ error: { code: 'ROLE_CHANGE_FAILED', message } })
  }
})

// DELETE /api/v1/users/:userId — Admin only
usersRouter.delete('/:userId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    await userService.removeUser(req.user!.clubId, req.params.userId, req.user!.id)
    res.status(204).send()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove user'
    const status = message.includes('Cannot') || message.includes('not found') ? 400 : 500
    res.status(status).json({ error: { code: 'REMOVE_FAILED', message } })
  }
})

// PUT /api/v1/categories/:categoryId/minimum-role — Admin only
usersRouter.put('/categories/:categoryId/minimum-role', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { minimumRole } = req.body as { minimumRole: Role }
    const category = await userService.setCategoryMinimumRole(req.user!.clubId, req.params.categoryId, minimumRole)
    res.json(category)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to update category role' } })
  }
})

// POST /api/v1/categories/:categoryId/access — Admin only
usersRouter.post('/categories/:categoryId/access', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { userId } = req.body as { userId: string }
    const grant = await userService.grantAccess(req.params.categoryId, userId)
    res.status(201).json(grant)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to grant access' } })
  }
})

// DELETE /api/v1/categories/:categoryId/access/:userId — Admin only
usersRouter.delete('/categories/:categoryId/access/:userId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    await userService.revokeAccess(req.params.categoryId, req.params.userId)
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to revoke access' } })
  }
})

// POST /api/v1/access-requests — Mod, Member
usersRouter.post('/access-requests', requireAuth, async (req, res) => {
  try {
    const { categoryId } = req.body as { categoryId: string }
    const request = await userService.submitAccessRequest(req.user!.id, categoryId)
    res.status(201).json(request)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to submit access request' } })
  }
})

// PUT /api/v1/access-requests/:requestId — Admin only
usersRouter.put('/access-requests/:requestId', requireRole(Role.ADMIN), async (req, res) => {
  try {
    const { status } = req.body as { status: 'APPROVED' | 'DENIED' }
    const result = await userService.resolveAccessRequest(req.params.requestId, status, req.user!.id)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to resolve access request' } })
  }
})
