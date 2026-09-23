// ── Types ────────────────────────────────────────────
export type {
  WorkItemStatus,
  WorkItemPriority,
  WorkItem,
} from './types/work-item.js';

// ── DTOs (Zod schemas + inferred types) ─────────────
export {
  CreateWorkItemSchema,
  type CreateWorkItemRequest,
} from './dto/create-work-item.js';

export {
  UpdateStatusSchema,
  type UpdateStatusRequest,
} from './dto/update-status.js';

// ── Workflow ─────────────────────────────────────────
export { ALLOWED_TRANSITIONS } from './workflow/transitions.js';

// ── AI ───────────────────────────────────────────────
export type { AiAnalysis, AiProvider } from './ai/types.js';
export {
  AiAnalysisSchema,
  type AiAnalysisDto,
} from './ai/analysis-schema.js';