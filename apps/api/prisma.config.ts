import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env so DATABASE_URL is available for Prisma CLI commands
dotenv.config({ path: path.join(__dirname, '.env') });

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  seed: 'tsx prisma/seed.ts',
});
