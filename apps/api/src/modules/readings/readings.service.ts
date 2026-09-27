import { v4 as uuid } from 'uuid';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import {
  buildCursorQuery,
  processPaginatedResults,
  CursorPaginationOptions,
} from '../../lib/pagination';
import { SubmitReadingInput, calculateEnergyCost } from '@egx/shared';
import { ReadingSource } from '@prisma/client';

/**
 * List meter readings for a given meter with cursor-based pagination.
 * Ordered by readingDate descending (most recent first).
 */
export async function listReadings(
  meterId: string,
  pagination: CursorPaginationOptions,
) {
  const cursorQuery = buildCursorQuery(pagination);

  const readings = await prisma.meterReading.findMany({
    where: { meterId },
    orderBy: { readingDate: 'desc' },
    ...cursorQuery,
  });

  return processPaginatedResults(readings, pagination.limit);
}

/**
 * Submit a new meter reading with idempotency support.
 *
 * If a reading with the same idempotencyKey already exists, the existing
 * reading is returned (replay semantics). This is the correct idempotency
 * pattern: repeated submissions return the same result without error.
 *
 * Otherwise, creates the reading, updates the meter's lastReadingAt
 * timestamp, and writes an audit log entry.
 */
export async function submitReading(
  meterId: string,
  data: SubmitReadingInput,
  userId?: string,
) {
  // Check for existing reading with this idempotency key
  const existing = await prisma.meterReading.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });

  if (existing) {
    // Idempotent replay: return the existing reading as-is
    return { reading: existing, created: false };
  }

  const traceId = uuid();

  const reading = await prisma.$transaction(async (tx) => {
    const created = await tx.meterReading.create({
      data: {
        meterId,
        readingValue: data.readingValue,
        readingDate: new Date(data.readingDate),
        source: data.source as ReadingSource,
        idempotencyKey: data.idempotencyKey,
      },
    });

    // Update the meter's lastReadingAt to track when the most recent reading was taken
    await tx.meter.update({
      where: { id: meterId },
      data: { lastReadingAt: new Date(data.readingDate) },
    });

    await tx.auditLog.create({
      data: {
        userId: userId ?? null,
        action: 'CREATE',
        resource: 'MeterReading',
        resourceId: created.id,
        traceId,
        metadata: {
          meterId,
          readingValue: data.readingValue,
          readingDate: data.readingDate,
          source: data.source,
        },
      },
    });

    return created;
  });

  return { reading, created: true };
}

/**
 * Get a usage summary for an account over the last 12 completed months.
 *
 * Derived from getUsageAnalytics so the stat cards always agree with the
 * dashboard charts. The in-progress month is excluded because readings for
 * it are not recorded until the month has ended.
 *
 * Returns:
 * - totalKwh: total energy consumed in the last 12 completed months
 * - averageMonthly: average monthly consumption
 * - latestMonth: ISO date string for the first day of the latest completed month
 * - currentMonth: kWh consumed in the latest completed month
 * - previousMonth: kWh consumed in the month before that
 * - trend: percentage change from previousMonth to currentMonth
 */
export async function getUsageSummary(accountId: string) {
  const { months } = await getUsageAnalytics(accountId);

  if (months.length === 0) {
    return {
      totalKwh: 0,
      averageMonthly: 0,
      latestMonth: null,
      currentMonth: 0,
      previousMonth: 0,
      trend: 0,
    };
  }

  const totalKwh = months.reduce((sum, m) => sum + m.kwh, 0);
  const latest = months[months.length - 1];
  const currentMonth = latest.kwh;
  const previousMonth = months[months.length - 2]?.kwh ?? 0;

  // Calculate averages and trend
  const averageMonthly = totalKwh > 0 ? Math.round((totalKwh / 12) * 100) / 100 : 0;
  const trend =
    previousMonth > 0
      ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100 * 100) / 100
      : 0;

  return {
    totalKwh: Math.round(totalKwh * 100) / 100,
    averageMonthly,
    latestMonth: latest.month,
    currentMonth,
    previousMonth,
    trend,
  };
}

/**
 * Get usage analytics for an account: a monthly breakdown of energy
 * consumption and cost for the last 12 completed months.
 *
 * The current (in-progress) month is excluded so the timeline lines up with
 * billing cycles, which are only issued once a month has ended.
 *
 * Returns an array of objects, each containing:
 * - month: ISO date string for the first day of that month
 * - year / monthNumber: numeric identifiers
 * - kwh: total energy consumed in that month
 * - cost: calculated tiered cost for that month's consumption
 */
export async function getUsageAnalytics(accountId: string) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 12,
    1,
    0,
    0,
    0,
    0,
  );

  // Get all meters for this account
  const meters = await prisma.meter.findMany({
    where: { accountId },
    select: { id: true },
  });

  const meterIds = meters.map((m) => m.id);

  if (meterIds.length === 0) {
    return { months: [] };
  }

  // Fetch all readings from the last 12 completed months
  const readings = await prisma.meterReading.findMany({
    where: {
      meterId: { in: meterIds },
      readingDate: { gte: twelveMonthsAgo, lt: currentMonthStart },
    },
    select: {
      readingValue: true,
      readingDate: true,
    },
    orderBy: { readingDate: 'asc' },
  });

  // Group readings by year-month
  const monthlyMap = new Map<string, number>();

  // Pre-populate all 12 months so we always return a full timeline
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 12 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, 0);
  }

  for (const reading of readings) {
    const date = new Date(reading.readingDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyMap.get(key) ?? 0;
    monthlyMap.set(key, current + reading.readingValue);
  }

  // Convert to sorted array with cost calculations
  const months = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, kwh]) => {
      const [yearStr, monthStr] = key.split('-');
      const year = parseInt(yearStr, 10);
      const monthNumber = parseInt(monthStr, 10);
      const roundedKwh = Math.round(kwh * 100) / 100;
      const cost = calculateEnergyCost(roundedKwh);

      return {
        month: new Date(year, monthNumber - 1, 1).toISOString(),
        year,
        monthNumber,
        kwh: roundedKwh,
        cost,
      };
    });

  return { months };
}
