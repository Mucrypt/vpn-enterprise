# Dockerfile for NexusAi - Vite + React + TypeScript app
# Multi-stage build: 1) Install deps 2) Build 3) Serve with nginx

# Stage 1: Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

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
