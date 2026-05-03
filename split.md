# Task Split — Tasks 8-17

Tasks 1-7 are done. Tasks 18-20 (frontend) are done. Here's how we're splitting the remaining backend tasks.

## Cameron (Machine A)

Building in this order:

1. **Task 14** — Audit Logging (auditService, middleware, route, cleanup job)
2. **Task 11** — User & Role Management (userService, invite flow, role changes, access control, last admin protection)
3. **Task 17** — Favorites, Quick Access, File Requests (CRUD routes)
4. **Task 12** — Notifications & Real-Time (notificationService, SSE endpoints, activity feed)
5. **Task 10** — Search (searchService, standard + semantic search, similar files)
6. **Task 13** — AI Features (tags, summaries, folder descriptions, reorg suggestions, smart naming)
7. **Task 16** — Setup Wizard, Demo Mode, Club Type (setup routes, demo service, demo guard)

**Files I'll be creating/editing:**
- `server/src/services/` — auditService, userService, notificationService, searchService, aiTagService, aiSummaryService, demoService
- `server/src/routes/` — audit-logs, users, favorites, quick-access, file-requests, notifications, activity, search, ai, setup, demo
- `server/src/middleware/` — auditLog, demoGuard
- `server/src/jobs/` — auditCleanup, demoCleanup
- `server/src/tests/` — property tests P2, P5, P7, P10, P11, P12, P14, P15

## Jonathan (Machine B)

Building in this order:

1. **Task 8** — File Portal routes (filterByAccess middleware, tree/folder/file/preview/download/timeline/hover endpoints)
2. **Task 9** — Upload Routing (uploadRouter service, single/batch/drop upload, routing pipeline, duplicate detection, confidence scoring)
3. **Task 15** — Drive Sync & Change Detection (driveSyncService, webhook registration, change processing, drift resolution)

**Files you'll be creating/editing:**
- `server/src/services/` — uploadRouter, driveSyncService
- `server/src/routes/` — portal, upload, drive (webhook + drift endpoints)
- `server/src/middleware/` — filterByAccess
- `server/src/jobs/` — webhookRenewal
- `server/src/tests/` — property tests P1, P4, P8, P9, P13

## Coordination Notes

- We both use `server/src/index.ts` to register routes — coordinate before editing it, or each add your own routes and merge
- Audit logging (Task 14) will create the `auditService` — Task 9 (upload routing) should call `auditService.logAction()` after file uploads/placements once it's available
- Notification service (Task 12) will be needed by Task 9 for post-placement notifications — can be wired up after both are done
- Neither of us should touch `client/` — frontend is complete
- Neither of us should touch `prisma/schema.prisma` — schema is final
