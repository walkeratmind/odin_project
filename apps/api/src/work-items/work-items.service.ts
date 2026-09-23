import { Injectable, Logger, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { DRIZZLE_PROVIDER } from '../db/database.provider.js';
import { WorkflowService } from './workflow/workflow.service.js';
import { AiService } from '../ai/ai.service.js';
import type { CreateWorkItemRequest, UpdateStatusRequest, WorkItemStatus } from '@odin/shared';

type WorkItem = typeof schema.workItems.$inferSelect;
type NewWorkItem = typeof schema.workItems.$inferInsert;

@Injectable()
export class WorkItemsService {
  private readonly logger = new Logger(WorkItemsService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly workflowService: WorkflowService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Create a new work item. If externalId already exists, return the existing item
   * (idempotent creation). Handles concurrent duplicate requests via the database
   * UNIQUE constraint as the final guard.
   */
  async create(dto: CreateWorkItemRequest): Promise<WorkItem> {
    const now = new Date().toISOString();

    // Fast path: check if already exists
    const existing = this.db
      .select()
      .from(schema.workItems)
      .where(eq(schema.workItems.externalId, dto.externalId))
      .get();

    if (existing) {
      this.logger.log(
        `Idempotent create — returning existing item ${existing.id} for externalId=${dto.externalId}`,
      );
      return existing;
    }

    const values: NewWorkItem = {
      externalId: dto.externalId,
      title: dto.title,
      description: dto.description,
      status: 'RECEIVED',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = this.db
        .insert(schema.workItems)
        .values(values)
        .returning()
        .get();
      this.logger.log(
        `Work item created: id=${result.id}, externalId=${result.externalId}`,
      );
      return result;
    } catch (error) {
      // Handle concurrent duplicate: another request inserted the same externalId
      // between our SELECT and INSERT. The UNIQUE constraint caught it.
      if (
        error instanceof Error &&
        error.message.includes('UNIQUE constraint')
      ) {
        const concurrent = this.db
          .select()
          .from(schema.workItems)
          .where(eq(schema.workItems.externalId, dto.externalId))
          .get();

        if (concurrent) {
          this.logger.log(
            `Race condition resolved — returning concurrently created item ${concurrent.id} for externalId=${dto.externalId}`,
          );
          return concurrent;
        }
      }
      throw error;
    }
  }

  /**
   * List all work items, optionally filtered by status.
   */
  async findAll(status?: string): Promise<WorkItem[]> {
    if (status) {
      return this.db
        .select()
        .from(schema.workItems)
        .where(eq(schema.workItems.status, status))
        .all();
    }
    return this.db.select().from(schema.workItems).all();
  }

  /**
   * Find a work item by ID. Throws 404 if not found.
   */
  async findById(id: number): Promise<WorkItem> {
    const item = this.db
      .select()
      .from(schema.workItems)
      .where(eq(schema.workItems.id, id))
      .get();

    if (!item) {
      throw new NotFoundException(`Work item with id ${id} not found`);
    }
    return item;
  }

  /**
   * Update the status of a work item. Validates the transition.
   */
  async updateStatus(id: number, dto: UpdateStatusRequest): Promise<WorkItem> {
    const item = await this.findById(id);

    this.workflowService.validateTransition(
      item.status as WorkItemStatus,
      dto.status,
    );

    return this.updateItemStatus(item.id, dto.status);
  }

  /**
   * Trigger AI analysis for a RECEIVED work item.
   */
  async analyse(id: number): Promise<WorkItem> {
    const item = await this.findById(id);

    this.workflowService.validateCanAnalyse(item.status as WorkItemStatus);

    // Transition to ANALYSING
    await this.updateItemStatus(item.id, 'ANALYSING');

    try {
      this.logger.log(`Starting analysis for work item ${item.id}`);
      const analysis = await this.aiService.analyse(
        item.title,
        item.description,
      );

      // Apply analysis results
      const updated = this.db
        .update(schema.workItems)
        .set({
          status: 'READY_FOR_REVIEW',
          category: analysis.category,
          priority: analysis.priority,
          summary: analysis.summary,
          recommendedAction: analysis.recommendedAction,
          aiError: null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.workItems.id, item.id))
        .returning()
        .get();

      this.logger.log(`Analysis succeeded for work item ${item.id}`);
      return updated;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown AI error';

      this.logger.warn(
        `Analysis failed for work item ${item.id}: ${errorMessage}`,
      );

      // Transition to FAILED and store the error
      const updated = this.db
        .update(schema.workItems)
        .set({
          status: 'FAILED',
          aiError: errorMessage,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(schema.workItems.id, item.id))
        .returning()
        .get();

      return updated;
    }
  }

  /**
   * Retry a FAILED work item. Resets to RECEIVED and re-runs analysis.
   */
  async retry(id: number): Promise<WorkItem> {
    const item = await this.findById(id);

    this.workflowService.validateRetry(item.status as WorkItemStatus);

    // Reset to RECEIVED first, then re-run analysis
    await this.updateItemStatus(item.id, 'RECEIVED');
    return this.analyse(id);
  }

  /**
   * Internal helper: update only the status + timestamp of a work item.
   */
  private async updateItemStatus(
    id: number,
    status: WorkItemStatus,
  ): Promise<WorkItem> {
    return this.db
      .update(schema.workItems)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.workItems.id, id))
      .returning()
      .get();
  }
}