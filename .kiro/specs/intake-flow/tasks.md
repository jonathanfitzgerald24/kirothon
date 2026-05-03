# Implementation Tasks — IntakeFlow
git pull
## Task 1: Project Scaffolding and Configuration

- [ ] 1.1 Initialize monorepo structure with `client/` and `server/` directories, root `package.json` with workspaces
- [ ] 1.2 Set up `server/` with Express + TypeScript: `tsconfig.json`, `package.json`, install `express`, `typescript`, `ts-node`, `@types/express`, `@types/node`
- [ ] 1.3 Set up `client/` with Vite + React + TypeScript: `vite create`, install `react`, `react-dom`, `react-router-dom`, `typescript`
- [ ] 1.4 Install and configure Tailwind CSS + shadcn/ui in `client/`: `tailwind.config.ts`, `postcss.config.js`, global styles
- [ ] 1.5 Install and configure Prisma in `server/`: `prisma init`, set `DATABASE_URL` in `.env.example`, create initial empty `schema.prisma`
- [ ] 1.6 Create `docker-compose.yml` with PostgreSQL 16 service for local development
- [ ] 1.7 Install shared dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `eslint`, `prettier`
- [ ] 1.8 Create `.env.example` with all required environment variables: `DATABASE_URL`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_AI_API_KEY`, `SENDGRID_API_KEY`, `ENCRYPTION_KEY`

## Task 2: Database Schema and Prisma Models

- [x] 2.1 Define core enums in `schema.prisma`: `Role` (ADMIN, MOD, MEMBER), `PlacementStatus` (PLACED, PENDING, FAILED, UNSORTED)
- [x] 2.2 Define `Club` model with all fields: id, name, clubType, Drive connection fields (driveConnected, encrypted tokens, webhook fields, pageToken), setupStep, demoMode, lastSyncAt, driftUnresolvedCount, timestamps
- [x] 2.3 Define `User` model: id, email, passwordHash (nullable for OAuth-only), googleId, displayName, role, clubId (FK to Club), darkMode, firstLoginComplete, lastLoginAt, timestamps
- [x] 2.4 Define `Session` model: id, userId, data (Json), expiresAt, createdAt
- [x] 2.5 Define `ArchitectureVersion` model: id, clubId (FK), version, treeSnapshot (Json), isActive, isDraft, activatedAt, createdAt
- [x] 2.6 Define `Category` model: id, clubId (FK), name, parentId (self-referential FK), driveFolderId, description, minimumRole (default MEMBER), sortOrder, lastUpdatedAt, timestamps
- [x] 2.7 Define `AccessGrant` model: id, userId (FK), categoryId (FK), createdAt; unique constraint on (userId, categoryId)
- [x] 2.8 Define `FileMeta` model: id, clubId (FK), categoryId (FK nullable), driveFileId, name, mimeType, sizeBytes (BigInt), uploaderId (FK nullable), placementStatus, confidenceScore, routingExplanation, aiSummary, uploadNote (VarChar 280), isUnmanaged, driveLastModified, uploadedAt, timestamps
- [x] 2.9 Define `Tag` model: id, name, fileId (FK with cascade delete), autoGen boolean; unique constraint on (fileId, name)
- [x] 2.10 Define `Favorite` model: id, userId (FK), fileId (FK with cascade delete), createdAt; unique constraint on (userId, fileId)
- [x] 2.11 Define `QuickAccessFile` model: id, clubId, fileId (unique, FK with cascade delete), sortOrder, createdAt
- [x] 2.12 Define `AuditLog` model: id, clubId (FK), userId (FK nullable), action, resourceType, resourceId, details (Json), createdAt; indexes on (clubId, createdAt), (clubId, action), (clubId, userId)
- [x] 2.13 Define `Invitation` model: id, clubId (FK), email, role, token (unique), expiresAt, usedAt, createdAt
- [x] 2.14 Define `Notification` model: id, clubId (FK), userId (FK), type, title, body, resourceId, isRead, isDismissed, createdAt; index on (userId, isRead, createdAt)
- [x] 2.15 Define `FileRequest` model: id, clubId (FK), requesterId (FK), description, fulfilledFileId, fulfilledAt, createdAt
- [x] 2.16 Define `StructuralDrift` model: id, clubId, changeType, drivePath, driveId, resolved, resolution, createdAt
- [x] 2.17 Define `AccessRequest` model: id, userId, categoryId, status (default PENDING), resolvedBy, resolvedAt, createdAt
- [x] 2.18 Add database indexes on `FileMeta`: (clubId, categoryId), (clubId, name), (clubId, uploadedAt), (clubId, uploaderId); on `Category`: (clubId, parentId); on `Tag`: (name)
- [x] 2.19 Run `prisma migrate dev` to generate and apply the initial migration
- [x] 2.20 Create `server/src/prisma/seed.ts` with demo mode seed data: sample club, users, categories, files, tags

## Task 3: Authentication and Session Management (Req 1, 19)

- [x] 3.1 Install auth dependencies: `passport`, `passport-local`, `passport-google-oauth20`, `bcrypt`, `express-session`, `connect-pg-simple`, `csurf`, `zod`
- [x] 3.2 Configure `express-session` with `connect-pg-simple` store, 24-hour `maxAge`, `httpOnly`, `secure`, `sameSite: lax` cookie settings
- [x] 3.3 Implement Passport local strategy: validate email/password against `User` table using bcrypt compare
- [x] 3.4 Implement Passport Google OAuth strategy: handle new user creation, existing account linking, and pending invitation matching (Req 19)
- [x] 3.5 Create `POST /api/v1/auth/register` route: validate input with zod (email, password complexity, club name), hash password with bcrypt (cost 12), create Club + User (Admin role), create session
- [x] 3.6 Create `POST /api/v1/auth/login` route: authenticate via Passport local, create session, update `lastLoginAt`
- [x] 3.7 Create `GET /api/v1/auth/google` and `GET /api/v1/auth/google/callback` routes: initiate and handle Google OAuth flow
- [x] 3.8 Create `POST /api/v1/auth/logout` route: destroy session
- [x] 3.9 Create `GET /api/v1/auth/me` route: return current user profile, role, club info from session
- [x] 3.10 Create `auth` middleware: validate session exists and is not expired, attach user to request
- [x] 3.11 Create `requireRole(minimumRole)` middleware: check `roleLevel(user.role) >= roleLevel(minimumRole)`, return 403 if insufficient
- [x] 3.12 Create `validate(schema)` middleware: validate request body/query/params against a zod schema, return 400 with structured error on failure
- [x] 3.13 Configure CSRF protection via `csurf` middleware for all state-changing routes
- [x] 3.14 Write property-based test for P6 (Session Expiry Enforcement): generate random session ages, verify sessions older than 24 hours are rejected


## Task 4: Google Drive Connection (Req 2)

- [x] 4.1 Install `googleapis` npm package and create `server/src/services/driveConnector.ts` with a `DriveConnector` class
- [x] 4.2 Implement AES-256-GCM encryption/decryption utility for storing OAuth tokens at rest, using `ENCRYPTION_KEY` from environment
- [x] 4.3 Create `GET /api/v1/drive/connect` route (Admin only): generate Google OAuth URL with `https://www.googleapis.com/auth/drive` scope, redirect to Google consent screen
- [x] 4.4 Create `GET /api/v1/drive/callback` route (Admin only): exchange auth code for access + refresh tokens, encrypt and store on Club record, set `driveConnected = true`
- [x] 4.5 Create `POST /api/v1/drive/disconnect` route (Admin only): revoke tokens via Google API, clear token fields on Club, set `driveConnected = false`
- [x] 4.6 Create `GET /api/v1/drive/status` route (Admin only): return connection status, `lastSyncAt`, `driftUnresolvedCount`
- [ ] 4.7 Implement automatic token refresh in `DriveConnector`: before each Drive API call, check `driveTokenExpiry`, refresh if expired using the stored refresh token

