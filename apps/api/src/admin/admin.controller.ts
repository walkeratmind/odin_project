import { Controller, Post, Inject, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DRIZZLE_PROVIDER } from '../db/database.provider.js';
import * as schema from '../db/schema.js';
import type { resetAndSeed as ResetAndSeedFn } from '../db/seed.js';

@Controller('admin')
export class AdminController {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: BetterSQLite3Database<typeof schema>,
    @Inject('RESET_AND_SEED') private readonly resetAndSeed: typeof ResetAndSeedFn,
  ) {}

  /**
   * POST /admin/reset
   *
   * Truncates all work_items rows and re-seeds from the bundled seed.json.
   * Useful for resetting the DB to its initial demo state.
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async reset(): Promise<{ message: string; count: number }> {
    try {
      const count = this.resetAndSeed(this.db);
      return {
        message: `Database reset successfully. Re-seeded ${count} work items.`,
        count,
      };
    } catch (err) {
      throw new HttpException(
        `Failed to reset database: ${(err as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}