# syntax=docker/dockerfile:1

# ─── deps: install workspace deps (vite & co are devDependencies) ────────────
FROM node:22-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# ─── dev: vite dev server with HMR (compose target=dev) ──────────────────────
# compose.override.yml bind-mounts apps/web/src, vite.config.ts and
# packages/shared/src so edits hot-reload without rebuilding the image.
FROM deps AS dev
WORKDIR /app

COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
RUN pnpm --filter shared build

COPY apps/web/index.html apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/
COPY apps/web/src apps/web/src/
COPY apps/web/public apps/web/public/

EXPOSE 5173
# rebuild @odin/shared on boot so packages/shared edits survive a container restart
CMD ["sh", "-c", "pnpm --filter shared build && pnpm --filter web dev"]

# ─── builder: production bundle ──────────────────────────────────────────────
FROM deps AS builder

# Build shared package first
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
RUN pnpm --filter shared build

# Copy web source and build
COPY apps/web/index.html apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/
COPY apps/web/src apps/web/src/
COPY apps/web/public apps/web/public/
RUN pnpm --filter web build

# ─── prod: nginx static serving ──────────────────────────────────────────────
FROM nginx:stable-alpine AS prod

LABEL org.opencontainers.image.title="React App" \
      org.opencontainers.image.description="Vite + React + TypeScript" \
      org.opencontainers.image.base.name="nginx:stable-alpine"

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
