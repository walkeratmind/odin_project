import axios from 'axios';
import type { WorkItem, CreateWorkItemRequest, UpdateStatusRequest } from '@/types/work-item';
import type { PaginatedResponse, WorkItemStats } from '@odin/shared';

const client = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchWorkItems(
  status?: string,
  cursor?: number,
  limit = 20,
): Promise<PaginatedResponse<WorkItem>> {
  const params: Record<string, string | number> = { limit };
  if (status) params.status = status;
  if (cursor) params.cursor = cursor;
  const { data } = await client.get<PaginatedResponse<WorkItem>>('/work-items', { params });
  return data;
}

export async function fetchWorkItemStats(): Promise<WorkItemStats> {
  const { data } = await client.get<WorkItemStats>('/work-items/stats');
  return data;
}

export async function fetchWorkItem(id: number): Promise<WorkItem> {
  const { data } = await client.get<WorkItem>(`/work-items/${id}`);
  return data;
}

export async function createWorkItem(dto: CreateWorkItemRequest): Promise<WorkItem> {
  const { data } = await client.post<WorkItem>('/work-items', dto);
  return data;
}

export async function analyseWorkItem(id: number): Promise<WorkItem> {
  const { data } = await client.post<WorkItem>(`/work-items/${id}/analyse`);
  return data;
}

export async function retryWorkItem(id: number): Promise<WorkItem> {
  const { data } = await client.post<WorkItem>(`/work-items/${id}/retry`);
  return data;
}

export async function updateWorkItemStatus(id: number, dto: UpdateStatusRequest): Promise<WorkItem> {
  const { data } = await client.patch<WorkItem>(`/work-items/${id}/status`, dto);
  return data;
}

// ── AI Config ─────────────────────────────────────────

export interface ProviderInfo {
  id: string;
  name: string;
  provider: string;
  model: string;
}

export interface AiConfig {
  selected: string;
  available: ProviderInfo[];
}

export async function fetchAiConfig(): Promise<AiConfig> {
  const { data } = await client.get<AiConfig>('/ai-config');
  return data;
}

export async function updateAiConfig(provider: string): Promise<AiConfig> {
  const { data } = await client.put<AiConfig>('/ai-config', { provider });
  return data;
}

// ── Admin ────────────────────────────────────────────

export async function resetDatabase(): Promise<{ message: string; count: number }> {
  const { data } = await client.post<{ message: string; count: number }>('/admin/reset');
  return data;
}