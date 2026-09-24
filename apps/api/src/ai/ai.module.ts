import { Module } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { AiConfigService } from './ai-config.service.js';
import { AiConfigController } from './ai-config.controller.js';

@Module({
  controllers: [AiConfigController],
  providers: [AiConfigService, AiService],
  exports: [AiService, AiConfigService],
})
export class AiModule {}