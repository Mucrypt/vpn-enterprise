# Dockerfile for NexusAi - Vite + React + TypeScript app
# Multi-stage build: 1) Install deps 2) Build 3) Serve with nginx

# Stage 1: Build stage (Node + npm)
# Bun builds can fail on some hosts due to lockfile format churn or tooling edge cases.
# Using Node here is more predictable and we already have a package-lock.json.
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (includes devDependencies for Vite build)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production stage - serve with nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
