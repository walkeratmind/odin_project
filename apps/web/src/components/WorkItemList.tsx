import type { WorkItem } from '@/types/work-item';
import { WorkItemCard } from './WorkItemCard';

interface WorkItemListProps {
  items: WorkItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  total: number | undefined;
  onLoadMore: () => void;
}

export function WorkItemList({
  items,
  isLoading,
  isError,
  error,
  isFetchingNextPage,
  hasNextPage,
  total,
  onLoadMore,
}: WorkItemListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
        <span className="ml-3 text-gray-500">Loading work items...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">
          Failed to load work items: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-500">No work items found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <WorkItemCard key={item.id} item={item} />
        ))}
      </div>

      {/* Load more / terminal message */}
      <div className="flex justify-center">
        {hasNextPage ? (
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        ) : total !== undefined && items.length > 0 ? (
          <p className="text-sm text-gray-400">All {total} items loaded</p>
        ) : null}
      </div>
    </div>
  );
}