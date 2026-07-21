// ============================================================================
// VETTED Platform - Prisma v7 Configuration
// ============================================================================
// Purpose: Centralized database connection configuration for Prisma v7+
// Breaking Change: url is no longer defined in schema.prisma
// ============================================================================

import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
