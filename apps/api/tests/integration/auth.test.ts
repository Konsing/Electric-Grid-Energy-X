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

describe('Auth endpoints', () => {
  // ─── POST /api/auth/register ──────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('creates new user and returns token', async () => {
      const email = `test-${Date.now()}@egx.dev`;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'securePass123',
          firstName: 'Test',
          lastName: 'User',
          serviceAddress: '123 Test Street',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.firstName).toBe('Test');
      expect(res.body.data.account.lastName).toBe('User');
    });

    it('returns 409 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: fixtures.customer.email,
          password: 'securePass123',
          firstName: 'Duplicate',
          lastName: 'User',
          serviceAddress: '456 Duplicate Lane',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ALREADY_EXISTS');
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'securePass123',
          firstName: 'Bad',
          lastName: 'Email',
          serviceAddress: '789 Invalid Road',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: `short-pw-${Date.now()}@egx.dev`,
          password: 'abc',
          firstName: 'Short',
          lastName: 'Pass',
          serviceAddress: '321 Short Password Ave',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates account with correct account number format (EGX-XXXXXX)', async () => {
      const email = `format-${Date.now()}@egx.dev`;

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'securePass123',
          firstName: 'Format',
          lastName: 'Check',
          serviceAddress: '999 Format Boulevard',
        });

      expect(res.status).toBe(201);
      const accountNumber = res.body.data.account.accountNumber;
      expect(accountNumber).toMatch(/^EGX-[A-Z0-9]{6}$/);
    });
  });

  // ─── POST /api/auth/login ─────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('returns token for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.customer.email,
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(fixtures.customer.email);
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.user.account).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.customer.email,
          password: 'wrong-password',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@egx.dev',
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 for soft-deleted user', async () => {
      // Soft-delete the customer user
      await prisma.user.update({
        where: { id: fixtures.customer.userId },
        data: { deletedAt: new Date() },
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: fixtures.customer.email,
          password: 'password123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ─── POST /api/auth/dev-login ─────────────────────────────────
  describe('POST /api/auth/dev-login', () => {
    it('returns token without password', async () => {
      const res = await request(app)
        .post('/api/auth/dev-login')
        .send({ email: fixtures.admin.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(fixtures.admin.email);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.account).toBeDefined();
    });

    it('returns 404 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/dev-login')
        .send({ email: 'ghost@egx.dev' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ─── GET /api/auth/me ─────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('returns user profile with account', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(fixtures.customer.userId);
      expect(res.body.data.email).toBe(fixtures.customer.email);
      expect(res.body.data.role).toBe('CUSTOMER');
      expect(res.body.data.account).toBeDefined();
      expect(res.body.data.account.id).toBe(fixtures.customer.accountId);
      expect(res.body.data.account.firstName).toBe('Jane');
      expect(res.body.data.account.lastName).toBe('Doe');
      expect(res.body.data.account.phone).toBe('555-0101');
      expect(res.body.data.account.serviceAddress).toBe('42 Maple Street');
    });

    it('returns 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // ─── POST /api/auth/logout ────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('writes audit log and returns success', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Logged out successfully');

      // Verify audit log was written
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: fixtures.customer.userId,
          action: 'LOGOUT',
          resource: 'User',
        },
      });

      expect(auditLog).not.toBeNull();
      expect(auditLog!.resourceId).toBe(fixtures.customer.userId);
    });
  });
});
