import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  requireAccount,
  requireResourceOwnership,
} from '../../middleware/requireAccount';
import { createMeterSchema, updateMeterSchema } from '@egx/shared';
import * as metersService from './meters.service';

// ─── Primary router: mounted at /api/meters ─────────────────────
const metersRouter = Router();

/**
 * GET /api/meters/:id
 * Get a single meter by its ID.
 */
metersRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  requireResourceOwnership('meter'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meter = await metersService.getMeter(req.params.id);

      res.json({
        success: true,
        data: meter,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/meters/:id
 * Update a meter (location and/or status).
 */
metersRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN'),
  requireResourceOwnership('meter'),
  validate({ body: updateMeterSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meter = await metersService.updateMeter(
        req.params.id,
        req.body,
        req.user?.id,
      );

      res.json({
        success: true,
        data: meter,
      });
    } catch (err) {
      next(err);
    }
  },
);

// ─── Account-scoped router: mounted at /api/accounts ────────────
const accountMetersRouter = Router();

/**
 * GET /api/accounts/:id/meters
 * List all meters for a given account.
 */
accountMetersRouter.get(
  '/:id/meters',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN', 'CUSTOMER'),
  requireAccount('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meters = await metersService.listMeters(req.params.id);

      res.json({
        success: true,
        data: meters,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/accounts/:id/meters
 * Create a new meter for the given account.
 */
accountMetersRouter.post(
  '/:id/meters',
  authenticate,
  authorize('ADMIN', 'TECHNICIAN'),
  requireAccount('id'),
  validate({ body: createMeterSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const meter = await metersService.createMeter(
        req.params.id,
        req.body,
        req.user?.id,
      );

      res.status(201).json({
        success: true,
        data: meter,
      });
    } catch (err) {
      next(err);
    }
  },
);

export { metersRouter, accountMetersRouter };
