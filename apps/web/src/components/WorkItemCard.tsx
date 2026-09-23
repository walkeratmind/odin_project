import type { WorkItem } from '@/types/work-item';
import { StatusBadge } from './StatusBadge';
import { useAnalyseWorkItem, useRetryWorkItem, useUpdateWorkItemStatus } from '@/hooks/use-work-items';

interface WorkItemCardProps {
  item: WorkItem;
}

export function WorkItemCard({ item }: WorkItemCardProps) {
  const analyseMutation = useAnalyseWorkItem();
  const retryMutation = useRetryWorkItem();
  const updateStatusMutation = useUpdateWorkItemStatus();

  const isActionable =
    item.status === 'RECEIVED' ||
    item.status === 'FAILED' ||
    item.status === 'READY_FOR_REVIEW';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-gray-900">{item.title}</h3>
          <p className="mt-1 text-sm text-gray-500">ID: {item.externalId}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <p className="mb-4 text-sm text-gray-600">{item.description}</p>

      {/* AI Analysis results */}
      {(item.category || item.priority || item.summary) && (
        <div className="mb-4 rounded-md bg-gray-50 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            AI Analysis
          </h4>
          <div className="space-y-1 text-sm">
            {item.category && (
              <p>
                <span className="font-medium text-gray-700">Category:</span>{' '}
                <span className="text-gray-600">{item.category}</span>
              </p>
            )}
            {item.priority && (
              <p>
                <span className="font-medium text-gray-700">Priority:</span>{' '}
                <span className="text-gray-600">{item.priority}</span>
              </p>
            )}
            {item.summary && (
              <p>
                <span className="font-medium text-gray-700">Summary:</span>{' '}
                <span className="text-gray-600">{item.summary}</span>
              </p>
            )}
            {item.recommendedAction && (
              <p>
                <span className="font-medium text-gray-700">Action:</span>{' '}
                <span className="text-gray-600">{item.recommendedAction}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {item.aiError && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <span className="font-medium">Error:</span> {item.aiError}
        </div>
      )}

      {/* Action buttons */}
      {isActionable && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {item.status === 'RECEIVED' && (
            <button
              onClick={() => analyseMutation.mutate(item.id)}
              disabled={analyseMutation.isPending}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {analyseMutation.isPending ? 'Analysing...' : 'Analyse'}
            </button>
          )}

          {item.status === 'FAILED' && (
            <button
              onClick={() => retryMutation.mutate(item.id)}
              disabled={retryMutation.isPending}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {retryMutation.isPending ? 'Retrying...' : 'Retry'}
            </button>
          )}

          {item.status === 'READY_FOR_REVIEW' && (
            <button
              onClick={() =>
                updateStatusMutation.mutate({ id: item.id, status: 'COMPLETED' })
              }
              disabled={updateStatusMutation.isPending}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {updateStatusMutation.isPending ? 'Completing...' : 'Mark Complete'}
            </button>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="mt-3 text-xs text-gray-400">
        Created: {new Date(item.createdAt).toLocaleString()}
      </p>
    </div>
  );
}