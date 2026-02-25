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

/** Helper: get the seeded notification for customer 1 */
async function getSeededNotification() {
  const notification = await prisma.notification.findFirst({
    where: { accountId: fixtures.customer.accountId },
  });
  expect(notification).not.toBeNull();
  return notification!;
}

describe('Notifications endpoints', () => {
  // ─── GET /api/accounts/:id/notifications ────────────────
  describe('GET /api/accounts/:id/notifications', () => {
    it('lists notifications with pagination', async () => {
      const token = getTokenForRole('CUSTOMER');

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/notifications`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Seed creates 1 notification for customer
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination).toHaveProperty('nextCursor');
      expect(res.body.pagination).toHaveProperty('hasMore');

      const notification = res.body.data[0];
      expect(notification.type).toBe('BILLING');
      expect(notification.title).toBe('Test Bill Available');
      expect(notification.message).toBe('Your test bill is ready.');
    });

    it('includes unreadCount', async () => {
      const token = getTokenForRole('CUSTOMER');

      // Create a second notification so we can verify count
      await prisma.notification.create({
        data: {
          accountId: fixtures.customer.accountId,
          type: 'OUTAGE',
          title: 'Outage Alert',
          message: 'There is an outage in your area.',
          idempotencyKey: uuid(),
        },
      });

      const res = await request(app)
        .get(`/api/accounts/${fixtures.customer.accountId}/notifications`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('unreadCount');
      // Both notifications are unread (readAt is null)
      expect(res.body.unreadCount).toBe(2);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ─── PATCH /api/notifications/:id/read ──────────────────
  describe('PATCH /api/notifications/:id/read', () => {
    it('marks notification as read', async () => {
      const notification = await getSeededNotification();
      const token = getTokenForRole('CUSTOMER');

      // Verify it starts unread
      expect(notification.readAt).toBeNull();

      const res = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(notification.id);
      expect(res.body.data.readAt).not.toBeNull();
    });

    it('sets readAt timestamp', async () => {
      const notification = await getSeededNotification();
      const token = getTokenForRole('CUSTOMER');

      const beforeMark = new Date();

      const res = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const readAt = new Date(res.body.data.readAt);
      expect(readAt.getTime()).toBeGreaterThanOrEqual(beforeMark.getTime() - 1000);
      expect(readAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it('returns 404 for non-existent notification', async () => {
      const token = getTokenForRole('CUSTOMER');
      const fakeId = uuid();

      const res = await request(app)
        .patch(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ─── POST /api/accounts/:id/notifications/read-all ──────
  describe('POST /api/accounts/:id/notifications/read-all', () => {
    it('marks all unread notifications as read', async () => {
      const token = getTokenForRole('CUSTOMER');

      // Create additional unread notifications
      await prisma.notification.create({
        data: {
          accountId: fixtures.customer.accountId,
          type: 'USAGE_ALERT',
          title: 'High Usage',
          message: 'Your energy usage is above average.',
          idempotencyKey: uuid(),
        },
      });

      const res = await request(app)
        .post(`/api/accounts/${fixtures.customer.accountId}/notifications/read-all`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify all notifications are now read
      const unread = await prisma.notification.count({
        where: { accountId: fixtures.customer.accountId, readAt: null },
      });
      expect(unread).toBe(0);
    });

    it('returns count of marked notifications', async () => {
      const token = getTokenForRole('CUSTOMER');

      // Create a second unread notification
      await prisma.notification.create({
        data: {
          accountId: fixtures.customer.accountId,
          type: 'MAINTENANCE',
          title: 'Scheduled Maintenance',
          message: 'Maintenance planned for next week.',
          idempotencyKey: uuid(),
        },
      });

      const res = await request(app)
        .post(`/api/accounts/${fixtures.customer.accountId}/notifications/read-all`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('markedRead');
      // 1 seeded + 1 created = 2 unread notifications marked
      expect(res.body.data.markedRead).toBe(2);
    });
  });

  // ─── POST /api/accounts/:id/notifications/subscribe ─────
  describe('POST /api/accounts/:id/notifications/subscribe', () => {
    it('saves FCM token to account', async () => {
      const token = getTokenForRole('CUSTOMER');
      const fcmToken = 'fcm-test-token-abc123';

      const res = await request(app)
        .post(`/api/accounts/${fixtures.customer.accountId}/notifications/subscribe`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fcmToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(fixtures.customer.accountId);
      expect(res.body.data.fcmToken).toBe(fcmToken);

      // Verify in DB
      const account = await prisma.account.findUnique({
        where: { id: fixtures.customer.accountId },
      });
      expect(account!.fcmToken).toBe(fcmToken);
    });
  });

  // ─── DELETE /api/accounts/:id/notifications/subscribe ───
  describe('DELETE /api/accounts/:id/notifications/subscribe', () => {
    it('removes FCM token from account', async () => {
      const token = getTokenForRole('CUSTOMER');

      // First, set an FCM token
      await prisma.account.update({
        where: { id: fixtures.customer.accountId },
        data: { fcmToken: 'existing-fcm-token' },
      });

      const res = await request(app)
        .delete(`/api/accounts/${fixtures.customer.accountId}/notifications/subscribe`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fcmToken).toBeNull();

      // Verify in DB
      const account = await prisma.account.findUnique({
        where: { id: fixtures.customer.accountId },
      });
      expect(account!.fcmToken).toBeNull();
    });
  });
});
