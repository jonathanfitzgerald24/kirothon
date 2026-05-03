# 🌐 FileAtlas

**AI-powered file organization and access platform for college clubs**, built on top of Google Drive.

Built for **KiroHacks Cal Poly** (May 2, 2026) by **Cameron Hafer** and **Jonathan Fitzgerald**.

> **Track: Human-Centered Design** — Technology that makes life better for college club communities.

---

## 📹 Demo Video

> **[Watch the demo →](PASTE_DEMO_VIDEO_LINK_HERE)**

---

## The Problem

Every college club ends up with the same mess: a shared Google Drive full of scattered folders, inconsistent naming, duplicate files, and documents nobody can find. New officers inherit chaos. Members can't locate what they need. Important files get lost.

## The Solution

FileAtlas sits on top of Google Drive and uses **Gemini AI** to bring order to the chaos:

1. **Connect** your club's Google Drive
2. **AI analyzes** the existing structure and proposes a clean folder architecture
3. **Admin reviews, edits, and approves** the proposed organization
4. **Upload new files** — AI automatically sorts them into the right folder, generates tags, and writes summaries
5. **Members browse** a clean portal with smart search, role-based access, and file previews

No file content is stored by FileAtlas — only metadata. Files stay in Google Drive.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **AI Architecture Proposals** | Gemini analyzes your Drive and suggests 2–3 folder structures (Preserve, Reorganize, or Fresh) |
| **Automated Upload Routing** | AI determines where new files belong with confidence scoring, auto-tagging, and one-sentence summaries |
| **Batch Processing** | Upload many files at once — AI sorts them all automatically |
| **Smart Search** | Natural language queries like "find the quarter report for winter 2024" |
| **Role-Based Access** | Admin, Mod, and Member roles with folder-level permissions |
| **File Portal** | Clean browsing with breadcrumbs, folder previews, and timeline view |
| **Manual Architecture Editing** | Admins can rename, add, move, or delete folders after AI proposals |
| **Dark Mode** | Full dark theme support |
| **Setup Wizard** | Guided 4-step onboarding for new clubs |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router v6 |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL 16 (Docker) |
| AI | Google Gemini API (1.5 Pro for architecture, 1.5 Flash for routing/tags/summaries) |
| Storage | Google Drive API v3 (metadata-only — files stay in Drive) |
| Auth | Passport.js (local + Google OAuth 2.0) |
| Testing | Vitest + fast-check (property-based testing) |
| Bundler | Vite |

---

## 📁 Project Structure

```
├── client/                 # React frontend (Vite + TypeScript)
│   └── src/
│       ├── api/            # API client functions
│       ├── components/     # UI components (portal, upload, admin, search, etc.)
│       ├── contexts/       # Auth, Theme, Demo providers
│       ├── pages/          # Route page components
│       └── types/          # Shared TypeScript interfaces
├── server/                 # Express backend (TypeScript)
│   ├── prisma/             # Database schema, migrations, seed data
│   └── src/
│       ├── routes/         # 16 API route files
│       ├── services/       # 14 service classes (AI, Drive, upload, search, etc.)
│       ├── middleware/      # Auth, access control, validation
│       ├── jobs/           # Scheduled jobs (audit cleanup, webhook renewal)
│       └── tests/          # 7 property-based test files (22 tests)
├── .kiro/                  # Kiro development artifacts
│   ├── specs/intake-flow/  # Requirements → Design → Tasks
│   ├── steering/           # Team conventions and hackathon strategy
│   └── hooks/              # Agent automation hooks
└── docker-compose.yml      # PostgreSQL for local dev
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL)

### Setup

```bash
# Clone and install
git clone https://github.com/jonathanfitzgerald24/kirothon.git
cd kirothon
npm install

# Start PostgreSQL
docker compose up -d

# Set up environment
cp server/.env.example server/.env

# Run database migrations and seed demo data
cd server
npx prisma migrate dev
npx prisma db seed