## Task 5: Structure Analysis (Req 3)

- [x] 5.1 Create `server/src/services/structureAnalyzer.ts` with a `StructureAnalyzer` class
- [x] 5.2 Implement Drive traversal: use `drive.files.list` with pagination and parallel batch requests (batch size 100), collect folder hierarchy, file names, types, sizes, Drive File IDs, last modified dates
- [x] 5.3 Build in-memory tree from flat file list using `parents` field; handle permission errors (403/404) by skipping and logging inaccessible paths
- [x] 5.4 Create `POST /api/v1/structure/analyze` route (Admin only): start traversal as an async job, return job ID
- [x] 5.5 Create `GET /api/v1/structure/analyze/:jobId` route (Admin only): return job status (pending/running/complete/failed) and result
- [x] 5.6 On completion, store the structured representation in the Metadata Store: create `Category` records for folders, `FileMeta` records for files with `driveFileId` references
- [ ] 5.7 Write property-based test for P9 (Metadata-Only Storage): verify that after analysis, no `FileMeta` record contains binary content, only `driveFileId` references

## Task 6: AI Architecture Proposals (Req 4, 17)

- [x] 6.1 Create `server/src/services/geminiClient.ts`: shared Gemini API client wrapping Google AI Studio, supporting both Gemini 1.5 Pro and Gemini 1.5 Flash model selection
- [x] 6.2 Create `server/src/services/aiArchitect.ts` with an `AIArchitect` class
- [x] 6.3 Implement proposal generation: build Gemini prompt with structure JSON and club type context, call Gemini 1.5 Pro, parse response into 2-3 proposal objects (folder tree JSON + rationale + folder descriptions)
- [x] 6.4 Implement the three proposal types: PRESERVE (existing structure unchanged), REORGANIZE (cleaned-up hierarchy), FRESH (new structure based on club type patterns, only when structure is disorganized)
- [x] 6.5 Create `POST /api/v1/architecture/propose` route (Admin only): trigger proposal generation, store proposals in memory/cache keyed by club ID
- [ ] 6.6 Create `GET /api/v1/architecture/proposals` route (Admin only): return current proposals for the club

