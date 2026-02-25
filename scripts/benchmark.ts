/**
 * Electric Grid Energy X — Performance Benchmark
 *
 * Reproducible proof of strategic PostgreSQL indexing impact.
 *
 * 1. Seeds 10,000 meter readings across 12 months
 * 2. Runs 3 heaviest queries 100× each (with indexes)
 * 3. Drops strategic indexes
 * 4. Runs the same queries again (without indexes)
 * 5. Prints before/after comparison table
 *
 * Usage: pnpm benchmark
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient({ log: ['error'] });

// ─── Config ──────────────────────────────────────────
const READING_COUNT = 10_000;
const QUERY_ITERATIONS = 100;
const MONTHS = 12;

// ─── Helpers ─────────────────────────────────────────
function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function p95(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

async function timeQuery(fn: () => Promise<unknown>, iterations: number): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }
  return times;
}

// ─── Seed ────────────────────────────────────────────
async function seedBenchmarkData() {
  console.log(`\n📊 Seeding ${READING_COUNT.toLocaleString()} meter readings...`);

  // Create benchmark user + account + meter if not exists
  const user = await prisma.user.upsert({
    where: { email: 'bench@egx.dev' },
    update: {},
    create: {
      email: 'bench@egx.dev',
      firebaseUid: 'mock-uid-bench',
      passwordHash: 'not-used',
      role: 'CUSTOMER',
    },
  });

  const account = await prisma.account.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      accountNumber: 'EGX-BENCH-001',
      firstName: 'Bench',
      lastName: 'Mark',
      serviceAddress: '1 Benchmark Lane',
    },
  });

  // Create multiple meters to distribute readings
  const meters = [];
  for (let i = 0; i < 5; i++) {
    const meter = await prisma.meter.upsert({
      where: { serialNumber: `BENCH-MTR-${i}` },
      update: {},
      create: {
        accountId: account.id,
        serialNumber: `BENCH-MTR-${i}`,
        model: 'Benchmark Meter',
        location: `Bench location ${i}`,
      },
    });
    meters.push(meter);
  }

  // Batch insert readings
  const now = new Date();
  const batchSize = 500;
  let created = 0;

  for (let batch = 0; batch < Math.ceil(READING_COUNT / batchSize); batch++) {
    const data = [];
    for (let i = 0; i < batchSize && created < READING_COUNT; i++) {
      const meter = meters[created % meters.length];
      const monthOffset = created % MONTHS;
      const dayOffset = Math.floor(created / MONTHS) % 28;
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, dayOffset + 1);

      data.push({
        meterId: meter.id,
        readingValue: 100 + Math.random() * 900,
        readingDate: date,
        source: 'SMART_METER' as const,
        idempotencyKey: uuid(),
      });
      created++;
    }

    await prisma.meterReading.createMany({
      data,
      skipDuplicates: true,
    });

    process.stdout.write(`\r   ${created.toLocaleString()} / ${READING_COUNT.toLocaleString()} readings`);
  }

  // Create billing cycles and notifications for query targets
  for (let i = 0; i < 20; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i, 0);
    await prisma.billingCycle.create({
      data: {
        accountId: account.id,
        startDate: start,
        endDate: end,
        totalKwh: 500 + Math.random() * 500,
        amountDue: 50 + Math.random() * 100,
        status: i < 3 ? 'ISSUED' : 'PAID',
        dueDate: new Date(now.getFullYear(), now.getMonth() - i + 1, 15),
      },
    }).catch(() => {}); // Skip duplicates
  }

  for (let i = 0; i < 100; i++) {
    await prisma.notification.create({
      data: {
        accountId: account.id,
        type: i % 2 === 0 ? 'BILLING' : 'USAGE_ALERT',
        title: `Notification ${i}`,
        message: `Benchmark notification ${i}`,
        idempotencyKey: uuid(),
        readAt: i % 3 === 0 ? new Date() : null,
      },
    }).catch(() => {});
  }

  console.log('\n   ✅ Seed complete\n');
  return { accountId: account.id, meterIds: meters.map(m => m.id) };
}

// ─── Queries ─────────────────────────────────────────
function getQueries(accountId: string, meterIds: string[]) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return [
    {
      name: 'Usage history range scan',
      fn: () =>
        prisma.meterReading.findMany({
          where: {
            meterId: { in: meterIds },
            readingDate: { gte: sixMonthsAgo },
          },
          orderBy: { readingDate: 'desc' },
          take: 20,
        }),
    },
    {
      name: 'Billing by status',
      fn: () =>
        prisma.billingCycle.findMany({
          where: {
            accountId,
            status: 'ISSUED',
          },
          orderBy: { dueDate: 'asc' },
          take: 20,
        }),
    },
    {
      name: 'Unread notifications',
      fn: () =>
        prisma.notification.findMany({
          where: {
            accountId,
            readAt: null,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
    },
  ];
}

// ─── Index management ────────────────────────────────
const STRATEGIC_INDEXES = [
  'DROP INDEX IF EXISTS "MeterReading_meterId_readingDate_idx"',
  'DROP INDEX IF EXISTS "MeterReading_readingDate_idx"',
  'DROP INDEX IF EXISTS "BillingCycle_accountId_status_idx"',
  'DROP INDEX IF EXISTS "BillingCycle_accountId_dueDate_idx"',
  'DROP INDEX IF EXISTS "BillingCycle_status_dueDate_idx"',
  'DROP INDEX IF EXISTS "Notification_accountId_readAt_idx"',
  'DROP INDEX IF EXISTS "Notification_accountId_createdAt_idx"',
  'DROP INDEX IF EXISTS "Notification_createdAt_idx"',
];

const RECREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS "MeterReading_meterId_readingDate_idx" ON "MeterReading"("meterId", "readingDate")',
  'CREATE INDEX IF NOT EXISTS "MeterReading_readingDate_idx" ON "MeterReading"("readingDate")',
  'CREATE INDEX IF NOT EXISTS "BillingCycle_accountId_status_idx" ON "BillingCycle"("accountId", "status")',
  'CREATE INDEX IF NOT EXISTS "BillingCycle_accountId_dueDate_idx" ON "BillingCycle"("accountId", "dueDate")',
  'CREATE INDEX IF NOT EXISTS "BillingCycle_status_dueDate_idx" ON "BillingCycle"("status", "dueDate")',
  'CREATE INDEX IF NOT EXISTS "Notification_accountId_readAt_idx" ON "Notification"("accountId", "readAt")',
  'CREATE INDEX IF NOT EXISTS "Notification_accountId_createdAt_idx" ON "Notification"("accountId", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt")',
];

// ─── Main ────────────────────────────────────────────
async function main() {
  console.log('⚡ Electric Grid Energy X — Performance Benchmark');
  console.log('═'.repeat(60));

  const { accountId, meterIds } = await seedBenchmarkData();
  const queries = getQueries(accountId, meterIds);

  // ─── Phase 1: WITH indexes ──────────────────────
  console.log(`🔍 Running ${QUERY_ITERATIONS} iterations per query WITH indexes...\n`);
  const indexedResults: Record<string, number[]> = {};

  for (const query of queries) {
    process.stdout.write(`   ${query.name}... `);
    indexedResults[query.name] = await timeQuery(query.fn, QUERY_ITERATIONS);
    console.log(`done (median: ${median(indexedResults[query.name]).toFixed(2)}ms)`);
  }

  // ─── Phase 2: DROP indexes ──────────────────────
  console.log('\n🗑️  Dropping strategic indexes...');
  for (const sql of STRATEGIC_INDEXES) {
    await prisma.$executeRawUnsafe(sql);
  }

  // ─── Phase 3: WITHOUT indexes ───────────────────
  console.log(`\n🔍 Running ${QUERY_ITERATIONS} iterations per query WITHOUT indexes...\n`);
  const noIndexResults: Record<string, number[]> = {};

  for (const query of queries) {
    process.stdout.write(`   ${query.name}... `);
    noIndexResults[query.name] = await timeQuery(query.fn, QUERY_ITERATIONS);
    console.log(`done (median: ${median(noIndexResults[query.name]).toFixed(2)}ms)`);
  }

  // ─── Phase 4: Restore indexes ──────────────────
  console.log('\n🔧 Restoring strategic indexes...');
  for (const sql of RECREATE_INDEXES) {
    await prisma.$executeRawUnsafe(sql);
  }

  // ─── Results ────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 BENCHMARK RESULTS');
  console.log('═'.repeat(60));
  console.log('');

  const header = [
    'Query'.padEnd(28),
    'No Index (med)'.padStart(15),
    'Indexed (med)'.padStart(14),
    'P95 (indexed)'.padStart(14),
    'Speedup'.padStart(10),
  ].join(' │ ');

  console.log(header);
  console.log('─'.repeat(header.length));

  for (const query of queries) {
    const noIdx = median(noIndexResults[query.name]);
    const idx = median(indexedResults[query.name]);
    const idxP95 = p95(indexedResults[query.name]);
    const speedup = noIdx / idx;

    console.log(
      [
        query.name.padEnd(28),
        `${noIdx.toFixed(2)} ms`.padStart(15),
        `${idx.toFixed(2)} ms`.padStart(14),
        `${idxP95.toFixed(2)} ms`.padStart(14),
        `${speedup.toFixed(1)}×`.padStart(10),
      ].join(' │ '),
    );
  }

  console.log('─'.repeat(header.length));
  console.log(`\nDataset: ${READING_COUNT.toLocaleString()} readings, ${QUERY_ITERATIONS} iterations per query`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('Benchmark failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
