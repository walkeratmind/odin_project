# syntax=docker/dockerfile:1

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config and lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# Copy shared package source and build
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
RUN pnpm --filter shared build

# Copy api source and build
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src/
RUN pnpm --filter api build

# ─── Run stage ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/shared/package.json /app/packages/shared/
COPY --from=builder /app/packages/shared/dist /app/packages/shared/dist/
COPY --from=builder /app/apps/api/package.json /app/apps/api/
COPY --from=builder /app/apps/web/package.json /app/apps/web/
COPY --from=builder /app/apps/api/dist /app/apps/api/dist/

# Install prod deps only
RUN pnpm install --frozen-lockfile --prod

# Data directory for SQLite
RUN mkdir -p /app/apps/api/data
VOLUME /app/apps/api/data

ENV DATABASE_URL=./data/odin.db
ENV AI_PROVIDER=mock
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/work-items?limit=1 || exit 1

CMD ["node", "apps/api/dist/main.js"]