
# ADR-002: Monolith Project Structure

**Status:** Proposed
**Date:** 2026-09-23
**Deciders:** Rakesh

---

## Context

The project ackend:

- `apps/api/` — NestJS API (identical copy)

And a frontend:

- `apps/web/` — React + Vite + TanStack

---

## Decision

Consolidate into a pnpm workspace monorepo under `apps/`:

```
odin_project/
├── AGENTS.md
├── README.md
├── package.json              # Root workspace config
├── pnpm-workspace.yaml       # packages: ['apps/*']
├── docs/
│   └── adr/
├── apps/
│   ├── api/                  # NestJS backend (canonical)
│   └── web/                  # React frontend
└── infra/                    # Docker compose (to be created)
```

---

## Migration Steps

### Step 1: Delete the duplicate backend

```bash
rm -rf backend/
```

`apps/api/` contains the identical codebase and is the canonical location.

### Step 2: Create root `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
```

### Step 3: Create root `package.json`

```json
{
  "name": "odin",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter api dev & pnpm --filter web dev",
    "build": "pnpm --filter api build && pnpm --filter web build",
    "test": "pnpm --filter api test",
    "test:e2e": "pnpm --filter api test:e2e",
    "lint": "pnpm --filter api lint && pnpm --filter web lint",
    "format": "pnpm --filter api format && pnpm --filter web format",
    "db:generate": "pnpm --filter api db:generate",
    "db:migrate": "pnpm --filter api db:migrate"
  }
}
```

### Step 4: Update `AGENTS.md` commands

Change all `cd backend &&` to `cd apps/api &&`:

```bash
# Install dependencies (from repo root)
cd apps/api && pnpm install
cd apps/web && pnpm install

# Tests
cd apps/api && pnpm run test
cd apps/api && pnpm run test:e2e

# Lint + type check
cd apps/api && pnpm run lint
cd apps/web && pnpm run lint

# DB migrations
cd apps/api && npx drizzle-kit generate
cd apps/api && npx drizzle-kit migrate
```

### Step 5: Create `infra/docker-compose.yml`

```yaml
services:
  api:
    build:
      context: ../apps/api
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    volumes:
      - ../apps/api/src:/app/src
      - ../apps/api/data:/app/data
    environment:
      - DATABASE_URL=./data/odin.db
      - AI_PROVIDER=mock
    develop:
      watch:
        - action: sync
          path: ../apps/api/src
          target: /app/src
        - action: rebuild
          path: ../apps/api/package.json

  web:
    build:
      context: ../apps/web
      dockerfile: Dockerfile
    ports:
      - '5173:5173'
    volumes:
      - ../apps/web/src:/app/src
    develop:
      watch:
        - action: sync
          path: ../apps/web/src
          target: /app/src
```

### Step 6: Verify

```bash
# From repo root
pnpm install
pnpm run test:e2e   # Should pass 16/16
pnpm run dev         # Both api and web start
```

---

## Consequences

### Positive
- Single source of truth — no duplicated backend code
- Root scripts for common operations (`pnpm dev` starts both)
- Standard pnpm workspace structure

### Negative
- Requires updating all documentation references from `backend/` to `apps/api/`
- Dockerfiles need to be created for both services
```

---

## Summary of what you need to do

| Step | Action |
|------|--------|
| 1 | `mkdir -p docs/adr` |
| 2 | Create `docs/adr/001-backend-architecture.md` (content above) |
| 3 | Create `docs/adr/002-monolith-structure.md` (content above) |
| 4 | `rm -rf backend/` — delete the duplicate |
| 5 | Create root `pnpm-workspace.yaml` with `packages: ['apps/*']` |
| 6 | Create root `package.json` with workspace scripts |
| 7 | Update `AGENTS.md` paths from `backend/` → `apps/api/` |
| 8 | `pnpm install` from root to verify workspaces resolve |

The backend code in `apps/api/` is already complete and tested (16/16 e2e passing). The monolith migration is purely structural — no code changes needed.
