import { useAppDispatch, useAppSelector } from '@/store';
import { setStatusFilter } from '@/store/filter-slice';
import type { WorkItemStatus } from '@/types/work-item';
import type { WorkItemStats } from '@odin/shared';

const statusOptions: (WorkItemStatus | 'ALL')[] = [
  'ALL',
  'RECEIVED',
  'ANALYSING',
  'READY_FOR_REVIEW',
  'COMPLETED',
  'FAILED',
];

interface FilterBannerProps {
  stats: WorkItemStats | undefined;
  loadedCount: number;
}

export function FilterBanner({ stats, loadedCount }: FilterBannerProps) {
  const dispatch = useAppDispatch();
  const statusFilter = useAppSelector((state) => state.filter.statusFilter);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
          Filter by status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) =>
            dispatch(setStatusFilter(e.target.value as WorkItemStatus | 'ALL'))
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All statuses' : status.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="text-sm text-gray-500">
        {stats ? (
          <span>
            Showing <strong className="text-gray-700">{loadedCount}</strong> of{' '}
            <strong className="text-gray-700">{stats.total}</strong> items
          </span>
        ) : (
          <span>Loading stats...</span>
        )}
      </div>
    </div>
  );
}