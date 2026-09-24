import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { count, sql } from 'drizzle-orm';
import * as schema from './schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = process.env.SEED_PATH ?? join(__dirname, '..', '..', 'data', 'seed.json');

interface SeedItem {
  externalId: string;
  title: string;
  description: string;
  status: string;
  category?: string | null;
  priority?: string | null;
  summary?: string | null;
  recommendedAction?: string | null;
  error?: string | null;
}

function loadSeedData(): SeedItem[] {
  const raw = readFileSync(SEED_PATH, 'utf-8');
  return JSON.parse(raw) as SeedItem[];
}

/** Seed only if the table is empty. Returns the number of rows inserted. */
export function seedIfEmpty(db: BetterSQLite3Database<typeof schema>): number {
  const [{ value: rowCount }] = db
    .select({ value: count() })
    .from(schema.workItems)
    .all();

  if (rowCount > 0) return 0;

  const items = loadSeedData();
  const now = new Date().toISOString();

  for (const item of items) {
    db.insert(schema.workItems)
      .values({
        ...item,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return items.length;
}

/**
 * Truncate all rows and re-seed from seed.json.
 * Exposed at POST /admin/reset.
 */
export function resetAndSeed(db: BetterSQLite3Database<typeof schema>): number {
  db.run(sql`DELETE FROM work_items`);
  db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'work_items'`);

  const items = loadSeedData();
  const now = new Date().toISOString();

  for (const item of items) {
    db.insert(schema.workItems)
      .values({
        ...item,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return items.length;
}