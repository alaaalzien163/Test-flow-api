# ---------------------------------------------------------------------------
# TaskFlow API - production Dockerfile (multi-stage)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Stage 1: builder
# Installs all dependencies, generates the Prisma client and compiles the
# NestJS application to plain JavaScript in /app/dist.
# ---------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Prisma needs OpenSSL at generate time to select the query engine that matches
# the runtime image (Debian bookworm ships OpenSSL 3).
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Generate the Prisma client from the schema (no database connection needed).
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the source and compile the application.
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: runner
# Minimal production image: production dependencies, compiled output and the
# generated Prisma client only. Runs as the non-root "node" user.
# ---------------------------------------------------------------------------
FROM node:22-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

# OpenSSL runtime library required by the Prisma query engine.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Production dependencies only (no dev dependencies, no build tools).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled NestJS application.
COPY --from=builder /app/dist ./dist

# Prisma client generated in the builder stage (not produced by npm ci).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Run as the built-in non-root user provided by the official Node image.
USER node

EXPOSE 3000

# Start the compiled application in production mode.
CMD ["node", "dist/main"]
