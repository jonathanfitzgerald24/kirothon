# Technical Design Document — IntakeFlow

## 1. Introduction

IntakeFlow is an AI-powered file organization and access platform for college clubs, built on top of Google Drive. This document describes the technical architecture, data models, API surface, component design, and AI integration strategy required to implement the 50 requirements defined in the requirements document.

### 1.1 Design Principles

- **Metadata-only local storage**: File binaries never leave Google Drive. IntakeFlow stores only metadata, folder structure, permissions, and AI-generated annotations.
- **Drive as source of truth for content**: The Metadata Store is authoritative for structure and permissions; Google Drive is authoritative for file content.
- **AI-assisted, human-approved**: Every AI action (architecture proposals, upload routing, rename suggestions) is surfaced for user review before permanent changes are made.
- **Role-based access at every layer**: Permissions are enforced in the API layer, not just the UI.

### 1.2 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18 + TypeScript | Component-based UI, strong typing, large ecosystem |
| UI Framework | Tailwind CSS + shadcn/ui | Utility-first styling with accessible, themeable components (supports dark mode) |
| State Management | TanStack Query (React Query) | Server-state caching, background refetching, optimistic updates |
| Routing | React Router v6 | Standard SPA routing with nested layouts |
| Backend | Node.js + Express + TypeScript | Shared language with frontend, async I/O for Drive API calls |
| Database | PostgreSQL 16 | Relational integrity for folder trees, roles, audit logs; JSONB for flexible metadata |
| ORM | Prisma | Type-safe queries, migrations, schema-as-code |
| Auth | Passport.js (local + Google OAuth 2.0) | Dual auth strategy per Req 1 and Req 19 |
| Session | express-session + connect-pg-simple | Server-side sessions stored in PostgreSQL, 24-hour idle timeout |
| AI | Google AI Studio (Gemini API) | Gemini 1.5 Pro for architecture proposals; Gemini 1.5 Flash for upload routing, summaries, tags |
| Google Drive | googleapis npm package | Official Google API client for Drive v3 |
| File Preview | Google Drive embed URLs + pdf.js | Inline preview for supported types |
| Real-time | Server-Sent Events (SSE) | Activity feed live updates, notification delivery |
| Email | Nodemailer + SendGrid | Invitation emails with time-limited links |
| Bundler | Vite | Fast dev builds, optimized production bundles |
| Testing | Vitest + React Testing Library + fast-check | Unit, integration, and property-based testing |

---

## 2. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │File Portal│ │Setup     │ │Admin     │ │Notification Center│  │
│  │          │ │Wizard    │ │Dashboard │ │                   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / SSE
┌────────────────────────────┴────────────────────────────────────┐
│                     API Gateway (Express)                       │
│  ┌────────┐ ┌────────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │Auth    │ │Role        │ │Rate      │ │Audit Logging      │  │
│  │Middleware│ │Middleware  │ │Limiter   │ │Middleware         │  │
│  └────────┘ └────────────┘ └──────────┘ └───────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Service Layer                              │
│  ┌──────────────┐ ┌───────────────┐ ┌─────────────────────┐    │
│  │Drive         │ │Structure      │ │Upload Router        │    │
│  │Connector     │ │Analyzer       │ │Service              │    │
│  └──────────────┘ └───────────────┘ └─────────────────────┘    │
│  ┌──────────────┐ ┌───────────────┐ ┌─────────────────────┐    │
│  │AI Architect  │ │Architecture   │ │User & Role          │    │
│  │Service       │ │Service        │ │Service              │    │
│  └──────────────┘ └───────────────┘ └─────────────────────┘    │
│  ┌──────────────┐ ┌───────────────┐ ┌─────────────────────┐    │
│  │Notification  │ │Search         │ │Demo Mode            │    │
│  │Service       │ │Service        │ │Service              │    │
│  └──────────────┘ └───────────────┘ └─────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
   ┌──────────┴──────────┐    ┌─────────────┴─────────────┐
   │  PostgreSQL          │    │  Google Drive API (v3)     │
   │  (Metadata Store)    │    │  + Gemini API              │
   └──────────────────────┘    └───────────────────────────┘
```


---

## 3. Data Models (Prisma Schema)

### 3.1 Core Entities

```prisma
enum Role {
  ADMIN
  MOD
  MEMBER
}

enum PlacementStatus {
  PLACED
  PENDING
  FAILED
  UNSORTED
}

model Club {
  id                  String   @id @default(uuid())
  name                String
  clubType            String?  // greek_life | sports_team | academic_club | arts | professional | general
  driveConnected      Boolean  @default(false)
  driveAccessToken    String?  // encrypted
  driveRefreshToken   String?  // encrypted
  driveTokenExpiry    DateTime?
  webhookChannelId    String?
  webhookResourceId   String?
  webhookExpiry       DateTime?
  drivePageToken      String?  // for Changes API delta sync
  setupStep           Int      @default(0) // 0-4 for Guided Setup Wizard
  demoMode            Boolean  @default(false)
  lastSyncAt          DateTime?
  driftUnresolvedCount Int     @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  users               User[]
  architectureVersions ArchitectureVersion[]
  categories          Category[]
  files               FileMeta[]
  auditLogs           AuditLog[]
  invitations         Invitation[]
  notifications       Notification[]
  fileRequests        FileRequest[]
  quickAccessFiles    QuickAccessFile[]
}

model User {
  id                  String   @id @default(uuid())
  email               String   @unique
  passwordHash        String?  // null for Google OAuth-only users
  googleId            String?  @unique
  displayName         String
  role                Role
  clubId              String
  club                Club     @relation(fields: [clubId], references: [id])
  darkMode            Boolean  @default(false)
  firstLoginComplete  Boolean  @default(false)
  lastLoginAt         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  uploadedFiles       FileMeta[]   @relation("Uploader")
  favorites           Favorite[]
  accessGrants        AccessGrant[]
  auditLogs           AuditLog[]
  notifications       Notification[]
  fileRequests        FileRequest[]
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  data        Json
  expiresAt   DateTime // 24-hour idle timeout
  createdAt   DateTime @default(now())
}
```

### 3.2 Architecture and Folder Structure

```prisma
model ArchitectureVersion {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id])
  version     Int
  treeSnapshot Json    // full folder tree at time of activation
  isActive    Boolean  @default(false)
  isDraft     Boolean  @default(false)
  activatedAt DateTime?
  createdAt   DateTime @default(now())
}

