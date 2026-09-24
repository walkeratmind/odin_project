import { Injectable, Logger } from '@nestjs/common';
import type { AiProvider, AiAnalysis } from '@odin/shared';

@Injectable()
export class MockAiProvider implements AiProvider {
  private readonly logger = new Logger(MockAiProvider.name);

  async analyse(input: {
    title: string;
    description: string;
  }): Promise<AiAnalysis> {
    this.logger.log(`Mock analysing: "${input.title}"`);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result: AiAnalysis = {
      category: this.pickCategory(input.title, input.description),
      priority: 'MEDIUM',
      summary: input.description.length > 100
        ? input.description.substring(0, 100) + '...'
        : input.description,
      recommendedAction: this.pickAction(input.title),
    };

    this.logger.log(`Mock result: category=${result.category}, priority=${result.priority}`);
    return result;
  }

  private pickCategory(title: string, _description: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('fraud') || lower.includes('mismatch')) return 'FRAUD_ALERT';
    if (lower.includes('signature') || lower.includes('document') || lower.includes('missing')) return 'DOCUMENT_REQUEST';
    if (lower.includes('verification') || lower.includes('identity')) return 'VERIFICATION';
    if (lower.includes('loan') || lower.includes('approval')) return 'LOAN_APPROVAL';
    if (lower.includes('appraisal') || lower.includes('property')) return 'APPRAISAL';
    return 'INFORMATION_MISSING';
  }

  private pickAction(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('fraud')) return 'Escalate for fraud investigation.';
    if (lower.includes('signature') || lower.includes('missing')) return 'Request updated document from applicant.';
    if (lower.includes('verification') || lower.includes('identity')) return 'Complete verification checklist.';
    if (lower.includes('loan')) return 'Review loan terms and disburse.';
    return 'Review and take appropriate action.';
  }
}