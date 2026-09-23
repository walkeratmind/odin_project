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
import { CreateWorkItemRequestSchema } from './dto/create-work-item.dto.js';
import type { CreateWorkItemRequest } from './dto/create-work-item.dto.js';
import { UpdateStatusRequestSchema } from './dto/update-status.dto.js';
import type { UpdateStatusRequest } from './dto/update-status.dto.js';

@Controller('work-items')
export class WorkItemsController {
  constructor(private readonly workItemsService: WorkItemsService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateWorkItemRequestSchema)) dto: CreateWorkItemRequest) {
    return this.workItemsService.create(dto);
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.workItemsService.findAll(status);
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
    @Body(new ZodValidationPipe(UpdateStatusRequestSchema)) dto: UpdateStatusRequest,
  ) {
    return this.workItemsService.updateStatus(id, dto);
  }
}