## Task 7: Architecture Review, Activation, and Management (Req 5, 6, 11)

- [x] 7.1 Create `server/src/services/architectureService.ts` with an `ArchitectureService` class
- [x] 7.2 Create `POST /api/v1/architecture/select` route (Admin only): select a proposal as the working draft, store as `ArchitectureVersion` with `isDraft = true`
- [x] 7.3 Create `PUT /api/v1/architecture/draft` route (Admin only): update the draft tree (rename, add, move, delete folders), return updated tree
- [x] 7.4 Create `GET /api/v1/architecture/draft/preview` route (Admin only): return the current draft tree for live preview
- [x] 7.5 Implement architecture activation in `ArchitectureService`: snapshot current active version, diff draft vs active, apply folder creates/renames/moves/deletes to Google Drive sequentially, halt on failure, update Metadata Store categories, mark new version as active
- [x] 7.6 Create `POST /api/v1/architecture/activate` route (Admin only): trigger activation, warn if deleting categories with files (Req 11 AC6), require confirmation
- [x] 7.7 Create `GET /api/v1/architecture/current` route (any authenticated user): return the active architecture tree
- [x] 7.8 Create `GET /api/v1/architecture/versions` route (Admin only): return last 10 architecture versions
- [x] 7.9 Implement rollback in `ArchitectureService`: restore a previous version's tree snapshot, apply changes to Drive, update Metadata Store
- [x] 7.10 Create `POST /api/v1/architecture/rollback/:versionId` route (Admin only): trigger rollback
- [x] 7.11 Implement file migration: Admin chooses move or copy, AI determines target category per file using Gemini 1.5 Flash, files with confidence < 50 go to "Unsorted", call Drive API `files.update` (move) or `files.copy` (copy), stream progress via SSE
- [x] 7.12 Create `POST /api/v1/architecture/migrate` route (Admin only): start migration job, return job ID
- [x] 7.13 Create `GET /api/v1/architecture/migrate/:jobId` route (Admin only): return migration progress and summary
- [ ] 7.14 Write property-based test for P3 (Architecture Version Monotonicity): generate sequences of activations, verify version numbers are strictly increasing


## Task 8: File Portal — Browsing and Viewing (Req 7, 8, 24, 25, 26, 27)

- [ ] 8.1 Create `filterByAccess` middleware: load user's role and `AccessGrant` records, filter out categories where `minimumRole > user.role` and no individual grant exists, return 403 for direct access violations
- [ ] 8.2 Create `GET /api/v1/portal/tree` route: return the folder tree filtered by the user's access permissions, include `lastUpdatedAt` and "New" badge status per folder
- [ ] 8.3 Create `GET /api/v1/portal/folder/:categoryId` route: return folder contents (subfolders + files with name, type, size, lastModified, uploader, tags), include `ancestors` array for breadcrumb (Req 25), apply access filtering
- [ ] 8.4 Create `GET /api/v1/portal/file/:fileId` route: return full file metadata including tags, AI summary, upload note, uploader attribution, routing explanation ("Why here?"), apply access check
- [ ] 8.5 Create `GET /api/v1/portal/file/:fileId/preview` route: proxy file content from Google Drive via `DriveConnector` using stored `driveFileId`, support PDF, images, Google Docs/Sheets/Slides export
- [ ] 8.6 Create `GET /api/v1/portal/file/:fileId/download` route: proxy file download from Google Drive, set appropriate `Content-Disposition` header
- [ ] 8.7 Create `POST /api/v1/portal/files/download` route: accept `{ fileIds: string[] }`, fetch each file from Drive, package as ZIP using `archiver`, stream to client
- [ ] 8.8 Create `GET /api/v1/portal/timeline` route: return files ordered by `uploadedAt DESC`, grouped by month (`DATE_TRUNC`), filtered by user access, support folder and tag filters (Req 27)
- [ ] 8.9 Create `GET /api/v1/portal/folder/:categoryId/hover` route: return top 5 most recently modified files and total file count for folder preview popover (Req 24), filtered by user access
- [ ] 8.10 Write property-based test for P1 (Role Hierarchy Enforcement): generate random users, roles, categories with minimumRole, and access grants; verify access decisions match the property

