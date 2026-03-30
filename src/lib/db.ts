import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _initAttempted = false;

export function getDb() {
  if (!_initAttempted) {
    _initAttempted = true;
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL environment variable is not set. Database features will be disabled.');
      return null;
    }
    try {
      // Neon supports prepared statements
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client, { schema });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      console.error('DATABASE_URL value:', process.env.DATABASE_URL ? '***SET***' : '***NOT SET***');
      return null;
    }
  }
  return _db;
}
