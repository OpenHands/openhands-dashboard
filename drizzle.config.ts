import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env.local first, fall back to .env
config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: './src/lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