## Task 9: Upload Routing (Req 9, 10, 31, 33, 34, 35, 37, 40)

- [ ] 9.1 Create `server/src/services/uploadRouter.ts` with an `UploadRouter` class implementing the full routing pipeline
- [ ] 9.2 Implement duplicate detection (Req 35): query Metadata Store for files in target category with same filename and size within 5%, return warning payload if found
- [ ] 9.3 Implement AI rename suggestion (Req 37): send filename to Gemini 1.5 Flash, detect noise patterns ("final_FINAL_v3", "copy of", "untitled"), return suggested canonical name
- [ ] 9.4 Implement confidence scoring (Req 9): send file metadata + architecture tree to Gemini 1.5 Flash, parse response into array of `{ categoryId, score, explanation }`
- [ ] 9.5 Implement routing decision logic: auto-place if exactly one score >= 80, prompt user if multiple >= 80, prompt manual selection or suggest new category if none >= 80 (Req 10)
- [ ] 9.6 Implement new category suggestion (Req 10): generate suggested name and location via Gemini, include rationale; Mod suggestions require Admin approval (Req 10 AC5)
- [ ] 9.7 Implement file placement: upload to Drive via `DriveConnector`, create `FileMeta` record, store routing explanation ("Why here?" — Req 40), update category `lastUpdatedAt`
- [ ] 9.8 Create `POST /api/v1/upload/single` route (Admin, Mod): accept file upload + optional upload note (max 280 chars, Req 33), run through routing pipeline, return routing result
- [ ] 9.9 Create `POST /api/v1/upload/batch` route (Admin, Mod): accept multiple files, process each through pipeline, group into three tiers (auto-placed, needs selection, no match), return bulk review payload (Req 31)
- [ ] 9.10 Create `POST /api/v1/upload/drop/:categoryId` route (Admin, Mod): drag-and-drop upload bypassing routing, run only duplicate detection (Req 34)
- [ ] 9.11 Create `POST /api/v1/upload/route/:fileId/confirm` route (Admin, Mod): confirm or override a routing decision
- [ ] 9.12 Create `POST /api/v1/upload/route/:fileId/new-category` route (Admin, Mod): accept a new category suggestion, create folder in Drive, update architecture
- [ ] 9.13 Create `GET /api/v1/upload/history` route (any authenticated user): return paginated upload history for the current user with file name, date, category, status (Req 36)
- [ ] 9.14 Implement post-placement hooks: trigger auto-tag generation (Task 13), AI summary generation (Task 13), audit log entries (FILE_UPLOAD, FILE_PLACEMENT), notifications for favorited folders
- [ ] 9.15 Write property-based test for P4 (Placement Threshold Consistency): generate random confidence score arrays, verify auto-placement only occurs when exactly one score >= 80
- [ ] 9.16 Write property-based test for P8 (Duplicate Detection Consistency): generate file placements with potential duplicates, verify warning is always shown when duplicate exists

## Task 10: Search (Req 7, 28, 29, 30)

- [x] 10.1 Create `server/src/services/searchService.ts` with a `SearchService` class
- [x] 10.2 Implement standard search: query Metadata Store using `ILIKE` on file name, folder name, and tag name; apply filters (type, folder, date range, uploader, tag) as additional WHERE clauses; filter by user access permissions
- [x] 10.3 Create `GET /api/v1/search` route: accept query params `q`, `type`, `folder`, `dateFrom`, `dateTo`, `uploader`, `tag`; return results with file name, folder path, type, lastModified, tags within 3 seconds
- [x] 10.4 Implement semantic search (Req 29): when standard search returns < 3 results or user toggles semantic mode, send query + file metadata to Gemini 1.5 Flash, return ranked results labeled as "AI-assisted"
- [x] 10.5 Create `GET /api/v1/search/semantic` route: accept query, return AI-ranked results
- [x] 10.6 Implement similar files (Req 30): compare target file's tags, folder path, and AI summary against all files using Gemini 1.5 Flash, return up to 5 matches filtered by user access, cache results for 1 hour
- [x] 10.7 Create `GET /api/v1/portal/file/:fileId/similar` route: return similar files for "Files Like This" sidebar

## Task 11: User and Role Management (Req 12, 13, 44)

