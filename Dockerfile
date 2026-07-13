# Échoppe - Monorepo Dockerfile (Optimized)
# Build targets: api, admin
#
# Usage:
#   docker build --target api -t echoppe/api .
#   docker build --target admin --build-arg VITE_API_URL=https://api.example.com -t echoppe/admin .
#
# L'API applique les migrations SQL versionnées au démarrage (RUN_MIGRATIONS=1,
# dossier /app/drizzle) : plus de conteneur d'init séparé.
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
COPY packages/client/package.json ./packages/client/
COPY packages/content/package.json ./packages/content/
COPY packages/create-echoppe/package.json ./packages/create-echoppe/
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
# Migrations SQL versionnées appliquées au boot par l'API elle-même.
ENV RUN_MIGRATIONS=1
ENV MIGRATIONS_DIR=/app/drizzle

RUN addgroup -g 1001 -S echoppe && \
    adduser -S echoppe -u 1001

COPY --from=api-builder --chown=echoppe:echoppe /app/apps/api/api ./api
COPY --chown=echoppe:echoppe packages/core/drizzle ./drizzle

RUN mkdir -p /app/uploads && chown -R echoppe:echoppe /app/uploads

USER echoppe
EXPOSE 7532

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:7532/health || exit 1

CMD ["./api"]

# ==============================================================================
# Admin Dashboard
# ==============================================================================
# L'admin est un site STATIQUE (l'image finale est caddy servant dist/) : les assets
# compilés sont indépendants de l'architecture. On épingle donc le build vite sur la
# plateforme de build native ($BUILDPLATFORM) au lieu de le ré-exécuter sous émulation
# QEMU arm64 (~70× plus lent) pour un résultat identique. Seul le stage caddy final est
# cross-buildé par arch (copie d'assets arch-indépendants).
FROM --platform=$BUILDPLATFORM source AS admin-builder
ARG VITE_API_URL=http://localhost:7532
ENV VITE_API_URL=$VITE_API_URL
RUN bun run --cwd apps/admin build

FROM caddy:2-alpine AS admin
COPY --from=admin-builder /app/apps/admin/dist /srv
COPY apps/admin/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
