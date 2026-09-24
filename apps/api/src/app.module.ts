import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module.js';
import { AiModule } from './ai/ai.module.js';
import { WorkItemsModule } from './work-items/work-items.module.js';
import { AdminModule } from './admin/admin.module.js';
import { HealthController } from './health.controller.js';
import { appConfig, aiProvidersConfig } from './config/app.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, aiProvidersConfig],
    }),
    DatabaseModule,
    AiModule,
    WorkItemsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}