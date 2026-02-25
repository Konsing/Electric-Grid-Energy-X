import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../lib/errors';
import { prisma } from '../lib/prisma';

/**
 * Ownership guard factory.
 * Checks that the authenticated user owns the account referenced by the route parameter.
 * ADMIN users skip this check (they can access any account).
 *
 * Usage: requireAccount('id')  — checks req.params.id is the user's account
 */
export function requireAccount(paramName: string = 'id') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Admins skip ownership check
      if (req.user?.role === 'ADMIN') {
        return next();
      }

      if (!req.user || !req.account) {
        return next(new ForbiddenError('No account associated with this user'));
      }

      const targetAccountId = req.params[paramName] as string;

      if (!targetAccountId) {
        return next(new ForbiddenError('Account parameter missing'));
      }

      // Direct match: the parameter IS the account ID
      if (req.account.id === targetAccountId) {
        return next();
      }

      // The parameter might be a resource ID (meter, billing cycle, notification, etc.)
      // In that case, the route handler should do its own ownership check
      // This middleware only handles the direct account ID case

      next(new ForbiddenError('You do not have access to this account'));
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Checks ownership of a resource that belongs to an account.
 * Used for routes like /meters/:id, /billing/:id, /notifications/:id
 * where the ID is not an account ID but a resource ID.
 */
export function requireResourceOwnership(
  resourceType: 'meter' | 'billingCycle' | 'notification',
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.role === 'ADMIN') {
        return next();
      }

      if (!req.user || !req.account) {
        return next(new ForbiddenError('No account associated with this user'));
      }

      const resourceId = req.params.id as string;
      if (!resourceId) {
        return next(new ForbiddenError('Resource ID missing'));
      }

      let accountId: string | null = null;

      switch (resourceType) {
        case 'meter': {
          const meter = await prisma.meter.findUnique({
            where: { id: resourceId },
            select: { accountId: true },
          });
          accountId = meter?.accountId ?? null;
          break;
        }
        case 'billingCycle': {
          const cycle = await prisma.billingCycle.findUnique({
            where: { id: resourceId },
            select: { accountId: true },
          });
          accountId = cycle?.accountId ?? null;
          break;
        }
        case 'notification': {
          const notif = await prisma.notification.findUnique({
            where: { id: resourceId },
            select: { accountId: true },
          });
          accountId = notif?.accountId ?? null;
          break;
        }
      }

      if (!accountId) {
        return next(); // Let the route handler return 404
      }

      if (req.account.id !== accountId) {
        return next(new ForbiddenError('You do not have access to this resource'));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
