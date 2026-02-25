import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  requireAccount,
  requireResourceOwnership,
} from '../../middleware/requireAccount';
import { submitReadingSchema } from '@egx/shared';
import { parsePaginationQuery } from '../../lib/pagination';
import * as readingsService from './readings.service';

// ─── Single router mounted at BOTH /api/meters AND /api/accounts ─
const readingsRouter = Router();

// ─── Meter-scoped routes (matched when mounted at /api/meters) ───

/**
 * GET /api/meters/:id/readings
 * List paginated readings for a specific meter.
 */
readingsRouter.get(
  '/:id/readings',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  requireResourceOwnership('meter'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePaginationQuery(req.query as {
        cursor?: string;
        limit?: string;
      });

      const result = await readingsService.listReadings(
        req.params.id,
        pagination,
      );

      res.json({
        success: true,
        data: result.data,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/meters/:id/readings
 * Submit a new meter reading with idempotency support.
 *
 * If the idempotencyKey already exists, the existing reading is returned
 * with a 200 status (replay semantics). New readings return 201.
 */
readingsRouter.post(
  '/:id/readings',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  validate({ body: submitReadingSchema }),
  requireResourceOwnership('meter'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reading, created } = await readingsService.submitReading(
        req.params.id,
        req.body,
        req.user?.id,
      );

      res.status(created ? 201 : 200).json({
        success: true,
        data: reading,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Account-scoped routes (matched when mounted at /api/accounts)─

/**
 * GET /api/accounts/:id/usage/summary
 * Get aggregated usage summary for the last 12 months.
 */
readingsRouter.get(
  '/:id/usage/summary',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await readingsService.getUsageSummary(req.params.id);

      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/accounts/:id/usage/analytics
 * Get monthly breakdown with kWh and cost for the last 12 months.
 */
readingsRouter.get(
  '/:id/usage/analytics',
  authenticate,
  authorize('ADMIN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const analytics = await readingsService.getUsageAnalytics(req.params.id);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  },
);

export { readingsRouter };
