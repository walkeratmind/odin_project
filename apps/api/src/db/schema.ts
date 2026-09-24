import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const workItems = sqliteTable('work_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalId: text('external_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('RECEIVED'),

  category: text('category'),
  priority: text('priority'),
  summary: text('summary'),
  recommendedAction: text('recommended_action'),

  aiError: text('ai_error'),

  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  statusIdx: index('status_idx').on(table.status),
}));
