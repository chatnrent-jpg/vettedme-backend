// ============================================================================
// VETTED Platform - Centralized Prisma Client Instance
// ============================================================================
// Purpose: Single source of truth for Prisma Client instantiation
// Compatible with Prisma v7+ configuration model
// ============================================================================

import { PrismaClient } from '@prisma/client';

// Prisma Client Singleton Pattern (prevents multiple instances in development)
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
