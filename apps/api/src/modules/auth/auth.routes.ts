import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { registerSchema, loginSchema, devLoginSchema } from '@egx/shared';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { prisma } from '../../lib/prisma';
import { registerUser, loginUser, devLogin, getMe } from './auth.service';

// ─── Async handler wrapper ────────────────────────────
// Express 4 does not catch rejected promises from async route handlers.
// This wrapper forwards any thrown or rejected error to next().
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ─── Auth Router (always registered) ──────────────────

const authRouter = Router();

/**
 * POST /api/auth/register
 * Create a new user + account, return JWT.
 */
authRouter.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  }),
);

/**
 * POST /api/auth/login
 * Authenticate with email/password, return JWT.
 */
authRouter.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await loginUser(req.body);
    res.json({ success: true, data: result });
  }),
);

/**
 * GET /api/auth/me
 * Return the authenticated user's profile + account.
 */
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await getMe(req.user!.id);
    res.json({ success: true, data: user });
  }),
);

/**
 * POST /api/auth/logout
 * Write an audit log entry for the logout event.
 */
authRouter.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'LOGOUT',
        resource: 'User',
        resourceId: req.user!.id,
        traceId: uuid(),
        metadata: { email: req.user!.email },
      },
    });

    res.json({ success: true, data: { message: 'Logged out successfully' } });
  }),
);

// ─── Dev Auth Router (dev/test only) ──────────────────

const devAuthRouter = Router();

/**
 * POST /api/auth/dev-login
 * Dev-only: sign in by email without a password.
 */
devAuthRouter.post(
  '/dev-login',
  validate({ body: devLoginSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.body;
    const result = await devLogin(email);
    res.json({ success: true, data: result });
  }),
);

export { authRouter, devAuthRouter };
