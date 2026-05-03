import 'dotenv/config'
import express from 'express'
import { sessionMiddleware } from './lib/session'
import passport from './lib/passport'
import { authRouter } from './routes/auth'
import { driveRouter } from './routes/drive'
import { structureRouter } from './routes/structure'
import { architectureRouter } from './routes/architecture'
import { auditLogsRouter } from './routes/auditLogs'
import { usersRouter } from './routes/users'
import { favoritesRouter } from './routes/favorites'
import { quickAccessRouter } from './routes/quickAccess'
import { fileRequestsRouter } from './routes/fileRequests'
import { notificationsRouter, activityRouter } from './routes/notifications'
import { searchRouter } from './routes/search'
import { aiRouter } from './routes/ai'
import { setupRouter } from './routes/setup'
import { demoRouter } from './routes/demo'
import { portalRouter } from './routes/portal'
import { uploadRouter } from './routes/upload'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/drive', driveRouter)
app.use('/api/v1/structure', structureRouter)
app.use('/api/v1/architecture', architectureRouter)
app.use('/api/v1/audit-logs', auditLogsRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/categories', usersRouter)
app.use('/api/v1/access-requests', usersRouter)
app.use('/api/v1/favorites', favoritesRouter)
app.use('/api/v1/quick-access', quickAccessRouter)
app.use('/api/v1/file-requests', fileRequestsRouter)
app.use('/api/v1/notifications', notificationsRouter)
app.use('/api/v1/activity', activityRouter)
app.use('/api/v1/search', searchRouter)
app.use('/api/v1/ai', aiRouter)
app.use('/api/v1/setup', setupRouter)
app.use('/api/v1/demo', demoRouter)
app.use('/api/v1/portal', portalRouter)
app.use('/api/v1/upload', uploadRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
