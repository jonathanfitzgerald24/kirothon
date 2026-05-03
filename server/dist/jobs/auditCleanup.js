"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAuditCleanup = void 0;
const auditService_1 = require("../services/auditService");
/**
 * Scheduled job to delete audit log entries older than 12 months.
 * Run weekly via cron or a scheduler.
 */
const runAuditCleanup = async () => {
    try {
        const deletedCount = await auditService_1.auditService.cleanupOldLogs();
        console.log(`Audit cleanup: removed ${deletedCount} entries older than 12 months`);
    }
    catch (err) {
        console.error('Audit cleanup failed:', err);
    }
};
exports.runAuditCleanup = runAuditCleanup;
// If run directly
if (require.main === module) {
    (0, exports.runAuditCleanup)().then(() => process.exit(0));
}
//# sourceMappingURL=auditCleanup.js.map