- [x] 11.1 Create `server/src/services/userService.ts` with a `UserService` class
- [x] 11.2 Create `GET /api/v1/users` route (Admin only): list all users in the club with role, email, lastLoginAt
- [x] 11.3 Implement invitation flow: generate UUID token, create `Invitation` record with 72-hour expiry, send email via SendGrid/Nodemailer with link `{baseUrl}/invite/{token}`
- [x] 11.4 Create `POST /api/v1/users/invite` route (Admin only): validate email + role, create invitation, send email
- [x] 11.5 Create invitation acceptance handler: validate token not expired and not used, show registration form, create user with assigned role, mark invitation as used
- [x] 11.6 Implement last admin protection: before any role change or user removal, check `COUNT(*) FROM users WHERE clubId = ? AND role = 'ADMIN'`, reject if count would drop to 0
- [x] 11.7 Create `PUT /api/v1/users/:userId/role` route (Admin only): change user's role (cannot change own role), enforce last admin protection
- [x] 11.8 Create `DELETE /api/v1/users/:userId` route (Admin only): remove user, revoke their session, enforce last admin protection
- [x] 11.9 Create `PUT /api/v1/categories/:categoryId/minimum-role` route (Admin only): set minimum role for a category
- [x] 11.10 Create `POST /api/v1/categories/:categoryId/access` route (Admin only): grant individual access to a specific user
- [x] 11.11 Create `DELETE /api/v1/categories/:categoryId/access/:userId` route (Admin only): revoke individual access, immediately effective
- [x] 11.12 Create `POST /api/v1/access-requests` route (Mod, Member): submit access request for a restricted category
- [x] 11.13 Create `PUT /api/v1/access-requests/:requestId` route (Admin only): approve (grant access + notify requester) or deny (notify requester)
- [ ] 11.14 Write property-based test for P2 (Last Admin Invariant): generate sequences of role changes and user removals, verify admin count never drops to 0
- [ ] 11.15 Write property-based test for P7 (Invitation Token Expiry): generate invitations with various ages, verify expired tokens are always rejected
- [ ] 11.16 Write property-based test for P14 (Access Grant Symmetry): generate access grant/revoke sequences, verify access is immediately revoked after removal


## Task 12: Notifications and Real-Time (Req 45, 22)

- [x] 12.1 Create `server/src/services/notificationService.ts` with a `NotificationService` class
- [x] 12.2 Implement notification creation: create `Notification` record, push to user's SSE connection if active
- [x] 12.3 Implement SSE infrastructure: create `GET /api/v1/notifications/stream` endpoint that holds open an SSE connection per authenticated user, manage connection pool
- [x] 12.4 Create `GET /api/v1/notifications` route (any authenticated user): return notifications for the current user, filtered by role-appropriate types
- [x] 12.5 Create `PUT /api/v1/notifications/:id/read` route: mark notification as read
- [x] 12.6 Create `DELETE /api/v1/notifications/:id` route: dismiss notification
- [x] 12.7 Implement Activity Feed SSE: create `GET /api/v1/activity/stream` endpoint for real-time activity feed updates
- [x] 12.8 Create `GET /api/v1/activity/feed` route: return last 20 activity entries (file uploads, placements, architecture changes, member joins) from audit log

## Task 13: AI Features — Tags, Summaries, Descriptions, Reorganization, Smart Naming (Req 21, 38, 39, 41, 42)

- [x] 13.1 Create `server/src/services/aiTagService.ts`: on file creation, send file name, type, and folder path to Gemini 1.5 Flash, generate up to 5 tags, store in Metadata Store
- [x] 13.2 Create `server/src/services/aiSummaryService.ts`: for supported types (PDF, Google Docs, Slides, plain text) under 10MB, extract first 5,000 chars of content, send to Gemini 1.5 Flash, store one-sentence summary in `FileMeta.aiSummary`
- [x] 13.3 Implement folder description generation in `aiArchitect.ts`: when a category is created, generate one-sentence description via Gemini 1.5 Flash based on folder name and hierarchy position, store in `Category.description`
- [x] 13.4 Implement re-organization suggestions (Req 41): analyze full architecture tree + recent placements + Unsorted files via Gemini 1.5 Pro, return structured plan (files to relocate, folders to merge/rename, new categories)
- [x] 13.5 Implement auto-trigger for re-organization: when Unsorted folder exceeds 10 files, automatically trigger analysis and surface suggestions to Admin
- [x] 13.6 Create `GET /api/v1/ai/reorganize` route (Admin only): trigger on-demand re-organization analysis
- [ ] 13.7 Create `GET /api/v1/ai/reorganize/suggestions` route (Admin only): return current suggestions
- [ ] 13.8 Create `PUT /api/v1/ai/reorganize/suggestions/:id` route (Admin only): accept or dismiss individual suggestions
- [x] 13.9 Implement Smart Folder Naming (Req 42): send proposed category name + existing naming patterns to Gemini 1.5 Flash, return normalized suggestion if name deviates
- [x] 13.10 Create `POST /api/v1/ai/smart-name` route (Admin, Mod): check a proposed category name, return suggestion if applicable
- [x] 13.11 Create `POST /api/v1/ai/tags/:fileId` route (Admin, Mod): regenerate auto-tags for a file
- [x] 13.12 Create `PUT /api/v1/ai/tags/:fileId` route (Admin, Mod): manually add or remove tags
- [ ] 13.13 Write property-based test for P12 (Tag Cardinality): generate tag creation sequences, verify auto-generated tag count never exceeds 5 per file

