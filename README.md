# IntakeFlow

AI-powered file organization and access platform for college clubs, built on top of Google Drive.

Built for **KiroHacks Cal Poly** (May 2, 2026) by Cameron Hafer and Jonathan Fitzgerald.

## What It Does

College clubs accumulate messy Google Drives over time — scattered folders, inconsistent naming, files nobody can find. IntakeFlow fixes that.

1. **Connect** your club's Google Drive
2. **AI analyzes** the existing structure and proposes a clean folder architecture
3. **Admin reviews and approves** the proposed organization
4. **Upload new files** and the AI automatically routes them to the right folder
5. **Members browse** a clean portal with search, previews, and role-based access

No file content is stored by IntakeFlow — only metadata. Files stay in Google Drive.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router v6 |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL 16 |
| AI | Google Gemini API (1.5 Pro for architecture, 1.5 Flash for routing) |
| Storage | Google Drive API v3 |
| Auth | Passport.js (local + Google OAuth) |
| Real-time | Server-Sent Events (SSE) |
| Bundler | Vite |
| Testing | Vitest, fast-check, React Testing Library |

## Project Structure

```
├── client/                 # React frontend (Vite + TypeScript)
│   └── src/
│       ├── api/            # API client functions
│       ├── components/     # UI components (portal, upload, admin, etc.)
│       ├── contexts/       # Auth, Theme, Demo providers
│       ├── lib/            # Utilities (file helpers, etc.)
│       ├── pages/          # Route page components
│       └── types/          # Shared TypeScript interfaces
├── server/                 # Express backend (TypeScript)
│   ├── prisma/             # Database schema and migrations
│   └── src/
│       ├── routes/         # API route handlers
│       ├── services/       # Business logic (AI, Drive, etc.)
│       └── lib/            # Shared utilities
├── .kiro/                  # Kiro spec-driven development artifacts
│   ├── specs/intake-flow/  # Requirements, design, and task docs
│   ├── steering/           # Project conventions and guidance
│   └── hooks/              # Agent automation hooks
└── docker-compose.yml      # PostgreSQL for local dev
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)
- Google Cloud project with OAuth credentials and Drive API enabled
- Google AI Studio API key (Gemini)

### Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/jonathanfitzgerald24/kirothon.git
   cd kirothon
   npm install
   ```

2. Start PostgreSQL:
   ```bash
   docker compose up -d
   ```

3. Copy environment files and fill in your keys:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

   Required environment variables:
   - `DATABASE_URL` — already set for local Docker
   - `SESSION_SECRET` — any long random string
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
   - `GOOGLE_AI_API_KEY` — from Google AI Studio
   - `ENCRYPTION_KEY` — 64-char hex string for token encryption

4. Run database migrations:
   ```bash
   cd server
   npx prisma migrate dev
   ```

5. Start the dev servers:
   ```bash
   # Terminal 1 — backend
   cd server && npm run dev

   # Terminal 2 — frontend
   cd client && npm run dev
   ```

6. Open http://localhost:5173

## Key Features

- **AI Architecture Proposals** — Gemini analyzes your Drive and suggests 2-3 folder structures
- **Automated Upload Routing** — AI determines where new files belong with confidence scoring
- **Role-Based Access** — Admin, Mod, and Member roles with folder-level permissions
- **File Portal** — Clean browsing with search, previews, breadcrumbs, and timeline view
- **Semantic Search** — AI-powered search that understands intent, not just filenames
- **Dark Mode** — Full dark theme support
- **Real-time Activity Feed** — SSE-powered live updates
- **Setup Wizard** — Guided 4-step onboarding for new clubs

## How Kiro Was Used

This project was built using Kiro's spec-driven development workflow:

- **Specs** (`.kiro/specs/intake-flow/`): Full requirements doc (50 requirements), technical design doc, and implementation task list — all generated and refined through Kiro's requirements-first workflow
- **Steering** (`.kiro/steering/`): Team conventions, hackathon strategy, and frontend/backend split coordination
- **Hooks** (`.kiro/hooks/`): Prettier auto-format on save
- **Parallel development**: Two developers worked simultaneously — frontend (Tasks 18-20) and backend (Tasks 1-17) — coordinated through the shared spec and steering docs

## Hackathon Track

**Human-Centered Design** — Technology that makes life better for college club communities. IntakeFlow solves the real problem of disorganized shared Drives that every student organization faces.

## License

MIT
