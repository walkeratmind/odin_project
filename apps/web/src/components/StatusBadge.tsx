import type { WorkItemStatus } from '@/types/work-item';

const statusColors: Record<WorkItemStatus, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  ANALYSING: 'bg-yellow-100 text-yellow-800',
  READY_FOR_REVIEW: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

interface StatusBadgeProps {
  status: WorkItemStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}