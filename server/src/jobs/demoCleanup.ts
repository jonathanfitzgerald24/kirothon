import { demoService } from '../services/demoService'

/**
 * Scheduled job to clean up demo club data after 24 hours of inactivity.
 */
export const runDemoCleanup = async (): Promise<void> => {
  try {
    const count = await demoService.cleanupExpiredDemos()
    console.log(`Demo cleanup: removed ${count} expired demo clubs`)
  } catch (err) {
    console.error('Demo cleanup failed:', err)
  }
}

if (require.main === module) {
  runDemoCleanup().then(() => process.exit(0))
}