## Task 14: Audit Logging (Req 14)

- [x] 14.1 Create `server/src/services/auditService.ts` with an `AuditService` class and `logAction(clubId, userId, action, resourceType, resourceId, details)` method
- [x] 14.2 Create `server/src/middleware/auditLog.ts`: reusable middleware/helper that services call after significant actions (login, invite, role change, file upload, file placement, category CRUD, architecture activation, rollback)
- [x] 14.3 Create `GET /api/v1/audit-logs` route (Admin only): accept filters `action`, `userId`, `from`, `to`, `page`; return paginated results within 3 seconds
- [x] 14.4 Create `server/src/jobs/auditCleanup.ts`: scheduled job (weekly) to delete audit log entries older than 12 months
- [ ] 14.5 Write property-based test for P10 (Audit Log Completeness): generate sequences of significant actions, verify a matching AuditLog record exists for each

## Task 15: Drive Sync and Change Detection (Req 15)

- [ ] 15.1 Create `server/src/services/driveSyncService.ts` with a `DriveSyncService` class
- [ ] 15.2 Implement webhook registration: call `changes.watch` with club's `pageToken`, store `channelId`, `resourceId`, `expiry` on Club record
- [ ] 15.3 Create `POST /api/v1/drive/webhook` route (no auth, verified by channel ID): receive Google Drive change notifications
- [ ] 15.4 Implement change processing pipeline: fetch delta via `changes.list` with stored `pageToken`, process each change type (file added → Unmanaged File, file deleted → remove from Metadata Store, file moved/renamed → update path, folder created → StructuralDrift, folder deleted → StructuralDrift + mark files as Unmanaged)
- [ ] 15.5 For Unmanaged Files: trigger Upload Router to suggest category, surface in Admin notification center with suggested category and confidence score
- [ ] 15.6 Create `GET /api/v1/drive/drift` route (Admin only): return unresolved structural drift items
- [ ] 15.7 Create `PUT /api/v1/drive/drift/:id` route (Admin only): resolve drift item (accept → update Metadata Store and architecture, ignore → dismiss)
- [ ] 15.8 Create `server/src/jobs/webhookRenewal.ts`: cron job running hourly, re-register webhooks for clubs where `webhookExpiry - now() < 1 hour` (23-hour cycle)
- [ ] 15.9 Implement webhook failure handling: log failure, alert Admin via Drive Sync Status indicator, retry on next cycle
- [ ] 15.10 Write property-based test for P13 (Webhook Continuity): generate webhook lifecycle sequences, verify expiry is always > 1 hour in the future or re-registration is in progress

## Task 16: Setup Wizard, Demo Mode, and Club Type (Req 16, 17, 18)

- [ ] 16.1 Create `GET /api/v1/setup/status` route (Admin only): return current setup step (0-4) and completion state per step
- [ ] 16.2 Implement setup step progression: Connect Drive (0→1), Analyze Structure (1→2), Approve Architecture (2→3), Invite Team (3→4); enforce sequential unlocking
- [ ] 16.3 Create `PUT /api/v1/setup/club-type` route (Admin only): set club type on Club record for AI context during architecture proposals
- [ ] 16.4 Create `server/src/services/demoService.ts`: clone pre-seeded demo data into a temporary club with `demoMode = true`
- [ ] 16.5 Create `server/src/middleware/demoGuard.ts`: intercept all `DriveConnector` calls when `club.demoMode = true`, return mock responses instead of calling real Drive API
- [ ] 16.6 Create `POST /api/v1/demo/start` route (no auth required): enter demo mode, create sandboxed session with sample data
- [ ] 16.7 Create `GET /api/v1/demo/status` route: check if current session is in demo mode
- [ ] 16.8 Create `server/src/jobs/demoCleanup.ts`: scheduled job to clean up demo club data after 24 hours of inactivity
- [ ] 16.9 Write property-based test for P11 (Demo Mode Isolation): generate sequences of Drive operations in demo mode, verify none reach the real Drive API


