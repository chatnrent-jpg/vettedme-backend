// Prisma v7 config (root-level). Loads DATABASE_URL for migrate/db push/seed.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // Uromi Trust Infrastructure seed — same runtime as npm run db:seed
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
