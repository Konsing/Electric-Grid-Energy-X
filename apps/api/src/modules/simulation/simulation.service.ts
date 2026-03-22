import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { calculateEnergyCost } from '@egx/shared';

const prisma = new PrismaClient();

// Demo account emails — only these get simulated data
const DEMO_EMAILS = ['admin@egx.dev', 'tech@egx.dev', 'customer@egx.dev'];

// Seasonal multipliers by month index (0=Jan, 11=Dec)
// Higher in summer (AC) and winter (heating), lower in spring/fall
const SEASONAL = [1.3, 1.2, 1.0, 0.8, 0.7, 0.9, 1.4, 1.5, 1.1, 0.8, 0.9, 1.2];

// Time-of-day weights for daily usage distribution (normalized)
// Peak around 6-9 PM, low at 3 AM
function dailyNoise(): number {
  return 0.85 + Math.random() * 0.3; // 0.85–1.15 multiplier
}

function seasonalDailyUsage(month: number, baseDaily: number): number {
  const factor = SEASONAL[month] || 1.0;
  return Math.round(baseDaily * factor * dailyNoise() * 100) / 100;
}

// Outage templates for variety
const OUTAGE_TEMPLATES = [
  {
    severity: 'LOW' as const,
    title: 'Minor Voltage Fluctuation',
    area: 'Maple Street Area',
    description: 'Residents reported minor voltage fluctuations. Investigating potential transformer tap changer issue.',
    hoursToResolve: 3,
  },
  {
    severity: 'MEDIUM' as const,
    title: 'Scheduled Line Maintenance',
    area: 'Downtown Power City - Blocks 6-10',
    description: 'Planned maintenance on aging distribution lines. Brief intermittent outages expected during switching.',
    hoursToResolve: 6,
  },
  {
    severity: 'HIGH' as const,
    title: 'Distribution Feeder Fault',
    area: 'Oak Avenue & Elm Drive Area',
    description: 'A fault on distribution feeder 12 caused protective relay trip. Crews are sectionalizing to isolate and restore.',
    hoursToResolve: 8,
  },
  {
    severity: 'MEDIUM' as const,
    title: 'Wildlife-Related Outage',
    area: 'Pine Ridge Boulevard',
    description: 'Animal contact with overhead equipment caused a breaker trip. Equipment inspection and re-energization underway.',
    hoursToResolve: 2,
  },
  {
    severity: 'LOW' as const,
    title: 'Planned Meter Upgrade',
    area: 'Cedar Court Neighborhood',
    description: 'Smart meter firmware upgrades require brief power cycles. Affected homes will experience 5-10 minute interruptions.',
    hoursToResolve: 4,
  },
];

export async function runMonthlySimulation() {
  const now = new Date();
  // Simulate for the previous month
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month
  const daysInMonth = endDate.getDate();

  const results = {
    readings: 0,
    billingCycles: 0,
    notifications: 0,
    outages: 0,
    period: `${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`,
  };

  // Find demo accounts and their active meters
  const demoAccounts = await prisma.account.findMany({
    where: {
      user: { email: { in: DEMO_EMAILS } },
      status: 'ACTIVE',
    },
    include: {
      user: { select: { id: true, email: true } },
      meters: { where: { status: 'ACTIVE' } },
    },
  });

  if (demoAccounts.length === 0) {
    return { ...results, error: 'No demo accounts found' };
  }

  // Find a tech user for outage reporting
  const techUser = await prisma.user.findFirst({
    where: { email: 'tech@egx.dev' },
  });

  // ─── Generate Daily Meter Readings ───────────────────
  for (const account of demoAccounts) {
    for (const meter of account.meters) {
      // Base daily usage varies by account type
      // Admin/Tech have office-like usage (~15 kWh/day), Customer has residential (~20 kWh/day)
      const baseDaily = account.user.email === 'customer@egx.dev' ? 20 : 15;

      const readingsData = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const readingDate = new Date(year, month, day, 12, 0, 0); // noon each day
        const readingValue = seasonalDailyUsage(month, baseDaily);

        readingsData.push({
          meterId: meter.id,
          readingValue,
          readingDate,
          source: 'SMART_METER' as const,
          idempotencyKey: uuid(),
        });
      }

      // Bulk insert, skip duplicates via the unique constraint
      for (const reading of readingsData) {
        try {
          await prisma.meterReading.create({ data: reading });
          results.readings++;
        } catch {
          // Skip if duplicate (unique constraint on meterId+readingDate+source)
        }
      }

      // Update meter's lastReadingAt
      await prisma.meter.update({
        where: { id: meter.id },
        data: { lastReadingAt: new Date(year, month, daysInMonth, 12, 0, 0) },
      });
    }

    // ─── Generate Billing Cycle ──────────────────────────
    // Check if billing cycle already exists for this period
    const existingCycle = await prisma.billingCycle.findFirst({
      where: {
        accountId: account.id,
        startDate: { gte: startDate },
        endDate: { lte: new Date(year, month + 1, 1) },
      },
    });

    if (!existingCycle) {
      // Sum all readings for this account's meters in the billing period
      const totalUsage = await prisma.meterReading.aggregate({
        where: {
          meter: { accountId: account.id },
          readingDate: { gte: startDate, lte: endDate },
        },
        _sum: { readingValue: true },
      });

      const totalKwh = Math.round((totalUsage._sum.readingValue || 0) * 100) / 100;
      const amountDue = calculateEnergyCost(totalKwh);
      const dueDate = new Date(year, month + 2, 15); // Due 15th of month after next

      await prisma.billingCycle.create({
        data: {
          accountId: account.id,
          startDate,
          endDate,
          totalKwh,
          amountDue,
          status: 'ISSUED',
          dueDate,
        },
      });
      results.billingCycles++;

      // Create billing notification
      await prisma.notification.create({
        data: {
          accountId: account.id,
          type: 'BILLING',
          title: 'New Bill Available',
          message: `Your billing statement for ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} is now available. Total: $${amountDue.toFixed(2)} for ${totalKwh.toFixed(0)} kWh.`,
          idempotencyKey: uuid(),
        },
      });
      results.notifications++;
    }
  }

  // ─── Generate 1-2 Outages (Already Resolved) ────────
  if (techUser) {
    const numOutages = 1 + Math.floor(Math.random() * 2); // 1 or 2
    const usedTemplates = new Set<number>();

    for (let i = 0; i < numOutages; i++) {
      let templateIdx: number;
      do {
        templateIdx = Math.floor(Math.random() * OUTAGE_TEMPLATES.length);
      } while (usedTemplates.has(templateIdx));
      usedTemplates.add(templateIdx);

      const template = OUTAGE_TEMPLATES[templateIdx];
      // Outage happened on a random day during the month
      const outageDay = 1 + Math.floor(Math.random() * (daysInMonth - 2));
      const outageStart = new Date(year, month, outageDay, 8 + Math.floor(Math.random() * 10), 0, 0);
      const outageEnd = new Date(outageStart.getTime() + template.hoursToResolve * 60 * 60 * 1000);

      await prisma.outage.create({
        data: {
          affectedArea: template.area,
          status: 'RESOLVED',
          severity: template.severity,
          title: template.title,
          description: template.description,
          startedAt: outageStart,
          resolvedAt: outageEnd,
          reportedById: techUser.id,
        },
      });
      results.outages++;
    }
  }

  return results;
}
