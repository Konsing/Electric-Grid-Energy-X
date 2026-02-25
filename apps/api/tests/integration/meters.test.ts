import request from 'supertest';
import { getApp, getPrisma, cleanDatabase, setupDatabase, teardownDatabase } from '../helpers/setup';
import { seedTestData, TestFixtures } from '../helpers/seed';
import { getTokenForRole } from '../helpers/auth';
import { clearAuthCache } from '../../src/middleware/authenticate';

const app = getApp();
const prisma = getPrisma();

let fixtures: TestFixtures;

beforeAll(async () => {
  await setupDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
  clearAuthCache();
  fixtures = await seedTestData(prisma);
});

afterAll(async () => {
  await teardownDatabase();
});

describe('Meters endpoints', () => {
  // ─── GET /api/accounts/:id/meters ─────────────────────────────
  describe('GET /api/accounts/:id/meters', () => {
    it('lists meters for account', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/meters`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);

      const meter = res.body.data[0];
      expect(meter.id).toBe(fixtures.meter1Id);
      expect(meter.serialNumber).toBe('MTR-TEST-001');
      expect(meter.model).toBe('SmartMeter Pro 3000');
      expect(meter.location).toBe('Main panel - 42 Maple Street');
      expect(meter.status).toBe('ACTIVE');
    });

    it('returns empty array for account without meters', async () => {
      const token = getTokenForRole('ADMIN');

      // Admin account has no meters seeded
      const res = await request(app)
        .get(`/api/accounts/${fixtures.admin.accountId}/meters`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  // ─── POST /api/accounts/:id/meters ────────────────────────────
  describe('POST /api/accounts/:id/meters', () => {
    it('creates meter and returns 201', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .post(`/api/accounts/${fixtures.customer.accountId}/meters`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          serialNumber: 'MTR-NEW-001',
          model: 'SmartMeter X1',
          location: 'Garage - 42 Maple Street',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.serialNumber).toBe('MTR-NEW-001');
      expect(res.body.data.model).toBe('SmartMeter X1');
      expect(res.body.data.location).toBe('Garage - 42 Maple Street');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.accountId).toBe(fixtures.customer.accountId);
      expect(res.body.data.id).toBeDefined();
    });

    it('returns 400 for invalid data', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .post(`/api/accounts/${fixtures.customer.accountId}/meters`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing required fields: serialNumber, model, location
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('writes audit log', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .post(`/api/accounts/${fixtures.customer.accountId}/meters`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          serialNumber: 'MTR-AUDIT-001',
          model: 'SmartMeter Audit',
          location: 'Basement - 42 Maple Street',
        });

      expect(res.status).toBe(201);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'CREATE',
          resource: 'Meter',
          resourceId: res.body.data.id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(fixtures.admin.userId);
      const metadata = auditLog!.metadata as any;
      expect(metadata.accountId).toBe(fixtures.customer.accountId);
      expect(metadata.serialNumber).toBe('MTR-AUDIT-001');
      expect(metadata.model).toBe('SmartMeter Audit');
      expect(metadata.location).toBe('Basement - 42 Maple Street');
    });
  });

  // ─── GET /api/meters/:id ──────────────────────────────────────
  describe('GET /api/meters/:id', () => {
    it('returns meter details', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .get(`/api/meters/${fixtures.meter1Id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(fixtures.meter1Id);
      expect(res.body.data.serialNumber).toBe('MTR-TEST-001');
      expect(res.body.data.model).toBe('SmartMeter Pro 3000');
      expect(res.body.data.location).toBe('Main panel - 42 Maple Street');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.id).toBe(fixtures.customer.accountId);
      expect(res.body.data.account.accountNumber).toBe('EGX-CST-001');
      expect(res.body.data.account.firstName).toBe('Jane');
      expect(res.body.data.account.lastName).toBe('Doe');
    });

    it('returns 404 for non-existent meter', async () => {
      const token = getTokenForRole('ADMIN');
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .get(`/api/meters/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ─── PATCH /api/meters/:id ────────────────────────────────────
  describe('PATCH /api/meters/:id', () => {
    it('updates meter location', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .patch(`/api/meters/${fixtures.meter1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Side panel - 42 Maple Street' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(fixtures.meter1Id);
      expect(res.body.data.location).toBe('Side panel - 42 Maple Street');
      // Status should remain unchanged
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('updates meter status', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .patch(`/api/meters/${fixtures.meter1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'MAINTENANCE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(fixtures.meter1Id);
      expect(res.body.data.status).toBe('MAINTENANCE');
      // Location should remain unchanged
      expect(res.body.data.location).toBe('Main panel - 42 Maple Street');
    });

    it('writes audit log', async () => {
      const token = getTokenForRole('ADMIN');

      await request(app)
        .patch(`/api/meters/${fixtures.meter1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Updated location', status: 'INACTIVE' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'UPDATE',
          resource: 'Meter',
          resourceId: fixtures.meter1Id,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(fixtures.admin.userId);
      const metadata = auditLog!.metadata as any;
      expect(metadata.changes.location).toBe('Updated location');
      expect(metadata.changes.status).toBe('INACTIVE');
      expect(metadata.previous.location).toBe('Main panel - 42 Maple Street');
      expect(metadata.previous.status).toBe('ACTIVE');
    });
  });
});
