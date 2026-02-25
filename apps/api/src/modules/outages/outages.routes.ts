import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createOutageSchema, updateOutageSchema } from '@egx/shared';
import { parsePaginationQuery } from '../../lib/pagination';
import { OutageStatus, OutageSeverity } from '@prisma/client';
import * as outagesService from './outages.service';

const outagesRouter = Router();

/**
 * GET /api/outages
 * List all outages (cursor-paginated, filterable by status/severity).
 */
outagesRouter.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePaginationQuery(req.query as any);
      const filters = {
        status: req.query.status as OutageStatus | undefined,
        severity: req.query.severity as OutageSeverity | undefined,
      };
      const result = await outagesService.listOutages(filters, pagination);
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
 * GET /api/outages/active
 * List active outages (not RESOLVED).
 */
outagesRouter.get(
  '/active',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outages = await outagesService.listActiveOutages();
      res.json({ success: true, data: outages });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/outages/:id
 * Get a single outage.
 */
outagesRouter.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outage = await outagesService.getOutage(req.params.id);
      res.json({ success: true, data: outage });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/outages
 * Report a new outage.
 */
outagesRouter.post(
  '/',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN'),
  validate({ body: createOutageSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outage = await outagesService.createOutage(req.body, req.user!.id);
      res.status(201).json({ success: true, data: outage });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/outages/:id
 * Update an outage.
 */
outagesRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN'),
  validate({ body: updateOutageSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outage = await outagesService.updateOutage(
        req.params.id,
        req.body,
        req.user?.id,
      );
      res.json({ success: true, data: outage });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/outages/:id/resolve
 * Resolve an outage.
 */
outagesRouter.post(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const outage = await outagesService.resolveOutage(req.params.id, req.user?.id);
      res.json({ success: true, data: outage });
    } catch (err) {
      next(err);
    }
  },
);

export { outagesRouter };