model Category {
  id              String   @id @default(uuid())
  clubId          String
  club            Club     @relation(fields: [clubId], references: [id])
  name            String
  parentId        String?
  parent          Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children        Category[] @relation("CategoryTree")
  driveFolderId   String?
  description     String?  // AI-generated folder description
  minimumRole     Role     @default(MEMBER)
  sortOrder       Int      @default(0)
  lastUpdatedAt   DateTime @default(now()) // most recent file change in subtree
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  files           FileMeta[]
  accessGrants    AccessGrant[]
}

model AccessGrant {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([userId, categoryId])
}
```

### 3.3 File Metadata

```prisma
model FileMeta {
  id              String          @id @default(uuid())
  clubId          String
  club            Club            @relation(fields: [clubId], references: [id])
  categoryId      String?
  category        Category?       @relation(fields: [categoryId], references: [id])
  driveFileId     String
  name            String
  mimeType        String
  sizeBytes       BigInt
  uploaderId      String?
  uploader        User?           @relation("Uploader", fields: [uploaderId], references: [id])
  placementStatus PlacementStatus @default(PLACED)
  confidenceScore Int?
  routingExplanation String?      // "Why here?" text
  aiSummary       String?
  uploadNote      String?         @db.VarChar(280)
  isUnmanaged     Boolean         @default(false)
  driveLastModified DateTime?
  uploadedAt      DateTime        @default(now())
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  tags            Tag[]
  favorites       Favorite[]
  quickAccess     QuickAccessFile?
}

model Tag {
  id        String   @id @default(uuid())
  name      String
  fileId    String
  file      FileMeta @relation(fields: [fileId], references: [id], onDelete: Cascade)
  autoGen   Boolean  @default(true) // true = AI-generated, false = manual
  createdAt DateTime @default(now())

  @@unique([fileId, name])
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  fileId    String
  file      FileMeta @relation(fields: [fileId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, fileId])
}

model QuickAccessFile {
  id        String   @id @default(uuid())
  clubId    String
  fileId    String   @unique
  file      FileMeta @relation(fields: [fileId], references: [id], onDelete: Cascade)
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}
```

### 3.4 Supporting Entities

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id])
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  action      String   // LOGIN, INVITE, ROLE_CHANGE, FILE_UPLOAD, FILE_PLACEMENT, CATEGORY_CREATE, CATEGORY_RENAME, CATEGORY_DELETE, ARCHITECTURE_ACTIVATE, ROLLBACK
  resourceType String?
  resourceId  String?
  details     Json?
  createdAt   DateTime @default(now())

  @@index([clubId, createdAt])
  @@index([clubId, action])
  @@index([clubId, userId])
}

model Invitation {
  id        String   @id @default(uuid())
  clubId    String
  club      Club     @relation(fields: [clubId], references: [id])
  email     String
  role      Role
  token     String   @unique
  expiresAt DateTime // 72 hours from creation
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

model Notification {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String   // FILE_REQUEST, CATEGORY_APPROVAL, DRIFT_ALERT, ACCESS_REQUEST, FILE_ADDED, REQUEST_FULFILLED, ACCESS_DENIED
  title       String
  body        String?
  resourceId  String?
  isRead      Boolean  @default(false)
  isDismissed Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([userId, isRead, createdAt])
}

model FileRequest {
  id          String   @id @default(uuid())
  clubId      String
  club        Club     @relation(fields: [clubId], references: [id])
  requesterId String
  requester   User     @relation(fields: [requesterId], references: [id])
  description String
  fulfilledFileId String?
  fulfilledAt DateTime?
  createdAt   DateTime @default(now())
}

model StructuralDrift {
  id          String   @id @default(uuid())
  clubId      String
  changeType  String   // FOLDER_CREATED, FOLDER_DELETED, FILE_ADDED, FILE_DELETED, FILE_MOVED, FILE_RENAMED
  drivePath   String
  driveId     String?
  resolved    Boolean  @default(false)
  resolution  String?  // ACCEPTED, IGNORED
  createdAt   DateTime @default(now())
}

model AccessRequest {
  id          String   @id @default(uuid())
  userId      String
  categoryId  String
  status      String   @default("PENDING") // PENDING, APPROVED, DENIED
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime @default(now())
}
```


---

## 4. API Design

All endpoints are prefixed with `/api/v1`. Authentication is required unless noted. Role enforcement is handled by middleware.

### 4.1 Authentication (Req 1, 19)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register with email, password, club name. Creates club + admin user. |
| POST | `/auth/login` | None | Email/password login. Returns session cookie. |
| GET | `/auth/google` | None | Initiates Google OAuth flow (redirect to Google consent). |
| GET | `/auth/google/callback` | None | Google OAuth callback. Creates or links account, creates session. |
| POST | `/auth/logout` | Session | Destroys session. |
| GET | `/auth/me` | Session | Returns current user profile, role, club info. |

**Session behavior**: Server-side sessions stored in PostgreSQL via `connect-pg-simple`. 24-hour idle timeout. Session cookie is `httpOnly`, `secure`, `sameSite: lax`.

**Google OAuth account linking** (Req 19):
- If Google email matches a pending invitation → create account with invited role.
- If Google email matches an existing account → log into that account.
- If no match → create new account (new club, Admin role).

### 4.2 Google Drive Connection (Req 2)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/drive/connect` | Admin | Initiates Drive OAuth flow (separate from login OAuth). |
| GET | `/drive/callback` | Admin | Exchanges auth code for tokens, stores encrypted. |
| POST | `/drive/disconnect` | Admin | Revokes tokens, clears Drive connection. |
| GET | `/drive/status` | Admin | Returns connection status, last sync time, drift count. |

**Token storage**: Access and refresh tokens are encrypted at rest using AES-256-GCM with a server-side key. The Drive OAuth scope requests `https://www.googleapis.com/auth/drive` for full read/write.

### 4.3 Structure Analysis (Req 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/structure/analyze` | Admin | Triggers Drive traversal. Returns job ID. |
| GET | `/structure/analyze/:jobId` | Admin | Polls analysis status and result. |

**Traversal algorithm**:
1. Use `drive.files.list` with `fields: id, name, mimeType, size, modifiedTime, parents` and pagination.
2. Build an in-memory tree from the flat list using `parents` field.
3. Store the tree representation in the Metadata Store (categories + file metadata).
4. Skip items that return 403/404 — log to `inaccessible_paths` array in the job result.
5. Target: complete within 60 seconds for up to 10,000 files. Use parallel batch requests (batch size 100) to the Drive API.

### 4.4 AI Architecture Proposals (Req 4, 5, 17)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/architecture/propose` | Admin | Generates 2-3 proposals from analyzed structure. |
| GET | `/architecture/proposals` | Admin | Returns current proposals for review. |
| POST | `/architecture/select` | Admin | Selects a proposal as the working draft. |
| PUT | `/architecture/draft` | Admin | Updates the selected draft (rename, add, move, delete folders). |
| GET | `/architecture/draft/preview` | Admin | Returns live preview of current draft tree. |
| POST | `/architecture/activate` | Admin | Activates the draft → applies to Drive. |

