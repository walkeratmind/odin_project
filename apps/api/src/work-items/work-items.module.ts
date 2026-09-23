import { Module } from '@nestjs/common';
import { WorkItemsController } from './work-items.controller.js';
import { WorkItemsService } from './work-items.service.js';
import { WorkflowService } from './workflow/workflow.service.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [AiModule],
  controllers: [WorkItemsController],
  providers: [WorkItemsService, WorkflowService],
})
export class WorkItemsModule {}