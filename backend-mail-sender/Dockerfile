# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

# Install native build tools required by bcrypt (node-gyp)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# ---- Stage 2: Runtime ----
FROM node:20-alpine

# Add labels
LABEL maintainer="nikhilraj"
LABEL description="Email Sender Backend Service"

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Create uploads and reports directories (used at runtime)
RUN mkdir -p uploads reports && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application (use node directly, not nodemon)
CMD ["node", "./bin/www"]
