import { z } from 'zod';

export const UpdateStatusSchema = z.object({
  status: z.enum([
    'RECEIVED',
    'ANALYSING',
    'READY_FOR_REVIEW',
    'COMPLETED',
    'FAILED',
  ]),
});

export type UpdateStatusRequest = z.infer<typeof UpdateStatusSchema>;