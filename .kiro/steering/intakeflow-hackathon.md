# IntakeFlow — KiroHacks Hackathon Steering

## Hackathon Context

This project is being built for KiroHacks Cal Poly, a one-day hackathon (May 2, 2026) with 13 hours of build time. Submissions are due by 11:59 PM. The project targets the **Human-Centered Design Track**: technology that makes life better for college club communities.

### Judging Criteria (60 pts total)
- **Implementation (20 pts)**: Thoughtful AI development strategy, interesting integrations beyond basics
- **Innovation & Design (20 pts)**: Creative/original concept, intuitive and polished design
- **Social Good (20 pts)**: Solves a real problem in a scalable way, addresses community needs

### Submission Requirements
- Public GitHub repo with OSI-approved open source license
- The `/.kiro` directory MUST be at the root and NOT in `.gitignore`
- 3-minute video demo (YouTube/Vimeo)
- Write-up on how Kiro was used (specs, hooks, steering, vibe coding, MCP)
- Functional project URL if applicable (can include login credentials in repo)

### Kiro Usage — What Judges Want to See
- **Spec-driven development**: The `.kiro/specs/intake-flow/` directory shows our requirements → design → tasks workflow
- **Steering docs**: This file and any others in `.kiro/steering/`
- **Agent hooks**: Any hooks in `.kiro/hooks/` that automate workflows
- **Vibe coding**: Document interesting code generation conversations
- Keep the `.kiro/` directory clean and well-organized — judges will inspect it

---

## Team Split

Two developers are working in parallel. Coordination is critical to avoid merge conflicts and ensure compatibility.

### Developer A (You) — Frontend (Tasks 18-20)
- Working in `client/` directory
- Building: React shell, auth pages, file portal, upload UI, search, admin views, dashboard, notifications, settings
- Uses API client functions that call backend endpoints (which may not exist yet)

### Developer B (Partner) — Backend + Database (Tasks 1-17)
- Working in `server/` directory and root config files
- Building: Express API, Prisma schema, all services, middleware, Drive integration, AI features, auth endpoints

### Shared / Coordination Points
- `client/src/types/` — TypeScript interfaces matching API responses. Developer A should define these based on the design doc. Developer B should ensure API responses match.
- `client/src/api/` — API client functions. Developer A writes these against the design doc endpoints. They should work once Developer B's routes are live.
- Root config: `docker-compose.yml`, `.env.example`, root `package.json` — Developer B owns these. Developer A should not modify them.
- `tests/properties/` — Developer B owns property-based tests.

---

## Conventions

### Code Style
- TypeScript strict mode in both `client/` and `server/`
- Use named exports, not default exports
- Use `async/await`, never raw `.then()` chains
- Prefer `const` over `let`; never use `var`
- Use descriptive variable names; no single-letter variables except in loops

### Frontend Conventions (Developer A)
- React functional components only, no class components
- Use TanStack Query for all server state; local state only for UI-specific concerns (modals, form inputs)
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities and hooks
- One component per file; co-locate styles if needed
- Use shadcn/ui components as the base; customize via Tailwind classes
- All API calls go through functions in `client/src/api/` — never call `fetch` directly in components
- Dark mode: use Tailwind `dark:` variants; theme toggle sets class on `<html>`
- Accessibility: all interactive elements must have proper ARIA labels, keyboard navigation, and focus management

### Backend Conventions (Developer B)
- Express route files in `server/src/routes/`, one file per domain
- Service classes in `server/src/services/`, one file per service
- Middleware in `server/src/middleware/`
- All routes validate input with zod schemas before processing
- All database access goes through Prisma client — no raw SQL
- Error responses use the standard format: `{ error: { code, message, details } }`
- Audit logging: call `auditService.logAction()` after every significant mutation

### API Contract
- All endpoints prefixed with `/api/v1`
- Auth via session cookie (httpOnly, secure, sameSite: lax)
- Role enforcement via `requireRole()` middleware
- Folder access enforcement via `filterByAccess()` middleware
- Pagination: `?page=1&pageSize=20` pattern, response includes `{ data, total, page, pageSize }`
- Dates in ISO 8601 format
- IDs are UUIDs

### Git Workflow
- Both developers work on separate branches and merge via PR
- Developer A branch prefix: `frontend/`
- Developer B branch prefix: `backend/`
- Commit messages: `feat(scope): description` or `fix(scope): description`
- Scope examples: `auth`, `portal`, `upload`, `search`, `admin`, `setup`, `notifications`
- Do NOT force push to shared branches

---

## Hackathon Time Strategy

With 13 hours, prioritize a working demo over feature completeness.

### Must-Have for Demo (MVP)
1. Auth flow (register + login page + session)
2. Google Drive connection UI + mock/real backend
3. Structure analysis → AI proposals → architecture approval flow
4. File portal: folder tree browsing, file viewing, basic search
5. Upload with AI routing (single file at minimum)
6. Role-based access (at least Admin vs Member distinction visible)
7. Dark mode toggle (quick visual polish win)

### Nice-to-Have (if time permits)
- Batch upload with bulk routing review
- Semantic search
- Activity feed with real-time SSE
- Notification center
- Demo mode with sample data
- First-login orientation overlay
- Club Activity Dashboard

### Skip for Hackathon (implement post-event)
- Drive Sync webhooks (complex, hard to demo)
- Full audit log retention/cleanup jobs
- Re-organization suggestions
- Access request flow
- File request flow

### Frontend-First Strategy (Developer A)
Since the backend may not be ready immediately:
1. Start with static UI components and mock data
2. Define TypeScript interfaces in `client/src/types/` matching the design doc
3. Create API client functions in `client/src/api/` that return mock data initially
4. Wire up React Router and all page shells first
5. Replace mocks with real API calls as Developer B's endpoints come online
6. Focus on polish: transitions, loading states, error states, empty states

---

## Key Technical References

- Design doc: `.kiro/specs/intake-flow/design.md`
- Requirements: `.kiro/specs/intake-flow/requirements.md`
- Task list: `.kiro/specs/intake-flow/tasks.md`
- Tech stack: React 18, TypeScript, Tailwind + shadcn/ui, TanStack Query, React Router v6, Vite (frontend); Node.js, Express, TypeScript, Prisma, PostgreSQL 16, Passport.js (backend); Gemini API (AI); googleapis (Drive)
- AI models: Gemini 1.5 Pro (architecture proposals, reorg), Gemini 1.5 Flash (routing, tags, summaries, search)

---

## Demo Video Tips

The 3-minute video should showcase:
1. **Problem statement** (10 sec): College clubs struggle with disorganized Google Drives
2. **Kiro usage** (30 sec): Show the spec, steering, hooks in the IDE
3. **Live demo** (2 min): Walk through setup wizard → AI proposals → file portal → upload routing → role-based access
4. **Social good angle** (20 sec): How this helps real student organizations stay organized and accessible
