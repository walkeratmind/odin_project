import { z } from 'zod';

export const CreateWorkItemSchema = z.object({
  externalId: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
});

export type CreateWorkItemRequest = z.infer<typeof CreateWorkItemSchema>;