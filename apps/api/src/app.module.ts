import { Module } from '@nestjs/common';
import { DatabaseModule } from './db/database.module.js';
import { AiModule } from './ai/ai.module.js';
import { WorkItemsModule } from './work-items/work-items.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [DatabaseModule, AiModule, WorkItemsModule],
  controllers: [HealthController],
})
export class AppModule {}