## Task 17: Favorites, Quick Access, and File Requests (Req 20, 23, 43)

- [ ] 17.1 Create `POST /api/v1/favorites/:fileId` route (any authenticated user): add file to favorites after verifying user has access to the file
- [ ] 17.2 Create `DELETE /api/v1/favorites/:fileId` route: remove file from favorites
- [ ] 17.3 Create `GET /api/v1/favorites` route: return current user's favorited files, filtered to only include files the user still has permission to view
- [ ] 17.4 Create `POST /api/v1/quick-access/:fileId` route (Admin only): pin file to Quick Access, enforce max 10 limit (return 400 if exceeded)
- [ ] 17.5 Create `DELETE /api/v1/quick-access/:fileId` route (Admin only): unpin file from Quick Access
- [ ] 17.6 Create `GET /api/v1/quick-access` route (any authenticated user): return Quick Access files with name, type, containing folder; apply role-based permission checks
- [ ] 17.7 Create `POST /api/v1/file-requests` route (Member only): submit a file request with description
- [ ] 17.8 Create `GET /api/v1/file-requests` route (Admin, Mod): list open file requests
- [ ] 17.9 Create `PUT /api/v1/file-requests/:id/fulfill` route (Admin, Mod): link an uploaded file to a request, notify the requesting member
- [ ] 17.10 Write property-based test for P5 (Quick Access Cardinality): generate sequences of pin/unpin operations, verify count never exceeds 10
- [ ] 17.11 Write property-based test for P15 (Favorite Permission Consistency): generate favorite + access revocation sequences, verify revoked files are excluded from favorites list

## Task 18: Frontend — Core Shell, Auth, and Routing

- [x] 18.1 Create `AuthContext` and `AuthProvider`: manage session state, expose `user`, `role`, `club`, `login()`, `logout()`, `isAuthenticated`
- [x] 18.2 Create `ThemeContext` and `ThemeProvider`: manage dark mode toggle, apply `dark` class to root `<html>` element, persist preference via API
- [x] 18.3 Create `DemoContext`: track demo mode state, provide `isDemoMode` flag to all components
- [x] 18.4 Set up React Router v6 with public routes (`/login`, `/register`, `/invite/:token`, `/demo`) and protected routes (all others) with auth guard
- [x] 18.5 Create `AppLayout` component: sidebar (folder tree, Quick Access, Favorites), top bar (search input, notification bell, user menu), main content area
- [x] 18.6 Create `LoginPage` component: email/password form + "Sign in with Google" button
- [x] 18.7 Create `RegisterPage` component: email, password, club name form + "Sign up with Google" button
- [x] 18.8 Create `InvitationPage` component: validate token, show registration form with pre-assigned role
- [x] 18.9 Create `DemoBanner` component: persistent banner on all pages when in demo mode
- [x] 18.10 Create `UserMenu` component: dropdown with user name, role, settings link, dark mode toggle, logout
- [x] 18.11 Set up TanStack Query (React Query) provider with default stale times and error handling

## Task 19: Frontend — File Portal, Upload, Search, and Admin Features

- [ ] 19.1 Create `FolderTree` component: recursive tree rendering categories, last-updated indicators, "New" badges, click to navigate
- [x] 19.2 Create `Breadcrumb` component: render ancestor chain as clickable links based on folder's `ancestors` array
- [x] 19.3 Create `FolderView` component: display folder contents (subfolders + files) with name, type, size, lastModified, uploader attribution
- [x] 19.4 Create `FolderPreviewPopover` component: triggered on 300ms hover, shows top 5 recent files + total count, dismissed on cursor leave
- [x] 19.5 Create `FileDetailView` component: file preview (inline for supported types via iframe/pdf.js), metadata, uploader attribution, upload note, AI summary, tags, "Why here?" tooltip, "Files Like This" sidebar
- [x] 19.6 Create `TimelineView` component: files in reverse chronological order grouped by month, folder and tag filters
- [x] 19.7 Create `UploadFlow` component: file picker with drag-and-drop zone, optional upload note input (280 char limit), progress bar
- [x] 19.8 Create `RoutingResultScreen` component: show auto-placement result, rename suggestion, duplicate warning, confirm/override actions
- [x] 19.9 Create `BulkRoutingReview` component: three-tier grouping (auto-placed, needs selection, no match) for batch uploads
- [x] 19.10 Create `DragDropZone` component: overlay on folder views accepting dragged files, triggers direct upload to that folder
- [x] 19.11 Create `SearchInput` component: search bar with 2-character minimum, semantic search toggle
- [x] 19.12 Create `SearchResults` component: results list with file name, folder path, type, lastModified, tags; filter chips (type, folder, date range, uploader, tag); client-side filter application
- [x] 19.13 Create `UploadHistoryPage` component: paginated list of user's uploads with file name, date, category, status
- [x] 19.14 Create `ArchitectureEditor` component: drag-and-drop tree editor, inline rename with Smart Folder Naming, draft mode indicator, "Activate" button, version history sidebar, rollback option, per-folder access control settings
- [x] 19.15 Create `UserManagement` component: user list, invite form (email + role), role change dropdown, remove user button, last admin protection UI feedback
- [x] 19.16 Create `AuditLogView` component: filterable log table (action type, user, date range), paginated
- [x] 19.17 Create `DriveSyncPanel` component: Drive Sync Status indicator (last sync time, drift count), unresolved drift items list with accept/ignore actions

