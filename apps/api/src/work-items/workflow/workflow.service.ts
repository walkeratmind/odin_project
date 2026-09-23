import { Injectable, ConflictException } from '@nestjs/common';
import { ALLOWED_TRANSITIONS, type WorkItemStatus } from '@odin/shared';

@Injectable()
export class WorkflowService {
  /**
   * Validates that the requested transition is allowed.
   * Throws 409 Conflict if not.
   */
  validateTransition(current: WorkItemStatus, next: WorkItemStatus): void {
    const allowed = ALLOWED_TRANSITIONS[current];

    if (!allowed || !allowed.includes(next)) {
      throw new ConflictException({
        code: 'INVALID_WORKFLOW_TRANSITION',
        message: `Cannot transition work item from ${current} to ${next}.`,
      });
    }
  }

  /**
   * Validates that a work item is eligible for retry.
   * Only FAILED items can be retried.
   */
  validateRetry(current: WorkItemStatus): void {
    if (current !== 'FAILED') {
      throw new ConflictException({
        code: 'RETRY_NOT_ALLOWED',
        message: `Only FAILED work items can be retried. Current status: ${current}.`,
      });
    }
  }

  /**
   * Validates that a work item is eligible for analysis.
   * Only RECEIVED items can start analysis.
   */
  validateCanAnalyse(current: WorkItemStatus): void {
    if (current !== 'RECEIVED') {
      throw new ConflictException({
        code: 'ANALYSIS_NOT_ALLOWED',
        message: `Only RECEIVED work items can be analysed. Current status: ${current}.`,
      });
    }
  }
}