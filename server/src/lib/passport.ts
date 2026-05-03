import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import bcrypt from 'bcrypt'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email }, include: { club: true } })
      if (!user || !user.passwordHash) {
        return done(null, false, { message: 'Invalid email or password' })
      }
      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return done(null, false, { message: 'Invalid email or password' })
      }
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: `${process.env.BASE_URL || 'http://localhost:3001'}/api/v1/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) return done(new Error('No email from Google'))

        // Check existing user by googleId
        let user = await prisma.user.findFirst({ where: { googleId: profile.id }, include: { club: true } })
        if (user) return done(null, user)

        // Check existing user by email
        user = await prisma.user.findUnique({ where: { email }, include: { club: true } })
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
            include: { club: true },
          })
          return done(null, user)
        }

        // Check pending invitation
        const invitation = await prisma.invitation.findFirst({
          where: { email, usedAt: null, expiresAt: { gt: new Date() } },
        })

        if (invitation) {
          const newUser = await prisma.user.create({
            data: {
              email,
              googleId: profile.id,
              displayName: profile.displayName || email,
              role: invitation.role,
              clubId: invitation.clubId,
            },
            include: { club: true },
          })
          await prisma.invitation.update({ where: { id: invitation.id }, data: { usedAt: new Date() } })
          return done(null, newUser)
        }

        // New user — create new club
        const club = await prisma.club.create({ data: { name: `${profile.displayName || email}'s Club` } })
        const newUser = await prisma.user.create({
          data: {
            email,
            googleId: profile.id,
            displayName: profile.displayName || email,
            role: Role.ADMIN,
            clubId: club.id,
          },
          include: { club: true },
        })
        return done(null, newUser)
      } catch (err) {
        return done(err as Error)
      }
    }
  )
)

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as { id: string }).id)
})

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id }, include: { club: true } })
    done(null, user)
  } catch (err) {
    done(err)
  }
})

export default passport