**Gemini prompt strategy for proposals** (Req 4, 17):

```
System: You are an expert file organization assistant for college clubs.
You will receive a JSON representation of a Google Drive folder structure
including folder names, file names, file types, and file counts.

Generate exactly {2 or 3} architecture proposals:
1. PRESERVE: Keep the existing structure unchanged.
2. REORGANIZE: Clean up the existing structure into a consistent hierarchy.
{3. FRESH (only if structure is disorganized): Create a new structure
   using common patterns for a {clubType} organization.}

For each proposal, return:
- A folder tree as nested JSON
- A brief rationale (2-3 sentences)
- A folder description for each top-level folder

Club type context: {clubType or "not specified"}

Input structure:
{structureJSON}
```

Model: **Gemini 1.5 Pro** (low frequency, high complexity).


### 4.5 Architecture Management (Req 5, 6, 11)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/architecture/current` | Any | Returns the active architecture tree. |
| GET | `/architecture/versions` | Admin | Returns last 10 architecture versions. |
| POST | `/architecture/rollback/:versionId` | Admin | Rolls back to a previous version. |
| POST | `/architecture/migrate` | Admin | Starts file migration (move or copy). |
| GET | `/architecture/migrate/:jobId` | Admin | Polls migration progress. |

**Architecture activation flow** (Req 5):
1. Admin confirms the Structure Draft.
2. System snapshots the current architecture as a new `ArchitectureVersion`.
3. System diffs the draft against the current active tree to determine folder creates, renames, moves, and deletes.
4. System applies changes to Google Drive sequentially. On any failure, halt and report the specific folder that failed.
5. Update the Metadata Store categories to match the new tree.
6. Mark the new version as active.
7. Log `ARCHITECTURE_ACTIVATE` audit event.

**File migration** (Req 6):
1. Admin chooses `move` or `copy` mode.
2. For each file in the old structure, the AI Architect (Gemini 1.5 Flash) determines the best target category using filename, type, and old folder path.
3. Files with confidence < 50 go to the "Unsorted" category.
4. Drive API `files.update` (move) or `files.copy` (copy) is called for each file.
5. Progress is streamed via SSE to the client.
6. Summary returned on completion: total migrated, unsorted count, error count.

### 4.6 File Portal — Browsing and Viewing (Req 7, 8, 24, 25, 26, 27)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/portal/tree` | Any | Returns the folder tree filtered by user's role/access. |
| GET | `/portal/folder/:categoryId` | Any | Returns folder contents (subfolders + files) with metadata. |
| GET | `/portal/file/:fileId` | Any | Returns file metadata, tags, AI summary, upload note, uploader info. |
| GET | `/portal/file/:fileId/preview` | Any | Proxies file content from Drive for inline preview. |
| GET | `/portal/file/:fileId/download` | Any | Proxies file download from Drive. |
| POST | `/portal/files/download` | Any | Bulk download as ZIP. Body: `{ fileIds: string[] }`. |
| GET | `/portal/timeline` | Any | Returns files in reverse chronological order, grouped by month. |
| GET | `/portal/folder/:categoryId/hover` | Any | Returns top 5 recent files + total count for folder preview popover. |

**Permission filtering** (Req 7, 13):
All portal endpoints pass through a `filterByAccess` middleware that:
1. Loads the user's role and any `AccessGrant` records.
2. Filters out categories where `category.minimumRole > user.role` AND no individual `AccessGrant` exists.
3. Returns 403 for direct file/folder access attempts that fail the check.

**Breadcrumb** (Req 25): The `/portal/folder/:categoryId` response includes an `ancestors` array built by walking `parentId` up to root.

**Last updated indicator** (Req 26): Each category stores `lastUpdatedAt`, which is updated via a database trigger whenever a file in its subtree is created or modified.

**Timeline view** (Req 27): The `/portal/timeline` endpoint queries files ordered by `uploadedAt DESC`, grouped by `DATE_TRUNC('month', uploadedAt)`, filtered by the user's access permissions.

### 4.7 Upload Routing (Req 9, 10, 31, 33, 34, 35, 37, 40)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/upload/single` | Admin, Mod | Upload a single file. Triggers routing. |
| POST | `/upload/batch` | Admin, Mod | Upload multiple files. Returns bulk routing review. |
| POST | `/upload/drop/:categoryId` | Admin, Mod | Drag-and-drop upload to a specific folder (bypasses routing). |
| POST | `/upload/route/:fileId/confirm` | Admin, Mod | Confirm or override a routing decision. |
| POST | `/upload/route/:fileId/new-category` | Admin, Mod | Accept a new category suggestion. |
| GET | `/upload/history` | Any | Returns the authenticated user's upload history, paginated. |

**Upload routing pipeline** (single file):

```
File uploaded → Store temp in memory/disk
  │
  ├─ 1. Duplicate Detection (Req 35)
  │    Query Metadata Store: same filename + size within 5% in target category
  │    If duplicate found → return warning to client, await confirm/cancel
  │
  ├─ 2. AI Rename Suggestion (Req 37)
  │    Gemini 1.5 Flash evaluates filename for noise patterns
  │    If noisy → return suggestion alongside routing result
  │
  ├─ 3. Confidence Scoring (Req 9)
  │    Gemini 1.5 Flash receives: filename, mimeType, size, architecture tree
  │    Returns: array of { categoryId, score, explanation }
  │
  ├─ 4. Routing Decision
  │    Score >= 80 for exactly one category → auto-place
  │    Score >= 80 for multiple categories → present options to user
  │    No score >= 80 → prompt manual selection or suggest new category (Req 10)
  │
  ├─ 5. Placement
  │    Upload file to Drive via Drive Connector
  │    Create FileMeta record in Metadata Store
  │    Store routing explanation ("Why here?" — Req 40)
  │
  ├─ 6. Post-placement
  │    Generate up to 5 auto-tags (Req 21) via Gemini 1.5 Flash
  │    Generate AI summary if supported type and <= 10MB (Req 38)
  │    Update category lastUpdatedAt
  │    Log FILE_UPLOAD + FILE_PLACEMENT audit events
  │    Send notifications for favorited folders
  └
```

**Gemini prompt for routing** (Req 9):

