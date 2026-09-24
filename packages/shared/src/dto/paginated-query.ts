import { z } from 'zod';
import type { WorkItemStatus } from '../types/work-item.js';

export const PaginatedQuerySchema = z.object({
  status: z
    .enum([
      'RECEIVED',
      'ANALYSING',
      'READY_FOR_REVIEW',
      'COMPLETED',
      'FAILED',
    ])
    .optional(),
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginatedQuery = z.infer<typeof PaginatedQuerySchema>;

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: number | null;
}

export interface WorkItemStats {
  total: number;
  counts: Record<WorkItemStatus, number>;
}