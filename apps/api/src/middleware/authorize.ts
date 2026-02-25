import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError } from '../lib/errors';

/**
 * Role guard factory.
 * Returns middleware that checks if the authenticated user has one of the allowed roles.
 *
 * Usage: authorize('ADMIN', 'TECHNICIAN')
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role ${req.user.role} is not authorized for this action`));
    }

    next();
  };
}
