import 'dotenv/config'
import express from 'express'
import { sessionMiddleware } from './lib/session'
import passport from './lib/passport'
import { authRouter } from './routes/auth'
import { driveRouter } from './routes/drive'
import { structureRouter } from './routes/structure'
import { architectureRouter } from './routes/architecture'
import { auditLogsRouter } from './routes/auditLogs'

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