```
System: You are a file routing assistant. Given a file's metadata and
a folder architecture, determine the best folder for this file.

Return a JSON array of the top 3 matches:
[{ "categoryId": "...", "score": 0-100, "explanation": "..." }]

Score guidelines:
- 90-100: Filename and type strongly match the folder's purpose
- 70-89: Reasonable match based on type or partial name match
- Below 70: Weak or no match

File: { name, mimeType, sizeBytes }
Architecture: {architectureTreeJSON}
```

Model: **Gemini 1.5 Flash** (high frequency, lower complexity).

**Batch upload** (Req 31): Process all files through the pipeline, then group results into three tiers (auto-placed, needs selection, no match) and return a single bulk review screen payload.

**Drag-and-drop** (Req 34): Bypasses the routing pipeline. Runs only duplicate detection before placing directly in the target category.


### 4.8 Search (Req 7, 28, 29, 30)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?q=...&type=...&folder=...&dateFrom=...&dateTo=...&uploader=...&tag=...` | Any | Search files and folders. Supports filters. |
| GET | `/search/semantic?q=...` | Any | Semantic search via Gemini. |
| GET | `/portal/file/:fileId/similar` | Any | Returns up to 5 similar files for "Files Like This" sidebar. |

**Standard search** (Req 7, 28):
- Query the Metadata Store using `ILIKE` on file name, folder name, and tag name.
- Return results within 3 seconds (indexed columns: `name`, `tag.name`).
- Filters (type, folder, date range, uploader, tag) are applied as additional WHERE clauses.
- Results are filtered by the user's access permissions.

**Semantic search** (Req 29):
- When standard search returns fewer than 3 results, or when the user explicitly toggles semantic mode:
  1. Send the query to Gemini 1.5 Flash with the full list of file names, tags, folder paths, and AI summaries.
  2. Gemini returns a ranked list of file IDs matching the semantic intent.
  3. Results are labeled as "AI-assisted" in the response.

**Similar files** (Req 30):
- Compare the target file's tags, folder path, and AI summary against all other files using Gemini 1.5 Flash.
- Return up to 5 matches, filtered by the requesting user's access permissions.
- Cache results for 1 hour per file to avoid repeated AI calls.

### 4.9 User and Role Management (Req 12, 13, 44)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users` | Admin | List all users in the club. |
| POST | `/users/invite` | Admin | Send invitation email with role assignment. |
| PUT | `/users/:userId/role` | Admin | Change a user's role. |
| DELETE | `/users/:userId` | Admin | Remove a user from the club. |
| GET | `/users/:userId/access-grants` | Admin | List individual access grants for a user. |
| POST | `/categories/:categoryId/access` | Admin | Grant individual access to a user. |
| DELETE | `/categories/:categoryId/access/:userId` | Admin | Revoke individual access. |
| PUT | `/categories/:categoryId/minimum-role` | Admin | Set minimum role for a category. |
| POST | `/access-requests` | Mod, Member | Submit an access request for a restricted category. |
| PUT | `/access-requests/:requestId` | Admin | Approve or deny an access request. |

**Invitation flow** (Req 12):
1. Admin submits email + role.
2. System generates a UUID token, stores an `Invitation` record with 72-hour expiry.
3. Sends email via SendGrid with link: `{baseUrl}/invite/{token}`.
4. On link click: validate token not expired and not used → show registration form → create user with assigned role.

**Last admin protection** (Req 12): Before any role change or user removal, query `COUNT(*) FROM users WHERE clubId = ? AND role = 'ADMIN'`. If count would drop to 0, reject the operation.

### 4.10 Notifications (Req 45)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Any | Returns notifications for the current user. |
| PUT | `/notifications/:id/read` | Any | Mark a notification as read. |
| DELETE | `/notifications/:id` | Any | Dismiss a notification. |
| GET | `/notifications/stream` | Any | SSE endpoint for real-time notification delivery. |

**Notification types by role**:
- All roles: new files in favorited/granted folders.
- Admin + Mod: pending file requests.
- Admin: pending category approvals, structural drift alerts, access requests.

**Real-time delivery**: When a notification is created, push it to the user's SSE connection if active. The client maintains a persistent SSE connection to `/notifications/stream`.

### 4.11 Favorites, Quick Access, File Requests (Req 20, 23, 43)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/favorites/:fileId` | Any | Add a file to favorites. |
| DELETE | `/favorites/:fileId` | Any | Remove a file from favorites. |
| GET | `/favorites` | Any | List current user's favorites. |
| POST | `/quick-access/:fileId` | Admin | Pin a file to Quick Access (max 10). |
| DELETE | `/quick-access/:fileId` | Admin | Unpin a file from Quick Access. |
| GET | `/quick-access` | Any | List Quick Access files. |
| POST | `/file-requests` | Member | Submit a file request. |
| GET | `/file-requests` | Admin, Mod | List open file requests. |
| PUT | `/file-requests/:id/fulfill` | Admin, Mod | Link an uploaded file to a request. |

**Quick Access limit** (Req 20): Before inserting, check `COUNT(*) FROM quick_access_files WHERE clubId = ?`. If >= 10, return 400 error.

**Favorites permission check** (Req 23): Before adding a favorite, verify the user has access to the file via the standard permission check. Return 403 if not.

### 4.12 Audit Logging (Req 14)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/audit-logs?action=...&userId=...&from=...&to=...&page=...` | Admin | Query audit logs with filters. |

**Implementation**: An `auditLog` middleware function is called by each service after a significant action. It creates an `AuditLog` record with the action type, user ID, resource type/ID, and optional details JSON.

**Retention**: A scheduled job runs weekly to delete audit log entries older than 12 months.

**Performance**: Composite indexes on `(clubId, createdAt)`, `(clubId, action)`, and `(clubId, userId)` ensure filtered queries return within 3 seconds.

### 4.13 Drive Sync (Req 15)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/drive/webhook` | None (verified by channel ID) | Receives Google Drive change notifications. |
| GET | `/drive/drift` | Admin | Returns unresolved structural drift items. |
| PUT | `/drive/drift/:id` | Admin | Resolve a drift item (accept or ignore). |

**Webhook lifecycle**:
1. On Drive connection, register a webhook via `changes.watch` with the club's `pageToken`.
2. Store `channelId`, `resourceId`, and `expiry` on the Club record.
3. A cron job runs every hour: for any club where `webhookExpiry - now() < 1 hour`, re-register the webhook (23-hour cycle).
4. If re-registration fails, log the error and set `driftUnresolvedCount = -1` as a signal to show a warning on the admin dashboard.

