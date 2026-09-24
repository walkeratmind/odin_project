# Odin — AI-Assisted Work Intake System

Monorepo for processing work items through an AI analysis pipeline. External systems submit work items via REST API; an LLM provider analyses each item (categorisation, priority, summary, recommended action); operations users review and complete items through the web dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript 6, React Compiler, Vite 8, TanStack Router + Query, Redux Toolkit, Tailwind CSS v4, Zod 4 |
| **Backend** | NestJS 12, TypeScript 6 (nodenext), Drizzle ORM + better-sqlite3, Zod 4 |
| **AI** | Provider abstraction — Mock (deterministic) + Groq (openai/gpt-oss-20b) |
| **Shared** | `@odin/shared` pnpm workspace package — types, Zod DTOs, workflow transitions, AI interfaces |
| **API Docs** | Scalar (OpenAPI reference at `/reference`) |
| **Testing** | Vitest, supertest (19 e2e tests) |
| **Dev** | pnpm workspace, Oxlint, Prettier |

## Quick Start

```bash
# Prerequisites: Node.js >= 24, pnpm >= 11
pnpm install
pnpm run dev          # starts api (port 3000) + web (port 5173)
```

Open http://localhost:5173 for the dashboard.

### Seed data

```bash
cd apps/api && npx tsx scripts/seed.ts   # 25 sample work items
```

## Docker

```bash
docker compose up --build
```

- **API** → http://localhost:3000
- **Web dashboard** → http://localhost:8080
- **API reference** → http://localhost:8080/reference

Environment variables (set in `compose.yml` or `.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `./data/odin.db` | SQLite database path |
| `AI_PROVIDER` | `mock` | `mock` or `groq` |
| `GROQ_API_KEY` | — | Required when switching to Groq |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Model to use with Groq |
| `PORT` | `3000` | API server port |

## API Reference

Interactive docs at `/reference` when the server is running.

### Endpoints

#### `POST /work-items` — Submit a work item

```bash
curl -X POST http://localhost:3000/work-items \
  -H "Content-Type: application/json" \
  -d '{"externalId":"CRM-001","title":"Missing document","description":"Applicant has not submitted payslip."}'
```

→ `201` — returns the created work item with `status: "RECEIVED"`

Idempotent on `externalId` — resubmitting the same ID returns the existing item.

---

#### `GET /work-items` — List work items (cursor-paginated)

```bash
# First page (newest first, default 20 per page)
curl http://localhost:3000/work-items

# Filter by status
curl "http://localhost:3000/work-items?status=FAILED"

# Custom page size + cursor
curl "http://localhost:3000/work-items?limit=5&cursor=42"
```

→ `200` — `{ items: [...], nextCursor: 25 }`

`nextCursor` is `null` when no more pages. Sort: `id DESC` (newest first).

---

#### `GET /work-items/stats` — Aggregate counts

```bash
curl http://localhost:3000/work-items/stats
```

→ `200` — `{ total: 153, counts: { RECEIVED: 45, ANALYSING: 12, READY_FOR_REVIEW: 30, COMPLETED: 54, FAILED: 12 } }`

---

#### `GET /work-items/:id` — Get a single work item

```bash
curl http://localhost:3000/work-items/1
```

→ `200` — the work item, or `404`

---

#### `POST /work-items/:id/analyse` — Trigger AI analysis

```bash
curl -X POST http://localhost:3000/work-items/1/analyse
```

→ `201` — item transitions `RECEIVED → ANALYSING → READY_FOR_REVIEW` on success, or `RECEIVED → ANALYSING → FAILED` on error

Only `RECEIVED` items can be analysed. Returns `409` otherwise.

---

#### `POST /work-items/:id/retry` — Retry a failed analysis

```bash
curl -X POST http://localhost:3000/work-items/23/retry
```

→ `201` — resets `FAILED → RECEIVED` then re-runs analysis. Only `FAILED` items. Returns `409` otherwise.

---

#### `PATCH /work-items/:id/status` — Update status

```bash
curl -X PATCH http://localhost:3000/work-items/9/status \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED"}'
```

→ `200` — allowed transitions only (see state machine below). Invalid transitions → `409`.

---

#### `GET /ai-config` — Get current AI provider

```bash
curl http://localhost:3000/ai-config
```

→ `200` — `{ provider: "mock" }`

---

#### `PUT /ai-config` — Switch AI provider

```bash
curl -X PUT http://localhost:3000/ai-config \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq"}'
```

→ `200` — `{ provider: "groq" }`. Requires `GROQ_API_KEY` env var.

---

### State Machine

```
RECEIVED → ANALYSING → READY_FOR_REVIEW → COMPLETED
                ↘ FAILED ↗ (retry)
```

| From | To | Trigger |
|------|----|---------|
| `RECEIVED` | `ANALYSING` | `POST /:id/analyse` |
| `ANALYSING` | `READY_FOR_REVIEW` | AI succeeds |
| `ANALYSING` | `FAILED` | AI fails / times out / malformed |
| `READY_FOR_REVIEW` | `COMPLETED` | `PATCH /:id/status` |
| `FAILED` | `RECEIVED` | `POST /:id/retry` (then analyse) |

### Error Response Format

```json
{
  "statusCode": 409,
  "code": "INVALID_WORKFLOW_TRANSITION",
  "message": "Cannot transition work item from COMPLETED to ANALYSING.",
  "timestamp": "2026-09-23T12:00:00.000Z",
  "path": "/work-items/5/status"
}
```

## Project Structure

```
odin_project/
├── compose.yml              # Docker Compose (api + web)
├── package.json             # Root workspace scripts
├── pnpm-workspace.yaml
├── AGENTS.md                # Developer guide
├── README.md
├── packages/
│   └── shared/              # @odin/shared — types, Zod DTOs, workflow, AI
│       ├── src/
│       │   ├── types/       # WorkItemStatus, WorkItemPriority, WorkItem
│       │   ├── dto/         # CreateWorkItemSchema, UpdateStatusSchema, PaginatedQuerySchema
│       │   ├── workflow/    # ALLOWED_TRANSITIONS
│       │   └── ai/          # AiAnalysis, AiProvider, AiAnalysisSchema
│       └── dist/            # Compiled JS + declarations
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── work-items/  # Controller, service, workflow validation
│   │   │   ├── ai/          # AiService, MockAiProvider, OpenAiProvider
│   │   │   ├── db/          # Drizzle schema + better-sqlite3 provider
│   │   │   └── common/      # ZodValidationPipe, filters, interceptors
│   │   ├── scripts/         # seed.ts
│   │   └── Dockerfile
│   └── web/                 # React + Vite frontend
│       ├── src/
│       │   ├── components/  # FilterBanner, WorkItemList, WorkItemCard, StatusBadge
│       │   ├── hooks/       # useWorkItems (infinite query), useWorkItemStats
│       │   ├── store/       # Redux Toolkit (filterSlice)
│       │   ├── lib/         # axios client, query client
│       │   └── types/       # Re-exports from @odin/shared
│       ├── nginx.conf
│       └── Containerfile
├── docs/adr/                # Architecture Decision Records
└── infra/                   # Legacy compose (superseded by root compose.yml)
```

## Commands

```bash
pnpm install              # Install all dependencies
pnpm run dev              # Start api + web in dev mode
pnpm run build            # Build shared → api → web
pnpm run lint             # Lint all packages
pnpm run test:e2e         # Run API e2e tests (19 tests)
pnpm run db:generate      # Generate Drizzle migration
pnpm run db:migrate       # Apply Drizzle migration
```
