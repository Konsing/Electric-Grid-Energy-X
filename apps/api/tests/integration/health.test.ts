import request from 'supertest';
import { getApp, setupDatabase, cleanDatabase, teardownDatabase } from '../helpers/setup';
import { seedTestData, TestFixtures } from '../helpers/seed';
import { getTokenForRole } from '../helpers/auth';
import { clearAuthCache } from '../../src/middleware/authenticate';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../helpers/setup';

let app: Express;
let prisma: PrismaClient;
let fixtures: TestFixtures;

beforeAll(async () => {
  await setupDatabase();
  app = getApp();
  prisma = getPrisma();
});

beforeEach(async () => {
  await cleanDatabase();
  clearAuthCache();
  fixtures = await seedTestData(prisma);
});

afterAll(async () => {
  await teardownDatabase();
});

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });

  it('includes uptime and version', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('uptime');
    expect(typeof res.body.data.uptime).toBe('number');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data).toHaveProperty('version');
    expect(res.body.data.version).toBe('1.0.0');
    expect(res.body.data).toHaveProperty('timestamp');
  });
});

describe('GET /api/health/ready', () => {
  it('returns database connected', async () => {
    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ready');
    expect(res.body.data.database).toBe('connected');
  });
});

describe('GET /api/metrics', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/metrics');

    expect(res.status).toBe(401);
  });

  it('requires ADMIN role', async () => {
    const customerToken = getTokenForRole('CUSTOMER');
    const res = await request(app)
      .get('/api/metrics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});
