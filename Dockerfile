# Échoppe - Monorepo Dockerfile (Optimized)
# Build targets: api, admin, init
#
# Usage:
#   docker build --target api -t echoppe/api .
#   docker build --target init -t echoppe/init .
#   docker build --target admin --build-arg VITE_API_URL=https://api.example.com -t echoppe/admin .
#
# NB : apps/store (exemple Astro) n'est pas distribué en image Docker. C'est un
# template de référence exécuté localement (bun dev/build) ou servi de base au
# scaffolding create-echoppe ; les vraies boutiques vivent dans leur propre repo.

# ==============================================================================
# Base stage
# ==============================================================================
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ==============================================================================
# Dependencies stage (all deps for build)
# ==============================================================================
FROM base AS deps
COPY package.json bun.lock ./
COPY packages/core/package.json ./packages/core/
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/admin/package.json ./apps/admin/
COPY apps/store/package.json ./apps/store/
COPY docs/package.json ./docs/
RUN bun install --frozen-lockfile

# ==============================================================================
# Source stage (shared)
# ==============================================================================
FROM base AS source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
COPY --from=deps /app/apps/store/node_modules ./apps/store/node_modules
COPY --from=deps /app/docs/node_modules ./docs/node_modules
COPY . .

# ==============================================================================
# Init (migrations only - minimal image)
# ==============================================================================
FROM base AS init
WORKDIR /app
RUN bun add drizzle-kit drizzle-orm postgres zod
COPY packages/core/drizzle.config.ts ./
COPY packages/core/src/db/schema ./src/db/schema
CMD ["bunx", "drizzle-kit", "push", "--force"]

# ==============================================================================
# API (compiled binary - no node_modules needed)
# ==============================================================================
FROM source AS api-builder
RUN bun build src/index.ts \
    --compile \
    --minify \
    --sourcemap=none \
    --outfile api \
    --target bun \
    --cwd apps/api

FROM oven/bun:1-alpine AS api
WORKDIR /app
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads

RUN addgroup -g 1001 -S echoppe && \
    adduser -S echoppe -u 1001

COPY --from=api-builder --chown=echoppe:echoppe /app/apps/api/api ./api

RUN mkdir -p /app/uploads && chown -R echoppe:echoppe /app/uploads

USER echoppe
EXPOSE 7532

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:7532/health || exit 1

CMD ["./api"]

# ==============================================================================
# Admin Dashboard
# ==============================================================================
FROM source AS admin-builder
ARG VITE_API_URL=http://localhost:7532
ENV VITE_API_URL=$VITE_API_URL
RUN bun run --cwd apps/admin build

FROM caddy:2-alpine AS admin
COPY --from=admin-builder /app/apps/admin/dist /srv
COPY apps/admin/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
