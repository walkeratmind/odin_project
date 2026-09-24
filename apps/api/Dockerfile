# syntax=docker/dockerfile:1

# ─── deps: install workspace deps ────────────────────────────────────────────
# better-sqlite3 has no prebuilt binary for alpine/musl, so node-gyp needs
# python3 + make + g++ or `pnpm install` fails during the postinstall.
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++ \
 && corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config + every package.json referenced by the lockfile
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# cache-mount: node-gyp header downloads survive across stages & rebuilds
RUN --mount=type=cache,id=node-gyp,target=/root/.cache/node-gyp \
    pnpm install --frozen-lockfile

# ─── builder: compile shared + api ───────────────────────────────────────────
FROM deps AS builder

COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
RUN pnpm --filter shared build

COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src/
RUN pnpm --filter api build

# ─── dev: hot-reload watcher (compose target=dev) ────────────────────────────
# Full node_modules (incl. nest CLI) + source baked for first boot.
# compose.override.yml bind-mounts apps/api/src, apps/api/data and
# packages/shared/src so edits are picked up by nest --watch without rebuilds.
FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development \
    PORT=3000

COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src/
COPY apps/api/drizzle apps/api/drizzle/
COPY apps/api/data/seed.json apps/api/data/seed.json

EXPOSE 3000
# rebuild @odin/shared on boot so packages/shared edits survive a container restart
CMD ["sh", "-c", "pnpm --filter shared build && pnpm --filter api start:dev"]

# ─── prod: runtime image (Docker Compose & Render compatible) ──────────────────
FROM node:22-alpine AS prod
WORKDIR /app

# toolchain only needed while compiling better-sqlite3 during install
RUN apk add --no-cache --virtual .gyp python3 make g++ \
 && corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN --mount=type=cache,id=node-gyp,target=/root/.cache/node-gyp \
    pnpm install --frozen-lockfile --prod \
 && apk del .gyp

COPY --from=builder /app/packages/shared/dist packages/shared/dist/
COPY --from=builder /app/apps/api/dist apps/api/dist/
# migrations ship with the image (versioned with the code)
COPY apps/api/drizzle apps/api/drizzle/
COPY apps/api/data/seed.json apps/api/templates/seed.json

# data/ dir is the volume mount point (Railway / Docker Compose)
RUN mkdir -p /app/apps/api/data

ENV NODE_ENV=production \
    DATABASE_URL=/app/apps/api/data/odin.db \
    SEED_PATH=/app/apps/api/templates/seed.json \
    MIGRATIONS_DIR=/app/apps/api/drizzle \
    AI_PROVIDER=mock \
    PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
