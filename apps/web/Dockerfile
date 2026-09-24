# syntax=docker/dockerfile:1

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config + web package files
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# Copy shared package and build
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src/
RUN pnpm --filter shared build

# Copy web source and build
COPY apps/web/index.html apps/web/tsconfig.json apps/web/tsconfig.app.json apps/web/tsconfig.node.json apps/web/vite.config.ts apps/web/
COPY apps/web/src apps/web/src/
COPY apps/web/public apps/web/public/
RUN pnpm --filter web build

# ─── Serve stage ─────────────────────────────────────────────────────────────
FROM nginx:stable-alpine AS runner

LABEL org.opencontainers.image.title="React App" \
      org.opencontainers.image.description="Vite + React + TypeScript" \
      org.opencontainers.image.base.name="nginx:stable-alpine"

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]