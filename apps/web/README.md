# Odin Web — React Frontend

Dashboard for viewing and managing work items processed by the Odin AI pipeline.

## Quick Start

```bash
pnpm install
pnpm run dev   # http://localhost:5173
```

Requires the API to be running on port 3000 (proxied via Vite).

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 + React Compiler | UI framework |
| TypeScript 6 | Type safety |
| Vite 8 | Build tool + dev server |
| TanStack Router | Type-safe routing |
| TanStack Query | Server state + caching |
| Redux Toolkit | Client state (filter) |
| Tailwind CSS v4 | Styling |
| React Compiler | Automatic memoisation |

## Architecture

```
src/
├── components/
│   ├── FilterBanner.tsx      # Status filter + dynamic AI provider dropdown
│   ├── WorkItemList.tsx      # Paginated card grid with load-more
│   ├── WorkItemCard.tsx      # Item detail, AI results, action buttons
│   └── StatusBadge.tsx       # Coloured status pill
├── hooks/
│   └── use-work-items.ts     # TanStack Query hooks (items, stats, AI config)
├── lib/
│   └── api.ts                # Axios client + API functions
├── store/
│   ├── index.ts              # Redux store setup
│   └── filter-slice.ts       # Status filter state
├── types/
│   └── work-item.ts          # Re-exports from @odin/shared
├── router.tsx                # TanStack Router config
└── App.tsx                   # Root component
```

## Features

- **Cursor-paginated item list** — newest first, load-more button
- **Status filter** — dropdown to filter by RECEIVED, ANALYSING, READY_FOR_REVIEW, COMPLETED, FAILED
- **Dynamic AI provider dropdown** — populated from `GET /ai-config`, shows all available models
- **Per-item actions** — analyse, retry, mark complete
- **AI analysis display** — category, priority, summary, recommended action, error message
- **Auto-refresh** — TanStack Query invalidates caches on mutations

## Scripts

```bash
pnpm run dev      # Dev server with HMR
pnpm run build    # Production build
pnpm run lint     # Oxlint
```

## Proxy

Vite proxies API requests to the backend:

```ts
// vite.config.ts
proxy: {
  '/work-items':     'http://localhost:3000',
  '/ai-config':      'http://localhost:3000',
  '/reference':      'http://localhost:3000',
  '/reference-json': 'http://localhost:3000',
}
```
