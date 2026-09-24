# syntax=docker/dockerfile:1

# ─── deps: install workspace deps ────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# ─── builder: compile shared + web ───────────────────────────────────────────
FROM deps AS builder

COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
RUN pnpm --filter shared build

COPY apps/web/index.html apps/web/tsconfig.json apps/web/tsconfig.app.json \
     apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/
COPY apps/web/src apps/web/src/
COPY apps/web/public apps/web/public/
RUN pnpm --filter web build

# ─── prod: Caddy serving static files ────────────────────────────────────────
FROM caddy:2-alpine AS prod

COPY --from=builder /app/apps/web/dist /srv
COPY apps/web/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80 3000