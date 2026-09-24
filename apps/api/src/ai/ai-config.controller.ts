import { Controller, Get, Put, Body, BadRequestException } from '@nestjs/common';
import { AiConfigService } from './ai-config.service.js';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

const SetProviderSchema = z.object({
  provider: z.string().min(1),
});

@Controller('ai-config')
export class AiConfigController {
  constructor(private readonly aiConfig: AiConfigService) {}

  @Get()
  getConfig() {
    return this.aiConfig.getConfig();
  }

  @Put()
  setConfig(@Body(new ZodValidationPipe(SetProviderSchema)) body: { provider: string }) {
    try {
      this.aiConfig.setProvider(body.provider);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid provider',
      );
    }
    return this.aiConfig.getConfig();
  }
}