**Change processing pipeline**:
1. Webhook hits `/drive/webhook` with `X-Goog-Channel-ID` and `X-Goog-Resource-ID`.
2. Validate the channel ID matches a known club.
3. Call `changes.list` with the stored `pageToken` to get the delta.
4. For each change:
   - File added in managed tree → add to Metadata Store as Unmanaged File, trigger Upload Router for category suggestion, notify Admin.
   - File deleted → remove from Metadata Store, mark any linked Pending Files as unresolvable.
   - File moved/renamed → update path and name in Metadata Store.
   - Folder created outside IntakeFlow → create `StructuralDrift` record (FOLDER_CREATED), notify Admin.
   - Folder deleted → create `StructuralDrift` record (FOLDER_DELETED), mark contained files as Unmanaged, notify Admin.
5. Update the club's `pageToken` to the new value from the response.
6. Update `lastSyncAt` timestamp.


### 4.14 AI Features (Req 21, 29, 38, 39, 41, 42)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ai/tags/:fileId` | Admin, Mod | Regenerate auto-tags for a file. |
| PUT | `/ai/tags/:fileId` | Admin, Mod | Manually add or remove tags. |
| GET | `/ai/reorganize` | Admin | Trigger on-demand re-organization analysis. |
| GET | `/ai/reorganize/suggestions` | Admin | Get current re-organization suggestions. |
| PUT | `/ai/reorganize/suggestions/:id` | Admin | Accept or dismiss a suggestion. |
| POST | `/ai/smart-name` | Admin, Mod | Check a proposed category name against naming conventions. |

**Auto-tags** (Req 21): On file creation, Gemini 1.5 Flash receives the file name, type, and folder path and returns up to 5 keyword tags. Tags are stored in the Metadata Store only.

**AI Summary** (Req 38): For supported file types (PDF, Google Docs, Google Slides, plain text) under 10MB, Gemini 1.5 Flash generates a one-sentence summary. For PDFs and plain text, the first 5,000 characters of content are extracted and sent. For Google Docs/Slides, the Drive API export-as-text is used. Binary files, CSVs, XLSX, images, and video are excluded.

**Folder Description** (Req 39): When a category is created, Gemini 1.5 Flash generates a one-sentence description based on the folder name and its position in the hierarchy. Admins can manually override.

**Re-organization Suggestions** (Req 41):
- Triggered on-demand by Admin, or automatically when the Unsorted folder exceeds 10 files.
- Gemini 1.5 Pro analyzes the full architecture tree, recent placements, and Unsorted files.
- Returns a structured plan: files to relocate, folders to merge/rename, new categories to create.
- Each suggestion is independently accept/dismissable.

**Smart Folder Naming** (Req 42): When a user enters a new category name, the backend sends the name plus the existing architecture's naming patterns to Gemini 1.5 Flash. If the name deviates (e.g., different casing or separator style), a normalized suggestion is returned inline.

### 4.15 Setup Wizard and Demo Mode (Req 16, 17, 18)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/setup/status` | Admin | Returns current setup step (0-4) and completion state. |
| PUT | `/setup/club-type` | Admin | Set the club type for AI context. |
| POST | `/demo/start` | None | Enter demo mode. Creates a sandboxed session with sample data. |
| GET | `/demo/status` | Session | Check if current session is in demo mode. |

**Guided Setup Wizard steps** (Req 16):
1. Connect Drive (step 0 → 1)
2. Analyze Structure (step 1 → 2)
3. Approve Architecture (step 2 → 3, includes club type selection per Req 17)
4. Invite Team (step 3 → 4)

Each step unlocks only when the previous step is complete. The wizard is displayed on the admin dashboard until all 4 steps are done.

**Demo Mode** (Req 18):
- A pre-seeded PostgreSQL dataset contains a sample club with realistic folders, files, tags, and metadata.
- On `/demo/start`, the system clones the seed data into a temporary club record with `demoMode = true`.
- All Drive Connector calls are intercepted by a `DemoModeAdapter` that returns mock responses instead of calling the real Drive API.
- A persistent banner is injected into every page via a React context provider that checks `club.demoMode`.
- Demo data is cleaned up after 24 hours of inactivity.

### 4.16 User Preferences (Req 47, 48)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/users/me/preferences` | Any | Update dark mode, dismiss first-login orientation. |
| GET | `/users/me/preferences` | Any | Get current preferences. |

**Dark mode** (Req 47): The `darkMode` boolean on the User model drives a CSS class on the root `<html>` element. Tailwind's `dark:` variant handles all theme switching. The palette uses muted tones (e.g., `gray-900` background, `gray-100` text) rather than pure black.

**First-login orientation** (Req 48): On first login (`firstLoginComplete = false`), the frontend renders a spotlight overlay highlighting the folder tree, search bar, and Quick Access section. The overlay auto-dismisses after 20 seconds or on user click. On dismiss, `PUT /users/me/preferences` sets `firstLoginComplete = true`.

### 4.17 Activity Feed and Dashboard (Req 22, 49, 50)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/activity/feed` | Any | Returns last 20 activity entries for the club. |
| GET | `/activity/stream` | Any | SSE endpoint for real-time activity feed updates. |
| GET | `/dashboard/admin` | Admin | Returns Club Activity Dashboard metrics. |
| GET | `/portal/new-badges` | Any | Returns file/folder IDs with "New" badges for the current user. |

**Activity Feed** (Req 22): Queries the `AuditLog` table filtered to action types: `FILE_UPLOAD`, `FILE_PLACEMENT`, `ARCHITECTURE_ACTIVATE`, and user join events. Returns the 20 most recent. Real-time updates via SSE push when new qualifying events are logged.

**Club Activity Dashboard** (Req 49):
- Total files: `COUNT(*) FROM file_meta WHERE clubId = ?`
- Files uploaded last 30 days: `COUNT(*) WHERE uploadedAt > now() - 30 days`
- Top 3 uploaders: `GROUP BY uploaderId ORDER BY COUNT(*) DESC LIMIT 3`
- Unresolved items: sum of Unsorted files + unresolved StructuralDrift + pending FileRequests + pending AccessRequests
- Widgets with zero values are omitted from the response.

**"New" badges** (Req 50): Compare each file/folder's `createdAt` or `updatedAt` against the user's `lastLoginAt`. Items newer than `lastLoginAt` and less than 7 days old get a badge. Viewing a file clears its badge for that user (tracked via a `BadgeDismissal` table or a JSONB field on the User).


---

## 5. Frontend Component Architecture

### 5.1 Application Shell

