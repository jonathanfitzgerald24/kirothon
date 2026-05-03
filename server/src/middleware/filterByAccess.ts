import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'

const roleLevel: Record<Role, number> = {
  [Role.MEMBER]: 1,
  [Role.MOD]: 2,
  [Role.ADMIN]: 3,
}

export interface AccessibleCategory {
  id: string
  accessible: boolean
}

// Attach accessible category IDs to request
declare global {
  namespace Express {
    interface Request {
      accessibleCategoryIds?: Set<string>
    }
  }
}

export async function loadAccessibleCategories(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) { next(); return }
  const user = req.user as { id: string; role: Role; clubId: string }

  const categories = await prisma.category.findMany({
    where: { clubId: user.clubId },
    select: { id: true, minimumRole: true },
  })

  // ADMIN gets access to everything
  if (user.role === Role.ADMIN) {
    req.accessibleCategoryIds = new Set(categories.map((c) => c.id))
    next()
    return
  }

  const grants = await prisma.accessGrant.findMany({
    where: { userId: user.id },
    select: { categoryId: true },
  })
  const grantedIds = new Set(grants.map((g) => g.categoryId))

  req.accessibleCategoryIds = new Set(
    categories
      .filter((c) => roleLevel[user.role] >= roleLevel[c.minimumRole] || grantedIds.has(c.id))
      .map((c) => c.id)
  )
  next()
}

export function checkCategoryAccess(categoryId: string, req: Request, res: Response): boolean {
  // ADMIN bypasses access checks
  const user = req.user as { role: Role } | undefined
  if (user?.role === Role.ADMIN) return true

  if (!req.accessibleCategoryIds) return false
  if (!req.accessibleCategoryIds.has(categoryId)) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied to this category' } })
    return false
  }
  return true
}
