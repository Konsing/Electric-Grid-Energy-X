import { v4 as uuid } from 'uuid';
import { UpdateAccountInput, UpdateAccountStatusInput, AccountStatus } from '@egx/shared';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import {
  CursorPaginationOptions,
  buildCursorQuery,
  processPaginatedResults,
} from '../../lib/pagination';

/**
 * Cursor-paginated list of all accounts with selected fields.
 */
export async function listAccounts(pagination: CursorPaginationOptions) {
  const cursorQuery = buildCursorQuery(pagination);

  const accounts = await prisma.account.findMany({
    ...cursorQuery,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      accountNumber: true,
      firstName: true,
      lastName: true,
      phone: true,
      serviceAddress: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          deletedAt: true,
        },
      },
    },
  });

  return processPaginatedResults(accounts, pagination.limit);
}

/**
 * Get a single account by ID, including its meters.
 * Throws NotFoundError if the account does not exist.
 */
export async function getAccount(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      meters: {
        select: {
          id: true,
          serialNumber: true,
          model: true,
          location: true,
          status: true,
          installedAt: true,
          lastReadingAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!account) {
    throw new NotFoundError('Account', id);
  }

  return account;
}

/**
 * Update account profile fields (firstName, lastName, phone, serviceAddress, fcmToken).
 * Writes an audit log entry for the change.
 */
export async function updateAccount(
  id: string,
  data: UpdateAccountInput,
  actorId: string,
) {
  // Ensure account exists before updating
  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Account', id);
  }

  const account = await prisma.$transaction(async (tx) => {
    const updated = await tx.account.update({
      where: { id },
      data,
      select: {
        id: true,
        accountNumber: true,
        firstName: true,
        lastName: true,
        phone: true,
        serviceAddress: true,
        status: true,
        fcmToken: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'UPDATE',
        resource: 'Account',
        resourceId: id,
        traceId: uuid(),
        metadata: {
          updatedFields: Object.keys(data),
        },
      },
    });

    return updated;
  });

  return account;
}

/**
 * Change an account's status (ACTIVE, INACTIVE, SUSPENDED).
 * Writes an audit log entry for the status change.
 */
export async function updateAccountStatus(
  id: string,
  status: AccountStatus,
  actorId: string,
) {
  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Account', id);
  }

  const previousStatus = existing.status;

  const account = await prisma.$transaction(async (tx) => {
    const updated = await tx.account.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        accountNumber: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'STATUS_CHANGE',
        resource: 'Account',
        resourceId: id,
        traceId: uuid(),
        metadata: {
          previousStatus,
          newStatus: status,
        },
      },
    });

    return updated;
  });

  return account;
}

/**
 * Soft-delete an account by setting the user's deletedAt timestamp.
 * Writes an audit log entry for the deletion.
 */
export async function softDeleteAccount(id: string, actorId: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    select: { id: true, userId: true, accountNumber: true },
  });

  if (!account) {
    throw new NotFoundError('Account', id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: account.userId },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'DELETE',
        resource: 'Account',
        resourceId: id,
        traceId: uuid(),
        metadata: {
          accountNumber: account.accountNumber,
          deletedUserId: account.userId,
        },
      },
    });
  });
}
