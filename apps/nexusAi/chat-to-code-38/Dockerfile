# Dockerfile for NexusAi - Vite + React + TypeScript app
# Multi-stage build: 1) Install deps 2) Build 3) Serve with nginx

# Stage 1: Build stage
# Pin Bun to reduce lockfile format churn across releases.
FROM oven/bun:1.3.6 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
# NOTE: bun may update bun.lockb even when dependencies haven't changed (format/version churn).
# Using --frozen-lockfile can break CI/servers unexpectedly, so we install without freezing here.
RUN bun install

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Stage 2: Production stage - serve with nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
