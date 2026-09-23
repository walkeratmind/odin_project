import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 seconds before refetch
      gcTime: 1000 * 60 * 5,       // 5 minutes garbage collection
      refetchOnWindowFocus: false, // not needed for assessment
      retry: (count, error: any) => {
        if (error?.response?.status === 404) return false;
        return count < 2;
      },
    },
  },
});