```
<App>
  <ThemeProvider>          // Dark mode context
    <AuthProvider>         // Session state, user info, role
      <DemoBanner />       // Persistent banner if demoMode
      <Router>
        <PublicRoutes>
          /login            → <LoginPage />
          /register         → <RegisterPage />
          /invite/:token    → <InvitationPage />
          /demo             → <DemoLandingPage />
        </PublicRoutes>
        <ProtectedRoutes>   // Requires authenticated session
          <AppLayout>
            <Sidebar>
              <FolderTree />
              <QuickAccessPanel />
              <FavoritesPanel />
            </Sidebar>
            <TopBar>
              <SearchInput />
              <NotificationBell />
              <UserMenu />
            </TopBar>
            <MainContent>
              /dashboard      → <Dashboard />
              /portal         → <FilePortal />
              /portal/:id     → <FolderView /> or <FileDetailView />
              /timeline       → <TimelineView />
              /upload         → <UploadPage />
              /upload/history → <UploadHistoryPage />
              /admin/arch     → <ArchitectureEditor />
              /admin/users    → <UserManagement />
              /admin/audit    → <AuditLogView />
              /admin/drift    → <DriveSyncPanel />
              /admin/dashboard→ <ClubActivityDashboard />
              /setup          → <SetupWizard />
              /settings       → <UserSettings />
            </MainContent>
          </AppLayout>
        </ProtectedRoutes>
      </Router>
    </AuthProvider>
  </ThemeProvider>
</App>
```

### 5.2 Key Component Specifications

**FolderTree** (Req 7, 25, 26):
- Recursive tree component rendering categories.
- Each node shows: folder name, last-updated indicator, "New" badge if applicable.
- Clicking a folder navigates to `/portal/:categoryId`.
- Breadcrumb trail rendered above the main content area based on the active folder's ancestor chain.

**FolderPreviewPopover** (Req 24):
- Triggered on 300ms hover over a folder name.
- Fetches `/portal/folder/:categoryId/hover` (cached for 30 seconds).
- Shows top 3-5 recent files and total file count.
- Dismissed when cursor leaves both the folder name and the popover.

**FileDetailView** (Req 8, 30, 33, 38, 40, 46):
- Displays: file preview (inline for supported types), metadata, uploader attribution, upload date, upload note, AI summary, tags, "Why here?" tooltip.
- Sidebar: "Files Like This" panel with up to 5 similar files.
- Actions: download, add to favorites, request access (if restricted).

**UploadFlow** (Req 9, 10, 31, 33, 34, 35, 37):
- Drag-and-drop zone on folder views.
- Upload dialog: file picker, optional upload note (280 char limit), progress bar.
- Routing result screen: shows auto-placement, rename suggestion, duplicate warning.
- Bulk routing review screen: three-tier grouping for batch uploads.

**ArchitectureEditor** (Req 5, 11, 42):
- Drag-and-drop tree editor for folder structure.
- Inline rename with Smart Folder Naming suggestions.
- Draft mode indicator with "Activate" button.
- Version history sidebar with rollback option.
- Access control settings per folder (minimum role dropdown, individual grants).

**SetupWizard** (Req 16, 17):
- Four-step stepper component.
- Each step is locked until the previous completes.
- Step 3 includes club type selector dropdown.
- Progress indicator showing X/4 complete.

**SearchResults** (Req 7, 28, 29):
- Results list with file name, folder path, type, last modified, tags.
- Filter chips: file type, folder, date range, uploader, tag.
- Semantic search toggle with "AI-assisted" label on results.
- Client-side filter application against cached results.

**NotificationCenter** (Req 45):
- Bell icon with unread count badge.
- Dropdown panel listing notifications.
- Each notification: type icon, title, body, timestamp, read/dismiss actions.
- Real-time updates via SSE connection.

**FirstLoginOrientation** (Req 48):
- Modal overlay with spotlight highlights on folder tree, search bar, Quick Access.
- Auto-dismiss timer (20 seconds).
- Click-to-dismiss on any highlighted element.
- Shown once per user account.


---

## 6. Security Design

### 6.1 Authentication and Sessions
- Passwords hashed with bcrypt (cost factor 12).
- Sessions stored server-side in PostgreSQL. Cookie: `httpOnly`, `secure`, `sameSite: lax`.
- 24-hour idle timeout enforced by checking `expiresAt` on each request.
- CSRF protection via `csurf` middleware for state-changing requests.

### 6.2 OAuth Token Security
- Google Drive access and refresh tokens encrypted at rest using AES-256-GCM.
- Encryption key stored in environment variable, not in the database.
- Token refresh is automatic and transparent to the user.

### 6.3 Authorization
- Role-based access control enforced at the API layer via `requireRole(Role)` middleware.
- Folder-level access control enforced via `filterByAccess` middleware that checks `category.minimumRole` and `AccessGrant` records.
- All file access (preview, download) passes through the permission check before proxying from Drive.

### 6.4 Input Validation
- All API inputs validated using `zod` schemas.
- File upload size limit: 100MB per file.
- Upload note: max 280 characters, sanitized for XSS.
- Search queries: sanitized and parameterized to prevent SQL injection.

### 6.5 Rate Limiting
- API rate limiting via `express-rate-limit`: 100 requests/minute per authenticated user, 20 requests/minute for unauthenticated endpoints.
- AI endpoints (Gemini calls) additionally rate-limited to stay within Google AI Studio free tier quotas.

---

## 7. Performance Considerations

### 7.1 Database Indexing
- `file_meta`: indexes on `(clubId, categoryId)`, `(clubId, name)`, `(clubId, uploadedAt)`, `(clubId, uploaderId)`.
- `tag`: index on `(name)` for search.
- `audit_log`: composite indexes on `(clubId, createdAt)`, `(clubId, action)`, `(clubId, userId)`.
- `category`: index on `(clubId, parentId)` for tree traversal.
- `notification`: index on `(userId, isRead, createdAt)`.

### 7.2 Caching Strategy
- Folder tree: cached in TanStack Query with 5-minute stale time. Invalidated on architecture changes.
- Folder hover preview: cached for 30 seconds client-side.
- Similar files: cached server-side for 1 hour per file (Redis or in-memory LRU).
- Search results: cached client-side; filters applied against cached results without new server calls.

### 7.3 Performance Targets
- Structure analysis: < 60 seconds for 10,000 files (parallel batch Drive API calls).
- Upload routing: < 10 seconds for files up to 100MB.
- Search: < 3 seconds for filtered queries.
- Audit log queries: < 3 seconds with filters.
- File portal page load: < 2 seconds for folder contents.

---

## 8. Error Handling Strategy

### 8.1 API Error Format
All API errors return a consistent JSON structure:
```json
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "An account with this email already exists.",
    "details": {}
  }
}
```

