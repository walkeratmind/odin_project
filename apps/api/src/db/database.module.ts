import { Module, Global } from '@nestjs/common';
import { databaseProvider } from './database.provider.js';
import { resetAndSeed } from './seed.js';

@Global()
@Module({
  providers: [
    databaseProvider,
    {
      provide: 'RESET_AND_SEED',
      useFactory: () => resetAndSeed,
    },
  ],
  exports: [databaseProvider, 'RESET_AND_SEED'],
})
export class DatabaseModule {}