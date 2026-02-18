# ============================================
# Stage 1: Dependencies (cached layer)
# ============================================
FROM node:24-alpine AS deps

RUN npm install -g pnpm@10.10.0

WORKDIR /app

# Copy lockfiles first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM deps AS builder

WORKDIR /app

# Copy source code
COPY packages/api ./packages/api
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db
COPY packages/env ./packages/env
COPY packages/config ./packages/config
COPY apps/web ./apps/web
COPY turbo.json ./

# Build-time args passed from docker-compose.prod.yml (Dokploy envs)
ARG DATABASE_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG CORS_ORIGIN
ARG ENCRYPTION_KEY
ARG GAME_SDK_SECRET
ARG REDIS_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL

# Build the application with real Dokploy-provided values.
RUN DATABASE_URL="${DATABASE_URL}" \
    BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET}" \
    BETTER_AUTH_URL="${BETTER_AUTH_URL}" \
    CORS_ORIGIN="${CORS_ORIGIN}" \
    ENCRYPTION_KEY="${ENCRYPTION_KEY}" \
    GAME_SDK_SECRET="${GAME_SDK_SECRET}" \
    REDIS_URL="${REDIS_URL}" \
    NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
    NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" \
    pnpm --filter web build

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:24-alpine AS runner

RUN npm install -g pnpm@10.10.0

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output from builder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy packages needed at runtime (for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nextjs:nodejs /app/turbo.json ./

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_CACHE_DIR=/tmp/.turbo
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/trpc/healthCheck || exit 1

ENTRYPOINT ["/entrypoint.sh"]