## Task 20: Frontend — Dashboard, Notifications, Settings, and Remaining Features

- [x] 20.1 Create `Dashboard` component: Activity Feed (last 20 actions with real-time SSE updates), setup wizard (if incomplete), Quick Access section
- [x] 20.2 Create `ActivityFeed` component: display action type, user, affected resource, timestamp; real-time updates via SSE connection to `/activity/stream`
- [x] 20.3 Create `ClubActivityDashboard` component (Admin only): total files, uploads last 30 days, top 3 uploaders, unresolved items count; omit zero-value widgets
- [x] 20.4 Create `NotificationBell` component: bell icon with unread count badge
- [x] 20.5 Create `NotificationCenter` component: dropdown panel listing notifications with type icon, title, body, timestamp, read/dismiss actions; real-time updates via SSE
- [x] 20.6 Create `SetupWizard` component: four-step stepper (Connect Drive, Analyze Structure, Approve Architecture, Invite Team), locked progression, progress indicator, club type selector in step 3
- [x] 20.7 Create `FirstLoginOrientation` component: spotlight overlay highlighting folder tree, search bar, Quick Access; auto-dismiss after 20 seconds or on click; shown once per user
- [x] 20.8 Create `UserSettings` component: dark mode toggle, profile info display
- [x] 20.9 Create `NewBadge` component: "New" indicator on files/folders added/modified since user's last login, visible for up to 7 days, dismissed on view
- [ ] 20.10 Create `GET /api/v1/portal/new-badges` route: return file/folder IDs with "New" badge status for the current user based on `lastLoginAt`
- [ ] 20.11 Create `GET /api/v1/dashboard/admin` route (Admin only): return Club Activity Dashboard metrics (total files, uploads last 30 days, top uploaders, unresolved items)


## Task 21: Rate Limiting, Error Handling, and Security Hardening

- [ ] 21.1 Install and configure `express-rate-limit`: 100 requests/minute per authenticated user, 20 requests/minute for unauthenticated endpoints
- [ ] 21.2 Add AI-specific rate limiting for Gemini API endpoints to stay within Google AI Studio free tier quotas
- [ ] 21.3 Implement consistent API error response format: `{ error: { code, message, details } }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 502, 503)
- [ ] 21.4 Implement graceful degradation: if Gemini API unavailable, fall back to manual routing/no suggestions; if Drive API unavailable, serve cached metadata with "temporarily unavailable" for preview/download
- [ ] 21.5 Add input sanitization for upload notes (XSS prevention) and search queries (SQL injection prevention via parameterized queries)
- [ ] 21.6 Enforce file upload size limit of 100MB per file at the Express layer
- [ ] 21.7 Add `helmet` middleware for security headers
- [ ] 21.8 Verify all file access endpoints (preview, download, bulk download) pass through permission checks before proxying from Drive

## Task 22: Integration Testing and Final Verification

- [ ] 22.1 Write integration tests for the auth flow: register, login, Google OAuth, session expiry, logout
- [ ] 22.2 Write integration tests for the Drive connection flow: connect, disconnect, token refresh
- [ ] 22.3 Write integration tests for the architecture lifecycle: analyze → propose → select → edit draft → activate → rollback
- [ ] 22.4 Write integration tests for the upload routing pipeline: single upload, batch upload, drag-and-drop, duplicate detection, new category suggestion
- [ ] 22.5 Write integration tests for permission enforcement: role-based access, folder-level access, access grants, access requests
- [ ] 22.6 Write integration tests for the notification system: creation, SSE delivery, read/dismiss
- [ ] 22.7 Write integration tests for Drive Sync: webhook processing, structural drift detection and resolution
- [ ] 22.8 Write integration tests for Demo Mode: enter demo, verify no real Drive calls, verify full feature access
- [ ] 22.9 Run all property-based tests (P1–P15) and verify all pass
- [ ] 22.10 Run full test suite, fix any failures, verify build completes cleanly
