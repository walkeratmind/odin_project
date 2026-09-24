import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { FilterBanner } from '@/components/FilterBanner';
import { WorkItemList } from '@/components/WorkItemList';
import { useWorkItems, useWorkItemStats } from '@/hooks/use-work-items';
import { useAppSelector } from '@/store';

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <h1 className="text-2xl font-bold text-gray-900">Odin Work Intake</h1>
          <p className="mt-1 text-sm text-gray-500">
            AI-assisted work item processing system
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: function IndexPage() {
    const statusFilter = useAppSelector((state) => state.filter.statusFilter);
    const status = statusFilter === 'ALL' ? undefined : statusFilter;

    const {
      data: pages,
      isLoading,
      isError,
      error,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
    } = useWorkItems(status);

    const { data: stats } = useWorkItemStats();

    const items = pages?.pages.flatMap((p) => p.items) ?? [];

    return (
      <div className="space-y-6">
        <FilterBanner stats={stats} loadedCount={items.length} />
        <WorkItemList
          items={items}
          isLoading={isLoading}
          isError={isError}
          error={error as Error | null}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          total={stats?.total}
          onLoadMore={() => fetchNextPage()}
        />
      </div>
    );
  },
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}