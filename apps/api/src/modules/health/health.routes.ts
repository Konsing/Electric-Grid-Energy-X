import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { getMetrics } from '../../middleware/metrics';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// GET /api/health — basic health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    },
  });
});

// GET /api/health/ready — readiness check (DB connection)
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      data: {
        status: 'ready',
        database: 'connected',
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed',
      },
    });
  }
});

export const healthRouter = router;

// Separate router for metrics (requires admin auth)
const metricsRouter = Router();

// GET /api/metrics — per-route P50/P95/P99 (last 5 min)
metricsRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: getMetrics(),
    });
  },
);

export { metricsRouter };
