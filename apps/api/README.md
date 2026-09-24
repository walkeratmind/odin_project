# Odin API — NestJS Backend

AI-assisted work intake API with SQLite persistence and multi-provider LLM analysis.

## Quick Start

```bash
pnpm install
cp .env.example .env   # edit with your API keys
pnpm run start:dev      # http://localhost:3000
```

## Architecture

```
src/
├── ai/                     # AI provider abstraction
│   ├── providers/
│   │   ├── mock-ai.provider.ts
│   │   ├── groq.provider.ts       # groq-sdk
│   │   ├── openai.provider.ts     # fetch-based OpenAI
│   │   └── provider.registry.ts   # extensible registry + factory pattern
│   ├── ai.service.ts             # analysis orchestration + validation
│   ├── ai-config.service.ts      # runtime provider switching
│   ├── ai-config.controller.ts   # GET/PUT /ai-config
│   └── ai.module.ts
├── config/
│   └── app.config.ts             # typed config via @nestjs/config
├── db/
│   ├── schema.ts                 # Drizzle schema (work_items table)
│   ├── database.provider.ts      # Direct better-sqlite3 + auto-migrate + seed
│   ├── database.module.ts
│   └── seed.ts                   # 25 sample work items
├── work-items/
│   ├── work-items.controller.ts
│   ├── work-items.service.ts     # CRUD + analysis + retry
│   ├── work-items.module.ts
│   └── workflow/
│       └── workflow.service.ts    # state machine validation
├── common/                       # pipes, filters, interceptors
├── app.module.ts
└── main.ts
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | API server port |
| `DATABASE_URL` | No | `./data/odin.db` | SQLite database path |
| `GROQ_API_KEY` | No | — | Enables Groq provider |
| `GROQ_MODELS` | No | `openai/gpt-oss-20b` | Comma-separated Groq models |
| `OPENAI_API_KEY` | No | — | Enables OpenAI provider |
| `OPENAI_MODELS` | No | `gpt-4o-mini` | Comma-separated OpenAI models |

## API Endpoints

### Work Items

```bash
# Submit (idempotent on externalId)
curl -X POST http://localhost:3000/work-items \
  -H "Content-Type: application/json" \
  -d '{"externalId":"CRM-001","title":"Missing document","description":"Applicant has not submitted payslip."}'

# List (cursor-paginated, newest first)
curl http://localhost:3000/work-items
curl "http://localhost:3000/work-items?status=FAILED&limit=5"

# Stats
curl http://localhost:3000/work-items/stats

# Get by id
curl http://localhost:3000/work-items/1

# Trigger analysis
curl -X POST http://localhost:3000/work-items/1/analyse

# Retry failed analysis
curl -X POST http://localhost:3000/work-items/1/retry

# Manual status transition
curl -X PATCH http://localhost:3000/work-items/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"COMPLETED"}'
```

### AI Config

```bash
# List available providers + current selection
curl http://localhost:3000/ai-config

# Switch provider
curl -X PUT http://localhost:3000/ai-config \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq:openai/gpt-oss-20b"}'
```

### API Reference

Interactive Scalar docs at http://localhost:3000/reference

## Scripts

```bash
pnpm run build           # Compile TypeScript
pnpm run start:dev       # Dev server with hot reload
pnpm run start:prod      # Production (node dist/main)
pnpm run test            # Unit tests (vitest)
pnpm run test:e2e        # E2e tests (in-memory SQLite)
pnpm run lint            # Oxlint
pnpm run db:generate     # Generate drizzle migration
pnpm run db:migrate      # Apply migrations
pnpm run db:studio       # SQLite browser UI
```

## Testing

19 e2e tests covering CRUD, idempotent creation, all workflow transitions, AI success/failure/timeout/malformed output, retry, status filtering, pagination, and AI config switching. All tests use in-memory SQLite — no external dependencies.

```bash
pnpm run test:e2e
```