/**
 * Standalone seed — force re-seed. Reads from data/seed.json.
 * Run: cd apps/api && npx tsx scripts/seed.ts
 */
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../src/db/schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedData = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'seed.json'), 'utf-8'),
);

const dbPath = process.env.DATABASE_URL ?? './data/odin.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite, { schema });

const now = new Date().toISOString();
for (const item of seedData) {
  db.insert(schema.workItems).values({ ...item, createdAt: now, updatedAt: now }).run();
}

console.log(`Seeded ${seedData.length} work items into ${dbPath}`);
sqlite.close();