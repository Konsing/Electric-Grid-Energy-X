import { Request, Response, NextFunction } from 'express';
import { authProvider } from '../lib/auth-provider';
import { prisma } from '../lib/prisma';
import { UnauthorizedError } from '../lib/errors';
import { AUTH_CACHE_TTL } from '@egx/shared';
import { Role } from '@prisma/client';

// In-memory cache: userId → { user, account, expiry }
interface CachedAuth {
  user: { id: string; email: string; role: Role; firebaseUid: string; deletedAt: Date | null };
  account: { id: string; accountNumber: string; status: string } | null;
  expiry: number;
}

const authCache = new Map<string, CachedAuth>();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        firebaseUid: string;
      };
      account?: {
        id: string;
        accountNumber: string;
        status: string;
      } | null;
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const decoded = await authProvider.verifyToken(token);

    // Check cache first
    const cached = authCache.get(decoded.firebaseUid);
    if (cached && cached.expiry > Date.now()) {
      if (cached.user.deletedAt) {
        throw new UnauthorizedError('Account has been deactivated');
      }
      req.user = {
        id: cached.user.id,
        email: cached.user.email,
        role: cached.user.role,
        firebaseUid: cached.user.firebaseUid,
      };
      req.account = cached.account;
      return next();
    }

    // DB lookup
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.firebaseUid },
      include: {
        account: {
          select: { id: true, accountNumber: true, status: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.deletedAt) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    // Populate cache
    authCache.set(decoded.firebaseUid, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firebaseUid: user.firebaseUid,
        deletedAt: user.deletedAt,
      },
      account: user.account,
      expiry: Date.now() + AUTH_CACHE_TTL,
    });

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      firebaseUid: user.firebaseUid,
    };
    req.account = user.account;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return next(err);
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/** Clear the auth cache (useful for tests). */
export function clearAuthCache(): void {
  authCache.clear();
}
