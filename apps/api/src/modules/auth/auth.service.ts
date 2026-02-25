import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { RegisterInput, LoginInput } from '@egx/shared';
import { prisma } from '../../lib/prisma';
import { signToken } from '../../lib/auth-provider';
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '../../lib/errors';
import { ErrorCode } from '@egx/shared';

const BCRYPT_ROUNDS = 12;

/**
 * Generate a random account number in the format EGX-XXXXXX
 * where X is an uppercase alphanumeric character.
 */
function generateAccountNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EGX-${code}`;
}

/**
 * Register a new user with a local password, create their account,
 * and return a signed JWT.
 */
export async function registerUser(input: RegisterInput) {
  const { email, password, firstName, lastName, phone, serviceAddress } = input;

  // Check for existing user with this email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError(ErrorCode.ALREADY_EXISTS, 'A user with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const firebaseUid = `local-${uuid()}`;
  const accountNumber = generateAccountNumber();

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        firebaseUid,
        passwordHash,
        role: 'CUSTOMER',
      },
    });

    const account = await tx.account.create({
      data: {
        userId: user.id,
        accountNumber,
        firstName,
        lastName,
        phone: phone ?? null,
        serviceAddress,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        resource: 'User',
        resourceId: user.id,
        traceId: uuid(),
        metadata: { email, accountNumber },
      },
    });

    return { user, account };
  });

  const token = signToken({
    sub: result.user.firebaseUid,
    email: result.user.email,
    role: result.user.role,
  });

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      createdAt: result.user.createdAt,
    },
    account: {
      id: result.account.id,
      accountNumber: result.account.accountNumber,
      firstName: result.account.firstName,
      lastName: result.account.lastName,
    },
  };
}

/**
 * Authenticate an existing user with email and password.
 * Returns a signed JWT and user data.
 */
export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: {
      account: {
        select: {
          id: true,
          accountNumber: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      resource: 'User',
      resourceId: user.id,
      traceId: uuid(),
      metadata: { email },
    },
  });

  const token = signToken({
    sub: user.firebaseUid,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      account: user.account,
    },
  };
}

/**
 * Dev-only login: find user by email and sign a token without
 * requiring a password. Never exposed in production.
 */
export async function devLogin(email: string) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: {
      account: {
        select: {
          id: true,
          accountNumber: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User', email);
  }

  const token = signToken({
    sub: user.firebaseUid,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      account: user.account,
    },
  };
}

/**
 * Return the full user profile including their account for /me.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      account: {
        select: {
          id: true,
          accountNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          serviceAddress: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User', userId);
  }

  return user;
}
