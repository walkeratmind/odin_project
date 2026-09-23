import { useWorkItems } from '@/hooks/use-work-items';
import { useAppSelector } from '@/store';
import { WorkItemCard } from './WorkItemCard';

export function WorkItemList() {
  const statusFilter = useAppSelector((state) => state.filter.statusFilter);
  const status = statusFilter === 'ALL' ? undefined : statusFilter;
  const { data: items, isLoading, isError, error } = useWorkItems(status);

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

  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
        <p className="text-gray-500">No work items found.</p>
        <p className="mt-1 text-sm text-gray-400">
          {statusFilter !== 'ALL'
            ? 'Try changing the status filter.'
            : 'Work items will appear here when received from external systems.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <WorkItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}