### 8.2 Error Categories
- **Validation errors** (400): Invalid input, missing fields, constraint violations.
- **Authentication errors** (401): Invalid credentials, expired session.
- **Authorization errors** (403): Insufficient role, no access grant.
- **Not found errors** (404): Resource does not exist or is not accessible.
- **Conflict errors** (409): Duplicate email, last admin protection, Quick Access limit.
- **Drive errors** (502): Google Drive API failures, token refresh failures.
- **AI errors** (503): Gemini API failures — fallback to manual routing/no suggestions.

### 8.3 Graceful Degradation
- If Gemini API is unavailable: upload routing falls back to manual category selection. Tags, summaries, and rename suggestions are skipped.
- If Drive API is unavailable: portal continues to serve cached metadata from the Metadata Store. File preview/download returns a "temporarily unavailable" message.
- If webhook re-registration fails: admin is alerted via the Drive Sync Status indicator. Manual sync can be triggered.

---

## 9. Correctness Properties

These properties define the formal correctness guarantees that the system must uphold. Each property is testable via property-based testing using fast-check.

### P1: Role Hierarchy Enforcement
**Property**: For any user U with role R and any category C with minimumRole M, U can access C if and only if `roleLevel(R) >= roleLevel(M)` OR an AccessGrant exists for (U, C).
- `roleLevel(ADMIN) = 3, roleLevel(MOD) = 2, roleLevel(MEMBER) = 1`

### P2: Last Admin Invariant
**Property**: For any club, the count of users with role ADMIN is always >= 1. No operation (role change, user removal) may reduce this count to 0.

### P3: Architecture Version Monotonicity
**Property**: Architecture version numbers for a given club are strictly increasing. Activating a new version always produces a version number greater than all previous versions.

### P4: Placement Threshold Consistency
**Property**: For any file placement, if the file was auto-placed (no user prompt), then exactly one category had a confidence score >= 80. If multiple categories scored >= 80, the user was prompted to choose.

### P5: Quick Access Cardinality
**Property**: For any club, the count of QuickAccessFile records never exceeds 10.

### P6: Session Expiry Enforcement
**Property**: For any session, if `now() - lastActivity > 24 hours`, the session is invalid and any API request using it returns 401.

### P7: Invitation Token Expiry
**Property**: For any invitation, if `now() > expiresAt`, the invitation cannot be used to create an account.

### P8: Duplicate Detection Consistency
**Property**: For any file placement into category C, if a file with the same name and size within 5% already exists in C, the user was warned before placement was finalized.

### P9: Metadata-Only Storage
**Property**: The IntakeFlow database never stores file binary content. All `FileMeta` records reference files via `driveFileId` only.

### P10: Audit Log Completeness
**Property**: For every significant action (login, invite, role change, file upload, file placement, category CRUD, architecture activation, rollback), an AuditLog record exists with matching timestamp, userId, action type, and resourceId.

### P11: Demo Mode Isolation
**Property**: While a session is in demo mode (`club.demoMode = true`), no write operation reaches the Google Drive API. All Drive Connector calls are intercepted by the DemoModeAdapter.

### P12: Tag Cardinality
**Property**: For any file, the count of auto-generated tags never exceeds 5.

### P13: Webhook Continuity
**Property**: For any club with an active Drive connection, the webhook expiry is always at least 1 hour in the future, or a re-registration attempt is in progress.

### P14: Access Grant Symmetry
**Property**: If an AccessGrant is removed for user U on category C, then U can no longer access C (assuming U's role < C's minimumRole) on the very next API request.

### P15: Favorite Permission Consistency
**Property**: A user can only have a Favorite on a file they currently have permission to view. If access is revoked, the favorite remains in storage but the file is not returned in the favorites list.


---

## 10. Project Structure

```
intakeflow/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # AppLayout, Sidebar, TopBar
│   │   │   ├── portal/              # FolderTree, FileDetailView, FolderPreviewPopover
│   │   │   ├── upload/              # UploadFlow, BulkRoutingReview, DragDropZone
│   │   │   ├── admin/               # ArchitectureEditor, UserManagement, AuditLogView
│   │   │   ├── search/              # SearchInput, SearchResults, FilterChips
│   │   │   ├── notifications/       # NotificationCenter, NotificationBell
│   │   │   ├── setup/               # SetupWizard, ClubTypeSelector
│   │   │   ├── dashboard/           # Dashboard, ActivityFeed, ClubActivityDashboard
│   │   │   ├── auth/                # LoginPage, RegisterPage, InvitationPage
│   │   │   └── shared/              # Breadcrumb, NewBadge, DemoBanner, Orientation
│   │   ├── hooks/                   # Custom React hooks (useAuth, useSSE, usePermissions)
│   │   ├── api/                     # API client functions (one file per domain)
│   │   ├── contexts/                # AuthContext, ThemeContext, DemoContext
│   │   ├── types/                   # TypeScript interfaces matching API responses
│   │   └── utils/                   # Helpers (roleLevel, dateFormatting, etc.)
│   ├── public/
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── drive.ts
│   │   │   ├── structure.ts
│   │   │   ├── architecture.ts
│   │   │   ├── portal.ts
│   │   │   ├── upload.ts
│   │   │   ├── search.ts
│   │   │   ├── users.ts
│   │   │   ├── notifications.ts
│   │   │   ├── favorites.ts
│   │   │   ├── quickAccess.ts
│   │   │   ├── fileRequests.ts
│   │   │   ├── accessRequests.ts
│   │   │   ├── ai.ts
│   │   │   ├── audit.ts
│   │   │   ├── setup.ts
│   │   │   ├── demo.ts
│   │   │   ├── activity.ts
│   │   │   └── dashboard.ts
│   │   ├── services/
│   │   │   ├── driveConnector.ts     # Google Drive API wrapper
│   │   │   ├── structureAnalyzer.ts  # Drive traversal and metadata extraction
│   │   │   ├── aiArchitect.ts        # Gemini-powered architecture proposals
│   │   │   ├── uploadRouter.ts       # Confidence scoring, routing pipeline
│   │   │   ├── architectureService.ts# Draft management, activation, rollback
│   │   │   ├── userService.ts        # User CRUD, invitation, role management
│   │   │   ├── searchService.ts      # Standard and semantic search
│   │   │   ├── notificationService.ts# Notification creation and SSE delivery
│   │   │   ├── auditService.ts       # Audit log recording
│   │   │   ├── driveSyncService.ts   # Webhook processing, drift detection
│   │   │   ├── demoService.ts        # Demo mode data seeding and adapter
│   │   │   ├── aiTagService.ts       # Auto-tag generation
│   │   │   ├── aiSummaryService.ts   # File summary generation
│   │   │   └── geminiClient.ts       # Shared Gemini API client (Pro + Flash)
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Session validation
│   │   │   ├── requireRole.ts        # Role-based access control
│   │   │   ├── filterByAccess.ts     # Folder-level permission filtering
│   │   │   ├── auditLog.ts           # Automatic audit logging
│   │   │   ├── rateLimiter.ts        # Rate limiting
│   │   │   ├── validate.ts           # Zod schema validation
│   │   │   └── demoGuard.ts          # Intercepts Drive calls in demo mode
│   │   ├── jobs/
│   │   │   ├── webhookRenewal.ts     # Cron: re-register Drive webhooks
│   │   │   ├── auditCleanup.ts       # Cron: delete audit logs > 12 months
│   │   │   └── demoCleanup.ts        # Cron: clean up stale demo sessions
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts               # Demo mode seed data
│   │   └── app.ts                    # Express app setup
│   ├── package.json
│   └── tsconfig.json
│
├── tests/
│   ├── unit/                        # Unit tests per service
│   ├── integration/                 # API integration tests
│   └── properties/                  # Property-based tests (fast-check)
│       ├── roleHierarchy.prop.ts    # P1
│       ├── lastAdmin.prop.ts        # P2
│       ├── archVersion.prop.ts      # P3
│       ├── placementThreshold.prop.ts # P4
│       ├── quickAccess.prop.ts      # P5
│       ├── sessionExpiry.prop.ts    # P6
│       ├── invitationExpiry.prop.ts # P7
│       ├── duplicateDetection.prop.ts # P8
│       ├── metadataOnly.prop.ts     # P9
│       ├── auditCompleteness.prop.ts # P10
│       ├── demoIsolation.prop.ts    # P11
│       ├── tagCardinality.prop.ts   # P12
│       ├── webhookContinuity.prop.ts # P13
│       ├── accessGrantSymmetry.prop.ts # P14
│       └── favoritePermission.prop.ts # P15
│
├── docker-compose.yml               # PostgreSQL + app for local dev
├── .env.example
└── README.md
```

