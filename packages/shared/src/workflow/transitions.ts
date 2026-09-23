import type { WorkItemStatus } from '../types/work-item.js';

/**
 * Allowed transitions map.
 * Only these transitions are valid — everything else is rejected with 409.
 */
export const ALLOWED_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  RECEIVED: ['ANALYSING'],
  ANALYSING: ['READY_FOR_REVIEW', 'FAILED'],
  READY_FOR_REVIEW: ['COMPLETED'],
  COMPLETED: [],
  FAILED: ['ANALYSING'], // only via retry
};