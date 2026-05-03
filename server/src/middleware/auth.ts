import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'

const roleLevel: Record<Role, number> = {
  [Role.MEMBER]: 1,
  [Role.MOD]: 2,
  [Role.ADMIN]: 3,
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
    return
  }
  next()
}

export const requireRole = (minimumRole: Role) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } })
      return
    }
    const user = req.user as { role: Role }
    if (roleLevel[user.role] < roleLevel[minimumRole]) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
      return
    }
    next()
  }
}
