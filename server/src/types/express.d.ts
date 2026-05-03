import { Role, Club } from '@prisma/client'

declare global {
  namespace Express {
    interface User {
      id: string
      email: string
      passwordHash: string | null
      googleId: string | null
      displayName: string
      role: Role
      clubId: string
      club: Club
      darkMode: boolean
      firstLoginComplete: boolean
      lastLoginAt: Date | null
      createdAt: Date
      updatedAt: Date
    }
  }
}

export {}
