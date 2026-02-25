import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { ErrorCode, calculateEnergyCost, MAX_RETRY_ATTEMPTS } from '@egx/shared';
import { BillingStatus, PaymentStatus, Prisma } from '@prisma/client';
import {
  CursorPaginationOptions,
  buildCursorQuery,
  processPaginatedResults,
} from '../../lib/pagination';
import { v4 as uuid } from 'uuid';

// ─── List billing cycles for an account ─────────────
export async function listAccountBilling(
  accountId: string,
  pagination: CursorPaginationOptions,
) {
  const cursorQuery = buildCursorQuery(pagination);

  const cycles = await prisma.billingCycle.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
    include: { payment: { select: { id: true, status: true, paidAt: true, method: true } } },
    ...cursorQuery,
  });

  return processPaginatedResults(cycles, pagination.limit);
}

// ─── List all billing cycles (admin, filterable) ────
export async function listAllBilling(
  filters: { status?: BillingStatus },
  pagination: CursorPaginationOptions,
) {
  const where: Prisma.BillingCycleWhereInput = {};
  if (filters.status) where.status = filters.status;

  const cursorQuery = buildCursorQuery(pagination);

  const cycles = await prisma.billingCycle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      account: { select: { id: true, accountNumber: true, firstName: true, lastName: true } },
      payment: { select: { id: true, status: true, paidAt: true } },
    },
    ...cursorQuery,
  });

  return processPaginatedResults(cycles, pagination.limit);
}

// ─── Get single billing cycle ───────────────────────
export async function getBillingCycle(id: string) {
  const cycle = await prisma.billingCycle.findUnique({
    where: { id },
    include: {
      account: { select: { id: true, accountNumber: true, firstName: true, lastName: true } },
      payment: true,
    },
  });

  if (!cycle) throw new NotFoundError('BillingCycle', id);
  return cycle;
}

// ─── Pay a bill ─────────────────────────────────────
export async function payBill(
  billingCycleId: string,
  data: { method: string; idempotencyKey: string },
  actorId?: string,
) {
  // Idempotency check: if payment with same key exists, return it
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });
  if (existing) {
    return { payment: existing, created: false };
  }

  // Load billing cycle
  const cycle = await prisma.billingCycle.findUnique({
    where: { id: billingCycleId },
  });
  if (!cycle) throw new NotFoundError('BillingCycle', billingCycleId);

  // Status guards
  if (cycle.status === 'PAID') {
    throw new ConflictError(ErrorCode.ALREADY_PAID, 'This bill has already been paid');
  }
  if (cycle.status === 'CANCELLED') {
    throw new ConflictError(ErrorCode.BILL_CANCELLED, 'This bill has been cancelled');
  }
  if (cycle.status !== 'ISSUED') {
    throw new ConflictError(ErrorCode.BILL_NOT_PAYABLE, `Cannot pay a bill with status ${cycle.status}`);
  }

  // Transaction: create payment + update cycle with optimistic lock
  const result = await prisma.$transaction(async (tx) => {
    // Optimistic lock: update only if version matches
    const updated = await tx.billingCycle.updateMany({
      where: { id: billingCycleId, version: cycle.version },
      data: {
        status: 'PAID',
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new ConflictError(
        ErrorCode.OPTIMISTIC_LOCK_FAILED,
        'Billing cycle was modified concurrently. Please retry.',
      );
    }

    const payment = await tx.payment.create({
      data: {
        billingCycleId,
        amount: cycle.amountDue,
        method: data.method as any,
        status: 'COMPLETED',
        idempotencyKey: data.idempotencyKey,
        paidAt: new Date(),
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        resource: 'Payment',
        resourceId: payment.id,
        traceId: uuid(),
        metadata: {
          billingCycleId,
          amount: cycle.amountDue,
          method: data.method,
        },
      },
    });

    return payment;
  });

  return { payment: result, created: true };
}

// ─── Update billing status (admin, optimistic lock) ─
export async function updateBillingStatus(
  id: string,
  status: BillingStatus,
  actorId?: string,
) {
  const cycle = await prisma.billingCycle.findUnique({ where: { id } });
  if (!cycle) throw new NotFoundError('BillingCycle', id);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.billingCycle.updateMany({
      where: { id, version: cycle.version },
      data: { status, version: { increment: 1 } },
    });

    if (updated.count === 0) {
      throw new ConflictError(
        ErrorCode.OPTIMISTIC_LOCK_FAILED,
        'Billing cycle was modified concurrently. Please retry.',
      );
    }

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'STATUS_CHANGE',
        resource: 'BillingCycle',
        resourceId: id,
        traceId: uuid(),
        metadata: { previousStatus: cycle.status, newStatus: status },
      },
    });

    return tx.billingCycle.findUnique({ where: { id } });
  });

  return result;
}

// ─── Generate billing cycle for single account ──────
export async function generateBillingCycle(
  accountId: string,
  startDate: Date,
  endDate: Date,
  actorId?: string,
) {
  // Idempotent: skip if overlapping PENDING or ISSUED cycle exists
  const existing = await prisma.billingCycle.findFirst({
    where: {
      accountId,
      status: { in: ['PENDING', 'ISSUED'] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
  if (existing) return { cycle: existing, skipped: true };

  // Sum readings across all account meters in date range
  const meters = await prisma.meter.findMany({
    where: { accountId },
    select: { id: true },
  });

  const readings = await prisma.meterReading.aggregate({
    where: {
      meterId: { in: meters.map((m) => m.id) },
      readingDate: { gte: startDate, lte: endDate },
    },
    _sum: { readingValue: true },
  });

  const totalKwh = readings._sum.readingValue || 0;
  const amountDue = calculateEnergyCost(totalKwh);
  const dueDate = new Date(endDate);
  dueDate.setDate(dueDate.getDate() + 30);

  const cycle = await prisma.$transaction(async (tx) => {
    const created = await tx.billingCycle.create({
      data: {
        accountId,
        startDate,
        endDate,
        totalKwh,
        amountDue,
        status: 'ISSUED',
        dueDate,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        resource: 'BillingCycle',
        resourceId: created.id,
        traceId: uuid(),
        metadata: { accountId, totalKwh, amountDue },
      },
    });

    return created;
  });

  return { cycle, skipped: false };
}

// ─── Batch generate for all eligible accounts ───────
export async function batchGenerateBilling(
  startDate: Date,
  endDate: Date,
  actorId?: string,
) {
  const accounts = await prisma.account.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });

  let generated = 0;
  let skipped = 0;

  for (const account of accounts) {
    const result = await generateBillingCycle(account.id, startDate, endDate, actorId);
    if (result.skipped) {
      skipped++;
    } else {
      generated++;
    }
  }

  return { generated, skipped, total: accounts.length };
}
