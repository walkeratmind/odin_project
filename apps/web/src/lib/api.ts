import axios from 'axios';
import type { WorkItem, CreateWorkItemRequest, UpdateStatusRequest } from '@/types/work-item';

const client = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
});

export async function fetchWorkItems(status?: string): Promise<WorkItem[]> {
  const params = status ? { status } : undefined;
  const { data } = await client.get<WorkItem[]>('/work-items', { params });
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