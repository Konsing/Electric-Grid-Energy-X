import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Users ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@egx.dev' },
    update: {},
    create: {
      email: 'admin@egx.dev',
      firebaseUid: 'mock-uid-admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@egx.dev' },
    update: {},
    create: {
      email: 'tech@egx.dev',
      firebaseUid: 'mock-uid-tech',
      passwordHash,
      role: Role.TECHNICIAN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@egx.dev' },
    update: {},
    create: {
      email: 'customer@egx.dev',
      firebaseUid: 'mock-uid-customer',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@egx.dev' },
    update: {},
    create: {
      email: 'customer2@egx.dev',
      firebaseUid: 'mock-uid-customer2',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  // ─── Accounts ─────────────────────────────────────
  const adminAccount = await prisma.account.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      accountNumber: 'EGX-ADM-001',
      firstName: 'Admin',
      lastName: 'User',
      serviceAddress: '100 Grid Control Center, Power City, TX 75001',
    },
  });

  const techAccount = await prisma.account.upsert({
    where: { userId: tech.id },
    update: {},
    create: {
      userId: tech.id,
      accountNumber: 'EGX-TCH-001',
      firstName: 'Tech',
      lastName: 'Support',
      serviceAddress: '200 Maintenance Way, Power City, TX 75002',
    },
  });

  const custAccount = await prisma.account.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      accountNumber: 'EGX-CST-001',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '555-0101',
      serviceAddress: '42 Maple Street, Power City, TX 75010',
    },
  });

  const cust2Account = await prisma.account.upsert({
    where: { userId: customer2.id },
    update: {},
    create: {
      userId: customer2.id,
      accountNumber: 'EGX-CST-002',
      firstName: 'John',
      lastName: 'Smith',
      phone: '555-0102',
      serviceAddress: '88 Oak Avenue, Power City, TX 75011',
    },
  });

  // ─── Meters ───────────────────────────────────────
  const meter1 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-001-A' },
    update: {},
    create: {
      accountId: custAccount.id,
      serialNumber: 'MTR-001-A',
      model: 'SmartMeter Pro 3000',
      location: 'Main panel - 42 Maple Street',
    },
  });

  const meter2 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-002-A' },
    update: {},
    create: {
      accountId: cust2Account.id,
      serialNumber: 'MTR-002-A',
      model: 'SmartMeter Pro 3000',
      location: 'Main panel - 88 Oak Avenue',
    },
  });

  // ─── Meter Readings (12 months for customer 1) ───
  const now = new Date();
  const readings = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const baseUsage = 400 + Math.floor(Math.random() * 300); // 400-700 kWh
    readings.push({
      meterId: meter1.id,
      readingValue: baseUsage,
      readingDate: date,
      source: 'SMART_METER' as const,
      idempotencyKey: uuid(),
    });
  }

  // Add readings for customer 2
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const baseUsage = 300 + Math.floor(Math.random() * 200); // 300-500 kWh
    readings.push({
      meterId: meter2.id,
      readingValue: baseUsage,
      readingDate: date,
      source: 'SMART_METER' as const,
      idempotencyKey: uuid(),
    });
  }

  for (const reading of readings) {
    await prisma.meterReading.upsert({
      where: {
        meterId_readingDate_source: {
          meterId: reading.meterId,
          readingDate: reading.readingDate,
          source: reading.source,
        },
      },
      update: {},
      create: reading,
    });
  }

  // ─── Billing Cycles (last 3 months for customer 1) ──
  for (let i = 2; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i, 0);
    const due = new Date(now.getFullYear(), now.getMonth() - i + 1, 15);
    const kwh = 400 + Math.floor(Math.random() * 300);
    const amount = 12.50 + kwh * 0.10; // Simplified for seed

    await prisma.billingCycle.create({
      data: {
        accountId: custAccount.id,
        startDate: start,
        endDate: end,
        totalKwh: kwh,
        amountDue: Math.round(amount * 100) / 100,
        status: i === 0 ? 'ISSUED' : 'PAID',
        dueDate: due,
      },
    });
  }

  // ─── Notifications ────────────────────────────────
  await prisma.notification.create({
    data: {
      accountId: custAccount.id,
      type: 'BILLING',
      title: 'New Bill Available',
      message: 'Your billing statement for this month is now available.',
      idempotencyKey: uuid(),
    },
  });

  await prisma.notification.create({
    data: {
      accountId: custAccount.id,
      type: 'GENERAL',
      title: 'Welcome to Electric Grid Energy X',
      message: 'Thank you for choosing EGX as your energy provider.',
      idempotencyKey: uuid(),
      readAt: new Date(),
    },
  });

  // ─── Outages ──────────────────────────────────────
  await prisma.outage.create({
    data: {
      affectedArea: 'Downtown Power City - Blocks 1-5',
      status: 'IN_PROGRESS',
      severity: 'MEDIUM',
      title: 'Scheduled Maintenance',
      description: 'Planned transformer upgrade affecting downtown area.',
      estimatedResolution: new Date(Date.now() + 4 * 60 * 60 * 1000),
      reportedById: tech.id,
    },
  });

  await prisma.outage.create({
    data: {
      affectedArea: 'Maple Street Area',
      status: 'RESOLVED',
      severity: 'LOW',
      title: 'Brief Power Interruption',
      description: 'Short interruption due to fallen tree branch on power line.',
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      reportedById: tech.id,
    },
  });

  console.log('✅ Seed complete!');
  console.log(`   Users:    ${await prisma.user.count()}`);
  console.log(`   Accounts: ${await prisma.account.count()}`);
  console.log(`   Meters:   ${await prisma.meter.count()}`);
  console.log(`   Readings: ${await prisma.meterReading.count()}`);
  console.log(`   Bills:    ${await prisma.billingCycle.count()}`);
  console.log(`   Notices:  ${await prisma.notification.count()}`);
  console.log(`   Outages:  ${await prisma.outage.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
