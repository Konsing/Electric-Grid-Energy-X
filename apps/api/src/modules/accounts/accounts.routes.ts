import { Router, Request, Response, NextFunction } from 'express';
import {
  updateAccountSchema,
  updateAccountStatusSchema,
} from '@egx/shared';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { requireAccount } from '../../middleware/requireAccount';
import { validate } from '../../middleware/validate';
import { parsePaginationQuery } from '../../lib/pagination';
import {
  listAccounts,
  getAccount,
  updateAccount,
  updateAccountStatus,
  softDeleteAccount,
} from './accounts.service';

// ─── Async handler wrapper ────────────────────────────
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const accountsRouter = Router();

/**
 * GET /api/accounts
 * List all accounts (admin only). Cursor-paginated.
 */
accountsRouter.get(
  '/',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const pagination = parsePaginationQuery(req.query as { cursor?: string; limit?: string });
    const result = await listAccounts(pagination);

    res.json({
      success: true,
      data: result.data,
      pagination: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      },
    });
  }),
);

/**
 * GET /api/accounts/:id
 * Get a single account with its meters. Ownership-checked.
 */
accountsRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'CUSTOMER', 'TECHNICIAN'),
  requireAccount('id'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const account = await getAccount(req.params.id);
    res.json({ success: true, data: account });
  }),
);

/**
 * PATCH /api/accounts/:id
 * Update account profile fields. Ownership-checked.
 */
accountsRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  validate({ body: updateAccountSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const account = await updateAccount(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: account });
  }),
);

/**
 * PATCH /api/accounts/:id/status
 * Change account status (admin only).
 */
accountsRouter.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate({ body: updateAccountStatusSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { status } = req.body;
    const account = await updateAccountStatus(req.params.id, status, req.user!.id);
    res.json({ success: true, data: account });
  }),
);

/**
 * DELETE /api/accounts/:id
 * Soft-delete account (admin only). Sets user.deletedAt.
 */
accountsRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await softDeleteAccount(req.params.id, req.user!.id);
    res.json({ success: true, data: { message: 'Account deleted successfully' } });
  }),
);

export { accountsRouter };
