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

describe('Accounts endpoints', () => {
  // ─── GET /api/accounts ────────────────────────────────────────
  describe('GET /api/accounts', () => {
    it('admin lists all accounts with pagination', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Seed creates 4 accounts: admin, tech, customer, customer2
      expect(res.body.data.length).toBe(4);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('nextCursor');
      expect(res.body.pagination).toHaveProperty('hasMore');
      expect(res.body.pagination.hasMore).toBe(false);
    });

    it('returns account data with user info', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const account = res.body.data.find(
        (a: any) => a.id === fixtures.customer.accountId,
      );

      expect(account).toBeDefined();
      expect(account.accountNumber).toBe('EGX-CST-001');
      expect(account.firstName).toBe('Jane');
      expect(account.lastName).toBe('Doe');
      expect(account.serviceAddress).toBe('42 Maple Street');
      expect(account.user).toBeDefined();
      expect(account.user.email).toBe('customer@egx.dev');
      expect(account.user.role).toBe('CUSTOMER');
    });
  });

  // ─── GET /api/accounts/:id ────────────────────────────────────
  describe('GET /api/accounts/:id', () => {
    it('returns account with meters', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(fixtures.customer.accountId);
      expect(res.body.data.accountNumber).toBe('EGX-CST-001');
      expect(res.body.data.firstName).toBe('Jane');
      expect(res.body.data.lastName).toBe('Doe');
      expect(Array.isArray(res.body.data.meters)).toBe(true);
      expect(res.body.data.meters.length).toBe(1);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('customer@egx.dev');
    });

    it('includes meter details', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      const meter = res.body.data.meters[0];
      expect(meter.id).toBe(fixtures.meter1Id);
      expect(meter.serialNumber).toBe('MTR-TEST-001');
      expect(meter.model).toBe('SmartMeter Pro 3000');
      expect(meter.location).toBe('Main panel - 42 Maple Street');
      expect(meter.status).toBe('ACTIVE');
      expect(meter).toHaveProperty('installedAt');
      expect(meter).toHaveProperty('lastReadingAt');
      expect(meter).toHaveProperty('createdAt');
      expect(meter).toHaveProperty('updatedAt');
    });
  });

  // ─── PATCH /api/accounts/:id ──────────────────────────────────
  describe('PATCH /api/accounts/:id', () => {
    it('updates account fields', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .patch(`/api/accounts/${fixtures.customer.accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'Janet',
          phone: '555-999-0000',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Janet');
      expect(res.body.data.phone).toBe('555-999-0000');
    });

    it('returns updated account', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .patch(`/api/accounts/${fixtures.customer.accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          serviceAddress: '100 New Address Blvd',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.serviceAddress).toBe('100 New Address Blvd');
      expect(res.body.data.id).toBe(fixtures.customer.accountId);
      expect(res.body.data.accountNumber).toBe('EGX-CST-001');
      expect(res.body.data).toHaveProperty('createdAt');
      expect(res.body.data).toHaveProperty('updatedAt');
    });

    it('writes audit log', async () => {
      const token = getTokenForRole('ADMIN');

      await request(app)
        .patch(`/api/accounts/${fixtures.customer.accountId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ lastName: 'Updated' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'UPDATE',
          resource: 'Account',
          resourceId: fixtures.customer.accountId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(fixtures.admin.userId);
      expect((auditLog!.metadata as any).updatedFields).toContain('lastName');
    });
  });

  // ─── PATCH /api/accounts/:id/status ───────────────────────────
  describe('PATCH /api/accounts/:id/status', () => {
    it('admin changes status to SUSPENDED', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .patch(`/api/accounts/${fixtures.customer.accountId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUSPENDED');
      expect(res.body.data.id).toBe(fixtures.customer.accountId);
    });

    it('writes audit log with status change', async () => {
      const token = getTokenForRole('ADMIN');

      await request(app)
        .patch(`/api/accounts/${fixtures.customer.accountId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'SUSPENDED' });

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'STATUS_CHANGE',
          resource: 'Account',
          resourceId: fixtures.customer.accountId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(fixtures.admin.userId);
      const metadata = auditLog!.metadata as any;
      expect(metadata.previousStatus).toBe('ACTIVE');
      expect(metadata.newStatus).toBe('SUSPENDED');
    });
  });

  // ─── DELETE /api/accounts/:id ─────────────────────────────────
  describe('DELETE /api/accounts/:id', () => {
    it('soft-deletes user (sets deletedAt)', async () => {
      const token = getTokenForRole('ADMIN');

      const res = await request(app)
        .delete(`/api/accounts/${fixtures.customer2.accountId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Account deleted successfully');

      // Verify the user has deletedAt set
      const deletedUser = await prisma.user.findUnique({
        where: { id: fixtures.customer2.userId },
      });

      expect(deletedUser).not.toBeNull();
      expect(deletedUser!.deletedAt).not.toBeNull();
    });

    it('soft-deleted user cannot login', async () => {
      const token = getTokenForRole('ADMIN');

      // Delete the account first
      await request(app)
        .delete(`/api/accounts/${fixtures.customer2.accountId}`)
        .set('Authorization', `Bearer ${token}`);

      // Attempt to login as the deleted user
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.customer2.email,
          password: 'password123',
        });

      expect(loginRes.status).toBe(401);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.error.code).toBe('UNAUTHORIZED');
    });

    it('writes audit log', async () => {
      const token = getTokenForRole('ADMIN');

      await request(app)
        .delete(`/api/accounts/${fixtures.customer2.accountId}`)
        .set('Authorization', `Bearer ${token}`);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'DELETE',
          resource: 'Account',
          resourceId: fixtures.customer2.accountId,
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.userId).toBe(fixtures.admin.userId);
      const metadata = auditLog!.metadata as any;
      expect(metadata.accountNumber).toBe('EGX-CST-002');
      expect(metadata.deletedUserId).toBe(fixtures.customer2.userId);
    });
  });
});
