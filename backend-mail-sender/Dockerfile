# =============================================
#  Stage 1 — Install dependencies (builder)
# =============================================
FROM node:22-alpine AS deps

# Native build tools for bcrypt (node-gyp)
RUN apk add --no-cache python3 make g++

# Enable pnpm via corepack (pinned version for reproducibility)
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

WORKDIR /app

# Copy only manifests first → maximises Docker layer cache hits
COPY package.json pnpm-lock.yaml ./

# Install production deps only, skip optional & post-install scripts where safe
RUN pnpm install --frozen-lockfile --prod --ignore-scripts \
    && pnpm approve-builds bcrypt \
    && pnpm rebuild bcrypt

# =============================================
#  Stage 2 — Production runtime (minimal)
# =============================================
FROM node:22-alpine AS runtime

LABEL maintainer="nikhilraj"
LABEL description="Email Sender Backend – Production"

# ---- Security: non-root user ----
RUN addgroup -S app && adduser -S app -G app

# Install only the tiny runtime deps we need (wget for healthcheck, tini for PID 1)
RUN apk add --no-cache wget tini

WORKDIR /app

# Copy production node_modules from builder (no dev deps, no build tools)
COPY --from=deps --chown=app:app /app/node_modules ./node_modules

# Copy application source
COPY --chown=app:app . .

# Ensure runtime directories exist
RUN mkdir -p uploads reports tmp

# ---- Environment defaults ----
ENV NODE_ENV=production
ENV PORT=3000

# Drop privileges
USER app

# Expose the server port
EXPOSE 3000

# ---- Health check ----
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

# ---- Entrypoint ----
# tini ensures proper signal forwarding & zombie reaping inside the container
ENTRYPOINT ["tini", "--"]
CMD ["node", "./bin/www"]
