import { v4 as uuid } from 'uuid';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { CreateMeterInput, UpdateMeterInput } from '@egx/shared';
import { MeterStatus } from '@prisma/client';

/**
 * List all meters belonging to a given account, ordered by creation date descending.
 */
export async function listMeters(accountId: string) {
  const meters = await prisma.meter.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  });

  return meters;
}

/**
 * Get a single meter by ID, including a select of the parent account.
 * Throws NotFoundError if the meter does not exist.
 */
export async function getMeter(id: string) {
  const meter = await prisma.meter.findUnique({
    where: { id },
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

  if (!meter) {
    throw new NotFoundError('Meter', id);
  }

  return meter;
}

/**
 * Create a new meter for the given account.
 * Writes an audit log entry for the creation.
 */
export async function createMeter(
  accountId: string,
  data: CreateMeterInput,
  userId?: string,
) {
  const traceId = uuid();

  const meter = await prisma.$transaction(async (tx) => {
    const created = await tx.meter.create({
      data: {
        accountId,
        serialNumber: data.serialNumber,
        model: data.model,
        location: data.location,
        status: 'ACTIVE' as MeterStatus,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: userId ?? null,
        action: 'CREATE',
        resource: 'Meter',
        resourceId: created.id,
        traceId,
        metadata: {
          accountId,
          serialNumber: data.serialNumber,
          model: data.model,
          location: data.location,
        },
      },
    });

    return created;
  });

  return meter;
}

/**
 * Update an existing meter by ID.
 * Throws NotFoundError if the meter does not exist.
 * Writes an audit log entry for the update.
 */
export async function updateMeter(
  id: string,
  data: UpdateMeterInput,
  userId?: string,
) {
  // Verify the meter exists before attempting update
  const existing = await prisma.meter.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Meter', id);
  }

  const traceId = uuid();

  const meter = await prisma.$transaction(async (tx) => {
    const updated = await tx.meter.update({
      where: { id },
      data: {
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.status !== undefined
          ? { status: data.status as MeterStatus }
          : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: userId ?? null,
        action: 'UPDATE',
        resource: 'Meter',
        resourceId: id,
        traceId,
        metadata: {
          changes: data,
          previous: {
            location: existing.location,
            status: existing.status,
          },
        },
      },
    });

    return updated;
  });

  return meter;
}
