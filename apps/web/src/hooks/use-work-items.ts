import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkItems,
  fetchWorkItem,
  fetchWorkItemStats,
  analyseWorkItem,
  retryWorkItem,
  updateWorkItemStatus,
} from '@/lib/api';
import type { WorkItemStatus } from '@/types/work-item';

export function useWorkItems(status?: string) {
  return useInfiniteQuery({
    queryKey: ['work-items', { status }],
    queryFn: ({ pageParam }) => fetchWorkItems(status, pageParam as number | undefined),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useWorkItemStats() {
  return useQuery({
    queryKey: ['work-items', 'stats'],
    queryFn: fetchWorkItemStats,
    staleTime: 10_000,
  });
}

export function useWorkItem(id: number) {
  return useQuery({
    queryKey: ['work-items', id],
    queryFn: () => fetchWorkItem(id),
    enabled: id > 0,
  });
}

export function useAnalyseWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => analyseWorkItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}

export function useRetryWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => retryWorkItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}

export function useUpdateWorkItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: WorkItemStatus }) =>
      updateWorkItemStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-items'] });
    },
  });
}