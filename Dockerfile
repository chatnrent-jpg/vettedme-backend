# Multi-stage Dockerfile for VETTED Backend
# Optimized for production deployment with minimal image size

# ===============================================
# Stage 1: Dependencies
# ===============================================
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# ===============================================
# Stage 2: Builder
# ===============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ===============================================
# Stage 3: Production Dependencies
# ===============================================
FROM node:20-alpine AS production-dependencies

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# ===============================================
# Stage 4: Production Runtime
# ===============================================
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    wget

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=production-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=nodejs:nodejs /app/prisma ./prisma
COPY --chown=nodejs:nodejs package*.json ./

# Create storage directory for W-8BEN forms
RUN mkdir -p /app/storage/tax_docs && \
    chown -R nodejs:nodejs /app/storage

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]

# ===============================================
# Stage 5: Development
# ===============================================
FROM node:20-alpine AS development

# Install development tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl \
    git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Development command (with hot reload)
CMD ["npm", "run", "dev"]