# Start dev servers (two terminals)
cd server && npm run dev    # Terminal 1 — backend on :3001
cd client && npm run dev    # Terminal 2 — frontend on :5173
```

Open **http://localhost:5173**

### Demo Account
- **Email:** `admin@demo.intakeflow.app`
- **Password:** `demo1234`

The demo account comes pre-loaded with a Greek life club ("Alpha Beta Gamma") containing 7 folders, 10 files, 30 tags, and AI-generated summaries.

---

## 🔧 How Kiro Was Used

FileAtlas was built entirely using Kiro as our AI development environment. Here's how we leveraged each feature:

### Spec-Driven Development

Our entire project was structured through Kiro's **requirements-first spec workflow**:

- **Requirements document** (`.kiro/specs/intake-flow/requirements.md`) — 50 formal requirements with acceptance criteria, covering auth, Drive integration, AI architecture, upload routing, search, role management, and more
- **Technical design document** (`.kiro/specs/intake-flow/design.md`) — Complete system architecture, Prisma schema for 14 database models, API design for 60+ endpoints, Gemini prompt strategies, and component specifications
- **Implementation task list** (`.kiro/specs/intake-flow/tasks.md`) — 22 task groups with 150+ subtasks, each referencing specific requirements

The spec-driven approach was critical for a hackathon with two developers. Instead of vibe coding and hoping things fit together, we had a **shared contract** — the design doc defined every API response shape, every database model, and every component interface before a single line of code was written. This meant Cameron could build the frontend against the spec while Jonathan built the backend, and everything connected on the first try.

**Compared to vibe coding:** We used vibe coding for rapid iteration on UI polish and bug fixes in the final hours. But the core architecture — database schema, API surface, service layer — was all spec-driven. The spec approach was dramatically more effective for the structural work because it eliminated the back-and-forth of "what should this endpoint return?" and "what fields does this model have?"

### Vibe Coding

For the final sprint, we switched to conversational vibe coding for:
- **Fixing TypeScript errors** across Cameron's files — Kiro identified all 5 errors and fixed them in one pass
- **Wiring up the frontend to backend APIs** — fixing response shape mismatches between what the server returned and what React components expected
- **Building the demo-ready upload page** with mocked AI responses — Kiro generated the entire mock AI routing system with per-file-type intelligence in a single prompt
- **UI polish** — logo styling, color changes, and navigation fixes through rapid back-and-forth

The most impressive code generation was the **complete Prisma schema** — Kiro generated all 14 models with relations, indexes, enums, and constraints in a single delegation, matching the design doc exactly. It also generated the **full upload routing pipeline** (duplicate detection, AI confidence scoring, routing decisions, file placement) as a complete service class.

### Agent Hooks

We created three hooks to automate our workflow:

1. **`prettier-format-on-save`** — Auto-formats code files on every save, ensuring consistent style across both developers without manual formatting
2. **`auto-commit-on-task-complete`** — Automatically stages, commits, and pushes changes after each spec task completes, keeping the Git history clean and the remote always up-to-date
3. **`auto-pull-before-task`** — Pulls latest changes before starting each new task, preventing merge conflicts between the two developers

The hooks were essential for **parallel development**. With two people working on the same repo simultaneously, the auto-pull/push hooks ensured neither developer was ever working on stale code. The Prettier hook eliminated all style-related merge conflicts entirely.

### Steering Docs

Our steering file (`.kiro/steering/intakeflow-hackathon.md`) contained:

- **Hackathon context** — 13-hour time constraint, judging criteria, submission requirements
- **Team split** — Explicit file ownership (Cameron = `client/`, Jonathan = `server/`) to prevent conflicts
- **Code conventions** — TypeScript strict mode, named exports, async/await, component patterns
- **API contract** — Shared rules for endpoint prefixes, pagination, error formats, date formats
- **Time strategy** — MVP features vs nice-to-haves vs skip-for-hackathon, prioritized for demo impact

The steering doc was the **single most impactful Kiro feature** for team coordination. It meant every Kiro session on both machines followed the same conventions, used the same patterns, and knew which files to touch and which to leave alone. Without it, two developers using AI agents simultaneously would have produced incompatible code.

### MCP

We did not use MCP servers for this project. Our development workflow relied on Kiro's built-in tools (file editing, terminal, search) combined with the spec and steering docs. For future development, we'd explore MCP for Google Drive API testing and Gemini prompt iteration.

---

## 🔮 Future Plans

FileAtlas is currently a local demo. Post-hackathon plans include:

- **Production deployment** with a hosted PostgreSQL database
- **Real Gemini API integration** — replacing mocked AI responses with live Gemini calls for architecture proposals, upload routing, and semantic search
- **Full Google Drive sync** — webhook-based change detection and structural drift resolution
- **User safety** — rate limiting, input sanitization, CSRF protection
- **Mobile-responsive UI** — optimized for phone and tablet browsing

---

## 📊 By the Numbers

- **50** formal requirements with acceptance criteria
- **14** database models with full relations and indexes
- **60+** API endpoints across 16 route files
- **14** service classes handling business logic
- **22** property-based tests across 7 test files
- **150+** implementation subtasks in the spec
- **2** developers working in parallel for 13 hours
- **0** merge conflicts (thanks to steering docs and hooks)

---

## License

MIT
