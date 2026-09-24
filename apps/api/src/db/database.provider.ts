import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as schema from './schema.js';
import { seedIfEmpty } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'drizzle');

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export const databaseProvider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: async (): Promise<BetterSQLite3Database<typeof schema>> => {
    const dbPath = process.env.DATABASE_URL ?? './data/odin.db';
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');

    const db = drizzle(sqlite, { schema });

    // Auto-apply migrations on startup
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });

    // Seed if empty
    const seeded = seedIfEmpty(db);
    if (seeded > 0) {
      console.log(`Seeded ${seeded} work items into ${dbPath}`);
    }

    return db;
  },
};