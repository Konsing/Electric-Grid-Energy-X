import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import {
  CursorPaginationOptions,
  buildCursorQuery,
  processPaginatedResults,
} from '../../lib/pagination';
import { v4 as uuid } from 'uuid';

// ─── List notifications for an account ──────────────
export async function listNotifications(
  accountId: string,
  pagination: CursorPaginationOptions,
) {
  const cursorQuery = buildCursorQuery(pagination);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      ...cursorQuery,
    }),
    prisma.notification.count({
      where: { accountId, readAt: null },
    }),
  ]);

  const paginated = processPaginatedResults(notifications, pagination.limit);
  return { ...paginated, unreadCount };
}

// ─── Mark single notification as read ───────────────
export async function markAsRead(notificationId: string) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) throw new NotFoundError('Notification', notificationId);

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

// ─── Mark all notifications as read for account ─────
export async function markAllAsRead(accountId: string) {
  const result = await prisma.notification.updateMany({
    where: { accountId, readAt: null },
    data: { readAt: new Date() },
  });
  return { markedRead: result.count };
}

// ─── Subscribe to push notifications ────────────────
export async function subscribe(accountId: string, fcmToken: string) {
  return prisma.account.update({
    where: { id: accountId },
    data: { fcmToken },
    select: { id: true, fcmToken: true },
  });
}

// ─── Unsubscribe from push notifications ────────────
export async function unsubscribe(accountId: string) {
  return prisma.account.update({
    where: { id: accountId },
    data: { fcmToken: null },
    select: { id: true, fcmToken: true },
  });
}

// ─── Create notification (internal, used by other services) ──
export async function createNotification(
  accountId: string,
  data: {
    type: string;
    title: string;
    message: string;
    idempotencyKey: string;
  },
  actorId?: string,
) {
  // Idempotency: return existing if key matches
  const existing = await prisma.notification.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });
  if (existing) return { notification: existing, created: false };

  const notification = await prisma.$transaction(async (tx) => {
    const created = await tx.notification.create({
      data: {
        accountId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        idempotencyKey: data.idempotencyKey,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        resource: 'Notification',
        resourceId: created.id,
        traceId: uuid(),
        metadata: { accountId, type: data.type },
      },
    });

    return created;
  });

  return { notification, created: true };
}
