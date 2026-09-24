import { Injectable, Logger } from '@nestjs/common';
import type { AiAnalysis } from '@odin/shared';
import { AiAnalysisSchema } from '@odin/shared';
import { AiConfigService } from './ai-config.service.js';
import { ZodError } from 'zod';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiConfig: AiConfigService,
  ) {}

  async analyse(title: string, description: string): Promise<AiAnalysis> {
    const timeoutMs = 30_000;
    const provider = this.aiConfig.getProvider();
    const config = this.aiConfig.getConfig();
    const info = config.available.find(i => i.id === config.selected);
    this.logger.log(`Analysing with ${info?.name ?? config.selected}: "${title}"`);

    try {
      const result = await this.withTimeout(
        provider.analyse({ title, description }),
        timeoutMs,
      );

      // Validate with Zod
      const parsed = AiAnalysisSchema.parse(result);
      this.logger.log(`Analysis complete: category=${parsed.category}, priority=${parsed.priority}`);
      return parsed;
    } catch (error) {
      if (error instanceof ZodError) {
        this.logger.warn('AI returned malformed output', error.issues);
        throw new Error('Malformed AI output');
      }
      this.logger.error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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