---

## 11. Requirement Traceability Matrix

| Requirement | API Endpoints | Services | Data Models | Correctness Properties |
|---|---|---|---|---|
| Req 1: Auth | 4.1 | userService | User, Session | P6 |
| Req 2: Drive Connection | 4.2 | driveConnector | Club | — |
| Req 3: Structure Analysis | 4.3 | structureAnalyzer | Category, FileMeta | P9 |
| Req 4: AI Proposals | 4.4 | aiArchitect | ArchitectureVersion | — |
| Req 5: Architecture Review | 4.4, 4.5 | architectureService | ArchitectureVersion, Category | P3 |
| Req 6: File Migration | 4.5 | architectureService, driveConnector | FileMeta | — |
| Req 7: Portal Browsing | 4.6, 4.8 | searchService | Category, FileMeta | P1 |
| Req 8: File Viewing | 4.6 | driveConnector | FileMeta | P1 |
| Req 9: Upload Routing | 4.7 | uploadRouter | FileMeta | P4 |
| Req 10: New Category | 4.7 | uploadRouter, architectureService | Category | — |
| Req 11: Architecture Mgmt | 4.5 | architectureService | ArchitectureVersion, Category | P3 |
| Req 12: User/Role Mgmt | 4.9 | userService | User, Invitation | P2, P7 |
| Req 13: Folder Access | 4.9 | userService | Category, AccessGrant | P1, P14 |
| Req 14: Audit Logging | 4.12 | auditService | AuditLog | P10 |
| Req 15: Drive Sync | 4.13 | driveSyncService | StructuralDrift, Club | P13 |
| Req 16: Setup Wizard | 4.15 | — | Club (setupStep) | — |
| Req 17: Club Type | 4.15 | aiArchitect | Club (clubType) | — |
| Req 18: Demo Mode | 4.15 | demoService | Club (demoMode) | P11 |
| Req 19: Google OAuth | 4.1 | userService | User (googleId) | — |
| Req 20: Quick Access | 4.11 | — | QuickAccessFile | P5 |
| Req 21: Auto-Tags | 4.14 | aiTagService | Tag | P12 |
| Req 22: Activity Feed | 4.17 | auditService | AuditLog | — |
| Req 23: Favorites | 4.11 | — | Favorite | P15 |
| Req 24: Folder Preview | 4.6 | — | Category, FileMeta | — |
| Req 25: Breadcrumb | 4.6 | — | Category | — |
| Req 26: Last Updated | 4.6 | — | Category (lastUpdatedAt) | — |
| Req 27: Timeline View | 4.6 | — | FileMeta | — |
| Req 28: Search Filters | 4.8 | searchService | FileMeta, Tag | — |
| Req 29: Semantic Search | 4.8 | searchService, geminiClient | FileMeta | — |
| Req 30: Files Like This | 4.8 | searchService, geminiClient | FileMeta | — |
| Req 31: Batch Upload | 4.7 | uploadRouter | FileMeta | P4 |
| Req 32: Register Drive Files | 4.7 | uploadRouter, driveConnector | FileMeta | — |
| Req 33: Upload Notes | 4.7 | — | FileMeta (uploadNote) | — |
| Req 34: Drag-and-Drop | 4.7 | uploadRouter | FileMeta | P8 |
| Req 35: Duplicate Detection | 4.7 | uploadRouter | FileMeta | P8 |
| Req 36: Upload History | 4.7 | — | FileMeta | — |
| Req 37: AI Rename | 4.7 | uploadRouter, geminiClient | — | — |
| Req 38: AI Summary | 4.14 | aiSummaryService | FileMeta (aiSummary) | — |
| Req 39: Folder Description | 4.14 | aiArchitect | Category (description) | — |
| Req 40: Why Here? | 4.7 | uploadRouter | FileMeta (routingExplanation) | — |
| Req 41: Reorg Suggestions | 4.14 | aiArchitect | — | — |
| Req 42: Smart Folder Naming | 4.14 | aiArchitect | — | — |
| Req 43: File Request | 4.11 | notificationService | FileRequest, Notification | — |
| Req 44: Access Request | 4.9 | notificationService | AccessRequest, Notification | — |
| Req 45: Notifications | 4.10 | notificationService | Notification | — |
| Req 46: Uploader Attribution | 4.6 | — | FileMeta (uploaderId) | — |
| Req 47: Dark Mode | 4.16 | — | User (darkMode) | — |
| Req 48: First-Login Orientation | 4.16 | — | User (firstLoginComplete) | — |
| Req 49: Club Dashboard | 4.17 | — | AuditLog, FileMeta, StructuralDrift | — |
| Req 50: New Badge | 4.17 | — | User (lastLoginAt), FileMeta | — |
