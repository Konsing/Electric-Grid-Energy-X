import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { requireAccount, requireResourceOwnership } from '../../middleware/requireAccount';
import { payBillSchema, generateCycleSchema, updateBillingStatusSchema } from '@egx/shared';
import { parsePaginationQuery } from '../../lib/pagination';
import { BillingStatus } from '@prisma/client';
import * as billingService from './billing.service';

const billingRouter = Router();

// ─── Account-scoped (mounted at /api/accounts) ─────

/**
 * GET /api/accounts/:id/billing
 * Cursor-paginated billing cycles for an account.
 */
billingRouter.get(
  '/:id/billing',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePaginationQuery(req.query as any);
      const result = await billingService.listAccountBilling(req.params.id, pagination);
      res.json({
        success: true,
        data: result.data,
        pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Billing-scoped (mounted at /api/billing) ──────

/**
 * GET /api/billing
 * List all billing cycles (admin only). Filterable by ?status=ISSUED
 */
billingRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePaginationQuery(req.query as any);
      const filters = {
        status: req.query.status as BillingStatus | undefined,
      };
      const result = await billingService.listAllBilling(filters, pagination);
      res.json({
        success: true,
        data: result.data,
        pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/generate
 * Batch generate billing cycles for all eligible accounts.
 */
billingRouter.post(
  '/generate',
  authenticate,
  authorize('ADMIN'),
  validate({ body: generateCycleSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.body;
      const result = await billingService.batchGenerateBilling(
        new Date(startDate),
        new Date(endDate),
        req.user?.id,
      );
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/generate/:id
 * Generate billing cycle for a single account.
 */
billingRouter.post(
  '/generate/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ body: generateCycleSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.body;
      const result = await billingService.generateBillingCycle(
        req.params.id,
        new Date(startDate),
        new Date(endDate),
        req.user?.id,
      );
      res.status(result.skipped ? 200 : 201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/billing/:id
 * Get single billing cycle with payment.
 */
billingRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireResourceOwnership('billingCycle'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycle = await billingService.getBillingCycle(req.params.id);
      res.json({ success: true, data: cycle });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/billing/:id/pay
 * Pay a bill. Requires idempotencyKey.
 */
billingRouter.post(
  '/:id/pay',
  authenticate,
  requireResourceOwnership('billingCycle'),
  validate({ body: payBillSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payment, created } = await billingService.payBill(
        req.params.id,
        req.body,
        req.user?.id,
      );
      res.status(created ? 201 : 200).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/billing/:id/status
 * Update billing cycle status with optimistic locking.
 */
billingRouter.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate({ body: updateBillingStatusSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycle = await billingService.updateBillingStatus(
        req.params.id,
        req.body.status,
        req.user?.id,
      );
      res.json({ success: true, data: cycle });
    } catch (err) {
      next(err);
    }
  },
);

export { billingRouter };
