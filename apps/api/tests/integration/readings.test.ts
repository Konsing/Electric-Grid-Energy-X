import request from 'supertest';
import { getApp, getPrisma, setupDatabase, cleanDatabase, teardownDatabase } from '../helpers/setup';
import { seedTestData, TestFixtures } from '../helpers/seed';
import { getTokenForRole, getCustomer2Token } from '../helpers/auth';
import { clearAuthCache } from '../../src/middleware/authenticate';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

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

describe('Readings endpoints', () => {
  // ─── GET /api/meters/:id/readings ───────────────────────
  describe('GET /api/meters/:id/readings', () => {
    it('lists readings for meter with pagination', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Seed creates 3 readings for meter1
      expect(res.body.data.length).toBe(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('nextCursor');
      expect(res.body.pagination).toHaveProperty('hasMore');
    });

    it('returns readings in date-descending order', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const readings = res.body.data;
      expect(readings.length).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < readings.length - 1; i++) {
        const currentDate = new Date(readings[i].readingDate).getTime();
        const nextDate = new Date(readings[i + 1].readingDate).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });
  });

  // ─── POST /api/meters/:id/readings ──────────────────────
  describe('POST /api/meters/:id/readings', () => {
    it('submits new reading and returns 201', async () => {
      const token = getTokenForRole('CUSTOMER');
      const idempotencyKey = uuid();

      const res = await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          readingValue: 550,
          readingDate: new Date().toISOString(),
          source: 'MANUAL',
          idempotencyKey,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.readingValue).toBe(550);
      expect(res.body.data.meterId).toBe(fixtures.meter1Id);
      expect(res.body.data.source).toBe('MANUAL');
      expect(res.body.data.idempotencyKey).toBe(idempotencyKey);
    });

    it('returns 200 with same reading on idempotencyKey replay', async () => {
      const token = getTokenForRole('CUSTOMER');
      const idempotencyKey = uuid();
      const payload = {
        readingValue: 600,
        readingDate: new Date().toISOString(),
        source: 'SMART_METER',
        idempotencyKey,
      };

      // First request: should create
      const first = await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(first.status).toBe(201);
      const originalReading = first.body.data;

      // Second request with SAME idempotencyKey: should return 200 (NOT 409!)
      const second = await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(second.status).toBe(200);
      expect(second.body.success).toBe(true);
      // The response should contain the SAME reading data
      expect(second.body.data.id).toBe(originalReading.id);
      expect(second.body.data.readingValue).toBe(originalReading.readingValue);
      expect(second.body.data.idempotencyKey).toBe(idempotencyKey);
    });

    it('different idempotencyKey creates new reading', async () => {
      const token = getTokenForRole('CUSTOMER');
      const now = new Date();

      const first = await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          readingValue: 700,
          readingDate: new Date(now.getFullYear(), now.getMonth(), 10).toISOString(),
          source: 'MANUAL',
          idempotencyKey: uuid(),
        });

      expect(first.status).toBe(201);

      const second = await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          readingValue: 750,
          readingDate: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
          source: 'MANUAL',
          idempotencyKey: uuid(),
        });

      expect(second.status).toBe(201);
      expect(second.body.data.id).not.toBe(first.body.data.id);
      expect(second.body.data.readingValue).toBe(750);
    });

    it('updates meter lastReadingAt', async () => {
      const token = getTokenForRole('CUSTOMER');
      const readingDate = new Date().toISOString();

      await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          readingValue: 800,
          readingDate,
          source: 'SMART_METER',
          idempotencyKey: uuid(),
        });

      const meter = await prisma.meter.findUnique({
        where: { id: fixtures.meter1Id },
      });

      expect(meter).not.toBeNull();
      expect(meter!.lastReadingAt).not.toBeNull();
      // The lastReadingAt should match the reading date we submitted
      expect(new Date(meter!.lastReadingAt!).toISOString()).toBe(
        new Date(readingDate).toISOString(),
      );
    });

    it('returns 400 for missing idempotencyKey', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .post(`/api/meters/${fixtures.meter1Id}/readings`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          readingValue: 100,
          readingDate: new Date().toISOString(),
          source: 'MANUAL',
          // No idempotencyKey
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ─── GET /api/accounts/:id/usage/summary ────────────────
  describe('GET /api/accounts/:id/usage/summary', () => {
    it('returns usage summary with totalKwh and trend', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/usage/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalKwh');
      expect(res.body.data).toHaveProperty('averageMonthly');
      expect(res.body.data).toHaveProperty('currentMonth');
      expect(res.body.data).toHaveProperty('previousMonth');
      expect(res.body.data).toHaveProperty('trend');
      expect(typeof res.body.data.totalKwh).toBe('number');
      expect(typeof res.body.data.trend).toBe('number');
      // Seed creates 3 readings with values 400, 450, 500 — totalKwh should be > 0
      expect(res.body.data.totalKwh).toBeGreaterThan(0);
    });

    it('customer can access own summary', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/usage/summary`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalKwh');
    });
  });

  // ─── GET /api/accounts/:id/usage/analytics ──────────────
  describe('GET /api/accounts/:id/usage/analytics', () => {
    it('returns monthly breakdown', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/usage/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('months');
      expect(Array.isArray(res.body.data.months)).toBe(true);
      // Should return exactly 12 months of data
      expect(res.body.data.months.length).toBe(12);

      const firstMonth = res.body.data.months[0];
      expect(firstMonth).toHaveProperty('month');
      expect(firstMonth).toHaveProperty('year');
      expect(firstMonth).toHaveProperty('monthNumber');
      expect(firstMonth).toHaveProperty('kwh');
    });

    it('includes cost per month', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/usage/analytics`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const months = res.body.data.months;

      for (const month of months) {
        expect(month).toHaveProperty('cost');
        expect(typeof month.cost).toBe('number');
        // Cost should always be >= 0 (base service charge applies even at 0 kwh)
        expect(month.cost).toBeGreaterThanOrEqual(0);
      }

      // At least one month should have kwh > 0 (from seeded readings)
      const monthsWithUsage = months.filter((m: { kwh: number }) => m.kwh > 0);
      expect(monthsWithUsage.length).toBeGreaterThan(0);
    });
  });
});
