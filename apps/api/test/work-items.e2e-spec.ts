import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { AppModule } from '../src/app.module.js';
import * as schema from '../src/db/schema.js';
import { DRIZZLE_PROVIDER } from '../src/db/database.provider.js';
import type { AiProvider, AiAnalysis } from '../src/ai/ai-provider.interface.js';

class ConfigurableMockAiProvider implements AiProvider {
  shouldFail = false;
  shouldTimeout = false;
  customResult: AiAnalysis | null = null;
  failMessage = 'Mock AI failure';

  async analyse(_input: { title: string; description: string }): Promise<AiAnalysis> {
    if (this.shouldTimeout) {
      await new Promise(() => {});
    }
    if (this.shouldFail) {
      throw new Error(this.failMessage);
    }
    if (this.customResult) {
      return this.customResult;
    }
    return {
      category: 'DOCUMENT_REQUEST',
      priority: 'HIGH',
      summary: 'Mock analysis summary',
      recommendedAction: 'Mock recommended action',
    };
  }
}

function createTestDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS work_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'RECEIVED',
      category TEXT,
      priority TEXT,
      summary TEXT,
      recommended_action TEXT,
      ai_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  return db;
}

describe('Work Items (e2e)', () => {
  let app: INestApplication;
  let mockProvider: ConfigurableMockAiProvider;

  beforeEach(async () => {
    const testDb = createTestDb();
    mockProvider = new ConfigurableMockAiProvider();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DRIZZLE_PROVIDER)
      .useValue(testDb)
      .overrideProvider('AI_PROVIDER')
      .useValue(mockProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0, '127.0.0.1');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /work-items', () => {
    it('creates a new work item', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-items')
        .send({
          externalId: 'CRM-001',
          title: 'Missing document',
          description: 'Applicant has not submitted payslip.',
        })
        .expect(201);

      expect(res.body.externalId).toBe('CRM-001');
      expect(res.body.status).toBe('RECEIVED');
      expect(res.body.id).toBeDefined();
    });

    it('returns 400 for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-002' })
        .expect(400);

      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('returns existing item for duplicate externalId (idempotent)', async () => {
      const first = await request(app.getHttpServer())
        .post('/work-items')
        .send({
          externalId: 'CRM-DUP',
          title: 'First request',
          description: 'Description for first request.',
        })
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/work-items')
        .send({
          externalId: 'CRM-DUP',
          title: 'Second request — different title',
          description: 'Description for second request.',
        })
        .expect(201);

      expect(second.body.id).toBe(first.body.id);
      expect(second.body.externalId).toBe('CRM-DUP');
      expect(second.body.title).toBe('First request');
    });
  });

  describe('GET /work-items', () => {
    it('lists all work items', async () => {
      await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-A', title: 'Item A', description: 'Desc A' });

      await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-B', title: 'Item B', description: 'Desc B' });

      const res = await request(app.getHttpServer())
        .get('/work-items')
        .expect(200);

      expect(res.body).toHaveLength(2);
    });

    it('filters by status', async () => {
      await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-F1', title: 'Filter 1', description: 'Desc' });

      await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-F2', title: 'Filter 2', description: 'Desc' });

      mockProvider.shouldFail = true;
      mockProvider.failMessage = 'Forced failure for filtering test';

      await request(app.getHttpServer())
        .post('/work-items/2/analyse')
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/work-items?status=FAILED')
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].status).toBe('FAILED');
    });
  });

  describe('GET /work-items/:id', () => {
    it('returns a work item by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-GET', title: 'Get me', description: 'Test description.' });

      const res = await request(app.getHttpServer())
        .get(`/work-items/${created.body.id}`)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('returns 404 for non-existent item', async () => {
      await request(app.getHttpServer())
        .get('/work-items/9999')
        .expect(404);
    });
  });

  describe('POST /work-items/:id/analyse', () => {
    it('analyses and transitions to READY_FOR_REVIEW', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-ANA', title: 'Analyse this', description: 'Needs analysis.' });

      const res = await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      expect(res.body.status).toBe('READY_FOR_REVIEW');
      expect(res.body.category).toBe('DOCUMENT_REQUEST');
      expect(res.body.priority).toBe('HIGH');
      expect(res.body.summary).toBeDefined();
      expect(res.body.recommendedAction).toBeDefined();
    });

    it('rejects analysis of completed item', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-NOANA', title: 'No re-analyse', description: 'Desc.' });

      await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/work-items/${created.body.id}/status`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(409);

      expect(res.body.code).toBe('ANALYSIS_NOT_ALLOWED');
    });
  });

  describe('PATCH /work-items/:id/status', () => {
    it('rejects COMPLETED to ANALYSING', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-TRANS', title: 'Transition test', description: 'Desc.' });

      await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/work-items/${created.body.id}/status`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      const res = await request(app.getHttpServer())
        .patch(`/work-items/${created.body.id}/status`)
        .send({ status: 'ANALYSING' })
        .expect(409);

      expect(res.body.code).toBe('INVALID_WORKFLOW_TRANSITION');
    });

    it('rejects RECEIVED to COMPLETED', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-SKIP', title: 'Skip test', description: 'Desc.' });

      const res = await request(app.getHttpServer())
        .patch(`/work-items/${created.body.id}/status`)
        .send({ status: 'COMPLETED' })
        .expect(409);

      expect(res.body.code).toBe('INVALID_WORKFLOW_TRANSITION');
    });

    it('allows READY_FOR_REVIEW to COMPLETED', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-VALID', title: 'Valid transition', description: 'Desc.' });

      await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/work-items/${created.body.id}/status`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.status).toBe('COMPLETED');
    });
  });

  describe('AI failures', () => {
    it('FAILS on malformed AI response and does not persist bad data', async () => {
      mockProvider.customResult = { foo: 'not valid' } as unknown as AiAnalysis;

      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-MALF', title: 'Malformed test', description: 'Desc.' });

      const res = await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      expect(res.body.status).toBe('FAILED');
      expect(res.body.aiError).toContain('Malformed AI output');
      expect(res.body.category).toBeNull();
      expect(res.body.priority).toBeNull();
    });

    it('FAILS on provider error', async () => {
      mockProvider.shouldFail = true;
      mockProvider.failMessage = 'API unavailable';

      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-FAIL', title: 'Failure test', description: 'Desc.' });

      const res = await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      expect(res.body.status).toBe('FAILED');
      expect(res.body.aiError).toContain('API unavailable');
    });
  });

  describe('POST /work-items/:id/retry', () => {
    it('retries a FAILED item and completes analysis', async () => {
      mockProvider.shouldFail = true;
      mockProvider.failMessage = 'Temporary failure';

      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-RETRY', title: 'Retry test', description: 'Desc.' });

      await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/analyse`)
        .expect(201);

      const failed = await request(app.getHttpServer())
        .get(`/work-items/${created.body.id}`)
        .expect(200);
      expect(failed.body.status).toBe('FAILED');

      mockProvider.shouldFail = false;

      const res = await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/retry`)
        .expect(201);

      expect(res.body.status).toBe('READY_FOR_REVIEW');
      expect(res.body.category).toBeDefined();
      expect(res.body.aiError).toBeNull();
    });

    it('rejects retry for non-FAILED items', async () => {
      const created = await request(app.getHttpServer())
        .post('/work-items')
        .send({ externalId: 'CRM-NORETRY', title: 'No retry', description: 'Desc.' });

      const res = await request(app.getHttpServer())
        .post(`/work-items/${created.body.id}/retry`)
        .expect(409);

      expect(res.body.code).toBe('RETRY_NOT_ALLOWED');
    });
  });
});