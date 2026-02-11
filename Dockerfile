# ============================================
# Stage 1: Dependencies (cached layer)
# ============================================
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

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

# Build the application
# Turbo will build dependencies in correct order
RUN pnpm run build --filter=web

# ============================================
# Stage 3: Production Runner
# ============================================
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

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
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/trpc/healthCheck || exit 1

ENTRYPOINT ["/entrypoint.sh"]
