import { prisma } from '../../lib/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { ErrorCode } from '@egx/shared';
import { OutageStatus, OutageSeverity, Prisma } from '@prisma/client';
import {
  CursorPaginationOptions,
  buildCursorQuery,
  processPaginatedResults,
} from '../../lib/pagination';
import { v4 as uuid } from 'uuid';

// ─── List outages (filterable) ──────────────────────
export async function listOutages(
  filters: { status?: OutageStatus; severity?: OutageSeverity },
  pagination: CursorPaginationOptions,
) {
  const where: Prisma.OutageWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;

  const cursorQuery = buildCursorQuery(pagination);

  const outages = await prisma.outage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    ...cursorQuery,
  });

  return processPaginatedResults(outages, pagination.limit);
}

// ─── List active outages (not resolved) ─────────────
export async function listActiveOutages() {
  return prisma.outage.findMany({
    where: { status: { not: 'RESOLVED' } },
    orderBy: [{ severity: 'desc' }, { startedAt: 'desc' }],
  });
}

// ─── Get single outage ─────────────────────────────
export async function getOutage(id: string) {
  const outage = await prisma.outage.findUnique({ where: { id } });
  if (!outage) throw new NotFoundError('Outage', id);
  return outage;
}

// ─── Create outage ──────────────────────────────────
export async function createOutage(
  data: {
    affectedArea: string;
    severity: string;
    title: string;
    description: string;
    estimatedResolution?: string;
  },
  reportedById: string,
) {
  const outage = await prisma.$transaction(async (tx) => {
    const created = await tx.outage.create({
      data: {
        affectedArea: data.affectedArea,
        severity: data.severity as OutageSeverity,
        title: data.title,
        description: data.description,
        estimatedResolution: data.estimatedResolution
          ? new Date(data.estimatedResolution)
          : null,
        reportedById,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: reportedById,
        action: 'CREATE',
        resource: 'Outage',
        resourceId: created.id,
        traceId: uuid(),
        metadata: {
          affectedArea: data.affectedArea,
          severity: data.severity,
        },
      },
    });

    return created;
  });

  return outage;
}

// ─── Update outage ──────────────────────────────────
export async function updateOutage(
  id: string,
  data: {
    affectedArea?: string;
    severity?: string;
    title?: string;
    description?: string;
    status?: string;
    estimatedResolution?: string | null;
  },
  actorId?: string,
) {
  const outage = await prisma.outage.findUnique({ where: { id } });
  if (!outage) throw new NotFoundError('Outage', id);

  const updateData: Prisma.OutageUpdateInput = {};
  if (data.affectedArea) updateData.affectedArea = data.affectedArea;
  if (data.severity) updateData.severity = data.severity as OutageSeverity;
  if (data.title) updateData.title = data.title;
  if (data.description) updateData.description = data.description;
  if (data.status) {
    updateData.status = data.status as OutageStatus;
    if (data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }
  }
  if (data.estimatedResolution !== undefined) {
    updateData.estimatedResolution = data.estimatedResolution
      ? new Date(data.estimatedResolution)
      : null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.outage.update({
      where: { id },
      data: updateData,
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: data.status ? 'STATUS_CHANGE' : 'UPDATE',
        resource: 'Outage',
        resourceId: id,
        traceId: uuid(),
        metadata: {
          previousStatus: outage.status,
          ...(data.status ? { newStatus: data.status } : {}),
          updatedFields: Object.keys(data),
        },
      },
    });

    return result;
  });

  return updated;
}

// ─── Resolve outage ─────────────────────────────────
export async function resolveOutage(id: string, actorId?: string) {
  const outage = await prisma.outage.findUnique({ where: { id } });
  if (!outage) throw new NotFoundError('Outage', id);

  if (outage.status === 'RESOLVED') {
    throw new ConflictError(
      ErrorCode.OUTAGE_ALREADY_RESOLVED,
      'This outage has already been resolved',
    );
  }

  const resolved = await prisma.$transaction(async (tx) => {
    const result = await tx.outage.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: 'STATUS_CHANGE',
        resource: 'Outage',
        resourceId: id,
        traceId: uuid(),
        metadata: {
          previousStatus: outage.status,
          newStatus: 'RESOLVED',
        },
      },
    });

    return result;
  });

  return resolved;
}
