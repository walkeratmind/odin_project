export type WorkItemStatus =
  | 'RECEIVED'
  | 'ANALYSING'
  | 'READY_FOR_REVIEW'
  | 'COMPLETED'
  | 'FAILED';

export type WorkItemPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WorkItem {
  id: number;
  externalId: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  category: string | null;
  priority: WorkItemPriority | null;
  summary: string | null;
  recommendedAction: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}