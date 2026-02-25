import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { requireAccount, requireResourceOwnership } from '../../middleware/requireAccount';
import { subscribeSchema } from '@egx/shared';
import { parsePaginationQuery } from '../../lib/pagination';
import * as notificationsService from './notifications.service';

const notificationsRouter = Router();

// ─── Account-scoped (mounted at /api/accounts) ─────

/**
 * GET /api/accounts/:id/notifications
 * Cursor-paginated notifications for an account.
 */
notificationsRouter.get(
  '/:id/notifications',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePaginationQuery(req.query as any);
      const result = await notificationsService.listNotifications(req.params.id, pagination);
      res.json({
        success: true,
        data: result.data,
        pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore },
        unreadCount: result.unreadCount,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/accounts/:id/notifications/read-all
 * Mark all unread notifications as read for an account.
 */
notificationsRouter.post(
  '/:id/notifications/read-all',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationsService.markAllAsRead(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/accounts/:id/notifications/subscribe
 * Save FCM token for push notifications.
 */
notificationsRouter.post(
  '/:id/notifications/subscribe',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  validate({ body: subscribeSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationsService.subscribe(req.params.id, req.body.fcmToken);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/accounts/:id/notifications/subscribe
 * Remove FCM token.
 */
notificationsRouter.delete(
  '/:id/notifications/subscribe',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationsService.unsubscribe(req.params.id);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Notification-scoped (mounted at /api/notifications) ──

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
notificationsRouter.patch(
  '/:id/read',
  authenticate,
  requireResourceOwnership('notification'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await notificationsService.markAsRead(req.params.id);
      res.json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  },
);

export { notificationsRouter };
