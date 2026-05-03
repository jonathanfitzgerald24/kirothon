import { User as PrismaUser, Club } from '@prisma/client'

declare global {
  namespace Express {
    interface User extends PrismaUser {
      club: Club
    }
  }
}
