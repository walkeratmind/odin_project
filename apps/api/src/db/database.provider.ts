import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export const databaseProvider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: (): BetterSQLite3Database<typeof schema> => {
    const dbPath = process.env.DATABASE_URL ?? './data/odin.db';
    const sqlite = new Database(dbPath);
    // Enable WAL mode for better concurrency
    sqlite.pragma('journal_mode = WAL');
    return drizzle(sqlite, { schema });
  },
};