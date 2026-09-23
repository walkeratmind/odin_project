import { Injectable, Logger, Inject } from '@nestjs/common';
import { AiAnalysis } from './ai-provider.interface.js';
import type { AiProvider } from './ai-provider.interface.js';
import { AiAnalysisSchema } from './schemas/analysis.schema.js';
import { ZodError } from 'zod';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject('AI_PROVIDER') private readonly aiProvider: AiProvider,
  ) {}

  async analyse(title: string, description: string): Promise<AiAnalysis> {
    const timeoutMs = 30_000;

    try {
      const result = await this.withTimeout(
        this.aiProvider.analyse({ title, description }),
        timeoutMs,
      );

      // Validate with Zod
      const parsed = AiAnalysisSchema.parse(result);
      return parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        this.logger.warn('AI returned malformed output', error.issues);
        throw new Error('Malformed AI output');
      }
      throw error;
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), ms),
      ),
    ]);
  }
}