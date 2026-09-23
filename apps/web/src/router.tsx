import { createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { FilterBar } from '@/components/FilterBar';
import { WorkItemList } from '@/components/WorkItemList';

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
    return (
      <div className="space-y-6">
        <FilterBar />
        <WorkItemList />
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