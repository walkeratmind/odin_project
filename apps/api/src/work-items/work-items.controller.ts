import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { WorkItemsService } from './work-items.service.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  CreateWorkItemSchema,
  type CreateWorkItemRequest,
  UpdateStatusSchema,
  type UpdateStatusRequest,
  PaginatedQuerySchema,
  type PaginatedQuery,
} from '@odin/shared';

@Controller('work-items')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateWorkItemSchema)) dto: CreateWorkItemRequest) {
    return this.workItemsService.create(dto);
  }

  @Get('stats')
  async getStats() {
    return this.workItemsService.getStats();
  }

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(PaginatedQuerySchema)) query: PaginatedQuery,
  ) {
    return this.workItemsService.findPaginated(query);
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.workItemsService.findById(id);
  }

  @Post(':id/analyse')
  async analyse(@Param('id', ParseIntPipe) id: number) {
    return this.workItemsService.analyse(id);
  }

  @Post(':id/retry')
  async retry(@Param('id', ParseIntPipe) id: number) {
    return this.workItemsService.retry(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateStatusSchema)) dto: UpdateStatusRequest,
  ) {
    return this.workItemsService.updateStatus(id, dto);
  }
}