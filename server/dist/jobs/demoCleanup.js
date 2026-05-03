"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDemoCleanup = void 0;
const demoService_1 = require("../services/demoService");
/**
 * Scheduled job to clean up demo club data after 24 hours of inactivity.
 */
const runDemoCleanup = async () => {
    try {
        const count = await demoService_1.demoService.cleanupExpiredDemos();
        console.log(`Demo cleanup: removed ${count} expired demo clubs`);
    }
    catch (err) {
        console.error('Demo cleanup failed:', err);
    }
};
exports.runDemoCleanup = runDemoCleanup;
if (require.main === module) {
    (0, exports.runDemoCleanup)().then(() => process.exit(0));
}
//# sourceMappingURL=demoCleanup.js.map