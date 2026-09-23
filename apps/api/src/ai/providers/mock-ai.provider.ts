import { Injectable } from '@nestjs/common';
import { AiProvider, AiAnalysis } from '../ai-provider.interface.js';

@Injectable()
export class MockAiProvider implements AiProvider {
  async analyse(input: {
    title: string;
    description: string;
  }): Promise<AiAnalysis> {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      category: 'DOCUMENT_REQUEST',
      priority: 'HIGH',
      summary: `Analysis of: ${input.title}`,
      recommendedAction: `Action for: ${input.description.substring(0, 50)}`,
    };
  }
}