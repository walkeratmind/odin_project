import { z } from 'zod';

export const AiAnalysisSchema = z.object({
  category: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  summary: z.string().min(1),
  recommendedAction: z.string().min(1),
});

export type AiAnalysisDto = z.infer<typeof AiAnalysisSchema>;
