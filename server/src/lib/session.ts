import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { Pool } from 'pg'

const PgSession = connectPgSimple(session)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace(/\?schema=\w+/, ''),
})

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
})
