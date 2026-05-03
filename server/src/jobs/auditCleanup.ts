import { auditService } from '../services/auditService'

/**
 * Scheduled job to delete audit log entries older than 12 months.
 * Run weekly via cron or a scheduler.
 */
export const runAuditCleanup = async (): Promise<void> => {
  try {
    const deletedCount = await auditService.cleanupOldLogs()
    console.log(`Audit cleanup: removed ${deletedCount} entries older than 12 months`)
  } catch (err) {
    console.error('Audit cleanup failed:', err)
  }
}

// If run directly
if (require.main === module) {
  runAuditCleanup().then(() => process.exit(0))
}
