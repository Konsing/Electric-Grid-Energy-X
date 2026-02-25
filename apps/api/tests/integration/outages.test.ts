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

/** Helper: create an outage via the API and return the response body data */
async function createOutageViaApi(overrides: Record<string, unknown> = {}) {
  const techToken = getTokenForRole('TECHNICIAN');

  const payload = {
    affectedArea: 'Downtown District',
    severity: 'HIGH',
    title: 'Power outage on Main Street',
    description: 'Transformer failure affecting multiple blocks in the downtown area.',
    ...overrides,
  };

  const res = await request(app)
    .post('/api/outages')
    .set('Authorization', `Bearer ${techToken}`)
    .send(payload);

  expect(res.status).toBe(201);
  return res.body.data;
}

describe('Outages endpoints', () => {
  // ─── GET /api/outages ───────────────────────────────────
  describe('GET /api/outages', () => {
    it('lists all outages', async () => {
      const token = getTokenForRole('CUSTOMER');

      // Create some outages first
      await createOutageViaApi({ title: 'Outage A', severity: 'LOW' });
      await createOutageViaApi({ title: 'Outage B', severity: 'HIGH' });

      const res = await request(app)
        .get('/api/outages')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('nextCursor');
      expect(res.body.pagination).toHaveProperty('hasMore');
    });

    it('filters by status', async () => {
      const token = getTokenForRole('TECHNICIAN');

      // Create two outages
      const outage1 = await createOutageViaApi({ title: 'Active Outage' });
      await createOutageViaApi({ title: 'Another Outage' });

      // Resolve the first one
      await request(app)
        .post(`/api/outages/${outage1.id}/resolve`)
        .set('Authorization', `Bearer ${token}`);

      // Filter by REPORTED status
      const res = await request(app)
        .get('/api/outages?status=REPORTED')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('REPORTED');
      expect(res.body.data[0].title).toBe('Another Outage');
    });
  });

  // ─── GET /api/outages/active ────────────────────────────
  describe('GET /api/outages/active', () => {
    it('returns only non-resolved outages', async () => {
      const techToken = getTokenForRole('TECHNICIAN');
      const customerToken = getTokenForRole('CUSTOMER');

      // Create three outages
      const outage1 = await createOutageViaApi({ title: 'Resolved Outage' });
      await createOutageViaApi({ title: 'Active Outage 1' });
      await createOutageViaApi({ title: 'Active Outage 2' });

      // Resolve the first one
      await request(app)
        .post(`/api/outages/${outage1.id}/resolve`)
        .set('Authorization', `Bearer ${techToken}`);

      // Get active outages
      const res = await request(app)
        .get('/api/outages/active')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Only 2 active (non-resolved) outages should be returned
      expect(res.body.data.length).toBe(2);

      const statuses = res.body.data.map((o: { status: string }) => o.status);
      expect(statuses).not.toContain('RESOLVED');
    });
  });

  // ─── POST /api/outages ─────────────────────────────────
  describe('POST /api/outages', () => {
    it('creates outage and returns 201', async () => {
      const techToken = getTokenForRole('TECHNICIAN');
      const estimatedResolution = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post('/api/outages')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          affectedArea: 'Industrial Park Zone 3',
          severity: 'CRITICAL',
          title: 'Major grid failure',
          description: 'High-voltage transmission line down affecting entire industrial zone.',
          estimatedResolution,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.affectedArea).toBe('Industrial Park Zone 3');
      expect(res.body.data.severity).toBe('CRITICAL');
      expect(res.body.data.title).toBe('Major grid failure');
      expect(res.body.data.description).toContain('High-voltage');
      expect(res.body.data.status).toBe('REPORTED');
      expect(res.body.data.resolvedAt).toBeNull();
      expect(res.body.data.estimatedResolution).not.toBeNull();
    });

    it('writes audit log', async () => {
      const techToken = getTokenForRole('TECHNICIAN');

      const res = await request(app)
        .post('/api/outages')
        .set('Authorization', `Bearer ${techToken}`)
        .send({
          affectedArea: 'Suburban Heights',
          severity: 'MEDIUM',
          title: 'Partial power loss',
          description: 'Intermittent power in residential area.',
        });

      expect(res.status).toBe(201);
      const outageId = res.body.data.id;

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          resource: 'Outage',
          resourceId: outageId,
          action: 'CREATE',
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(fixtures.tech.userId);
      expect(auditLog!.resource).toBe('Outage');
      expect(auditLog!.resourceId).toBe(outageId);
    });
  });

  // ─── PATCH /api/outages/:id ─────────────────────────────
  describe('PATCH /api/outages/:id', () => {
    it('updates outage fields', async () => {
      const outage = await createOutageViaApi();
      const adminToken = getTokenForRole('ADMIN');

      const res = await request(app)
        .patch(`/api/outages/${outage.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          severity: 'CRITICAL',
          title: 'Updated: Critical power outage',
          description: 'Situation has escalated. Multiple substations affected.',
          status: 'CONFIRMED',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.severity).toBe('CRITICAL');
      expect(res.body.data.title).toBe('Updated: Critical power outage');
      expect(res.body.data.status).toBe('CONFIRMED');

      // Verify in DB
      const updated = await prisma.outage.findUnique({
        where: { id: outage.id },
      });
      expect(updated!.severity).toBe('CRITICAL');
      expect(updated!.status).toBe('CONFIRMED');
    });
  });

  // ─── POST /api/outages/:id/resolve ──────────────────────
  describe('POST /api/outages/:id/resolve', () => {
    it('resolves outage and sets resolvedAt', async () => {
      const outage = await createOutageViaApi();
      const techToken = getTokenForRole('TECHNICIAN');

      const beforeResolve = new Date();

      const res = await request(app)
        .post(`/api/outages/${outage.id}/resolve`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('RESOLVED');
      expect(res.body.data.resolvedAt).not.toBeNull();

      const resolvedAt = new Date(res.body.data.resolvedAt);
      expect(resolvedAt.getTime()).toBeGreaterThanOrEqual(beforeResolve.getTime() - 1000);
      expect(resolvedAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);

      // Verify audit log was created for the resolve action
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          resource: 'Outage',
          resourceId: outage.id,
          action: 'STATUS_CHANGE',
        },
      });
      expect(auditLog).not.toBeNull();
    });

    it('returns 409 for already-resolved outage', async () => {
      const outage = await createOutageViaApi();
      const techToken = getTokenForRole('TECHNICIAN');

      // Resolve it first
      const resolveRes = await request(app)
        .post(`/api/outages/${outage.id}/resolve`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.data.status).toBe('RESOLVED');

      // Try to resolve again
      const secondRes = await request(app)
        .post(`/api/outages/${outage.id}/resolve`)
        .set('Authorization', `Bearer ${techToken}`);

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.error.code).toBe('OUTAGE_ALREADY_RESOLVED');
    });
  });

  // ─── GET /api/outages/:id ──────────────────────────────
  describe('GET /api/outages/:id', () => {
    it('returns single outage', async () => {
      const outage = await createOutageViaApi({
        title: 'Specific Outage',
        severity: 'LOW',
        affectedArea: 'Riverside Park',
      });

      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/outages/${outage.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(outage.id);
      expect(res.body.data.title).toBe('Specific Outage');
      expect(res.body.data.severity).toBe('LOW');
      expect(res.body.data.affectedArea).toBe('Riverside Park');
      expect(res.body.data.status).toBe('REPORTED');
    });

    it('returns 404 for non-existent outage', async () => {
      const token = getTokenForRole('CUSTOMER');
      const fakeId = uuid();

      const res = await request(app)
        .get(`/api/outages/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
