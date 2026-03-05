import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (order matters — delete children before parents)
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billingCycle.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.meterReading.deleteMany();
  await prisma.outage.deleteMany();
  await prisma.meter.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  // ─── Users ────────────────────────────────────────

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

  const tech2 = await prisma.user.upsert({
    where: { email: 'maria.santos@egx.dev' },
    update: {},
    create: {
      email: 'maria.santos@egx.dev',
      firebaseUid: 'mock-uid-tech2',
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

  const customer3 = await prisma.user.upsert({
    where: { email: 'lisa.chen@email.com' },
    update: {},
    create: {
      email: 'lisa.chen@email.com',
      firebaseUid: 'mock-uid-customer3',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer4 = await prisma.user.upsert({
    where: { email: 'marcus.johnson@email.com' },
    update: {},
    create: {
      email: 'marcus.johnson@email.com',
      firebaseUid: 'mock-uid-customer4',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer5 = await prisma.user.upsert({
    where: { email: 'sarah.williams@email.com' },
    update: {},
    create: {
      email: 'sarah.williams@email.com',
      firebaseUid: 'mock-uid-customer5',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer6 = await prisma.user.upsert({
    where: { email: 'david.kim@email.com' },
    update: {},
    create: {
      email: 'david.kim@email.com',
      firebaseUid: 'mock-uid-customer6',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer7 = await prisma.user.upsert({
    where: { email: 'rachel.torres@email.com' },
    update: {},
    create: {
      email: 'rachel.torres@email.com',
      firebaseUid: 'mock-uid-customer7',
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
      firstName: 'James',
      lastName: 'Rivera',
      phone: '555-0200',
      serviceAddress: '200 Maintenance Way, Power City, TX 75002',
    },
  });

  const tech2Account = await prisma.account.upsert({
    where: { userId: tech2.id },
    update: {},
    create: {
      userId: tech2.id,
      accountNumber: 'EGX-TCH-002',
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '555-0201',
      serviceAddress: '210 Maintenance Way, Power City, TX 75002',
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

  const cust3Account = await prisma.account.upsert({
    where: { userId: customer3.id },
    update: {},
    create: {
      userId: customer3.id,
      accountNumber: 'EGX-CST-003',
      firstName: 'Lisa',
      lastName: 'Chen',
      phone: '555-0103',
      serviceAddress: '156 Birch Lane, Power City, TX 75012',
    },
  });

  const cust4Account = await prisma.account.upsert({
    where: { userId: customer4.id },
    update: {},
    create: {
      userId: customer4.id,
      accountNumber: 'EGX-CST-004',
      firstName: 'Marcus',
      lastName: 'Johnson',
      phone: '555-0104',
      serviceAddress: '331 Elm Drive, Power City, TX 75013',
    },
  });

  const cust5Account = await prisma.account.upsert({
    where: { userId: customer5.id },
    update: {},
    create: {
      userId: customer5.id,
      accountNumber: 'EGX-CST-005',
      firstName: 'Sarah',
      lastName: 'Williams',
      phone: '555-0105',
      serviceAddress: '720 Cedar Court, Power City, TX 75014',
      status: 'SUSPENDED',
    },
  });

  const cust6Account = await prisma.account.upsert({
    where: { userId: customer6.id },
    update: {},
    create: {
      userId: customer6.id,
      accountNumber: 'EGX-CST-006',
      firstName: 'David',
      lastName: 'Kim',
      phone: '555-0106',
      serviceAddress: '45 Willow Way, Power City, TX 75015',
    },
  });

  const cust7Account = await prisma.account.upsert({
    where: { userId: customer7.id },
    update: {},
    create: {
      userId: customer7.id,
      accountNumber: 'EGX-CST-007',
      firstName: 'Rachel',
      lastName: 'Torres',
      phone: '555-0107',
      serviceAddress: '892 Pine Ridge Blvd, Power City, TX 75016',
    },
  });

  // ─── Meters ───────────────────────────────────────

  // Jane Doe — 2 meters (house + garage workshop)
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

  const meter1b = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-001-B' },
    update: {},
    create: {
      accountId: custAccount.id,
      serialNumber: 'MTR-001-B',
      model: 'SmartMeter Lite 1000',
      location: 'Garage workshop - 42 Maple Street',
    },
  });

  // John Smith
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

  // Lisa Chen
  const meter3 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-003-A' },
    update: {},
    create: {
      accountId: cust3Account.id,
      serialNumber: 'MTR-003-A',
      model: 'SmartMeter Pro 5000',
      location: 'Main panel - 156 Birch Lane',
    },
  });

  // Marcus Johnson — high usage commercial
  const meter4 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-004-A' },
    update: {},
    create: {
      accountId: cust4Account.id,
      serialNumber: 'MTR-004-A',
      model: 'SmartMeter Industrial 8000',
      location: 'Main panel - 331 Elm Drive',
    },
  });

  // Sarah Williams (suspended — meter in maintenance)
  const meter5 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-005-A' },
    update: {},
    create: {
      accountId: cust5Account.id,
      serialNumber: 'MTR-005-A',
      model: 'SmartMeter Pro 3000',
      location: 'Main panel - 720 Cedar Court',
      status: 'MAINTENANCE',
    },
  });

  // David Kim
  const meter6 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-006-A' },
    update: {},
    create: {
      accountId: cust6Account.id,
      serialNumber: 'MTR-006-A',
      model: 'SmartMeter Pro 3000',
      location: 'Main panel - 45 Willow Way',
    },
  });

  // Rachel Torres — 2 meters (main + pool house)
  const meter7 = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-007-A' },
    update: {},
    create: {
      accountId: cust7Account.id,
      serialNumber: 'MTR-007-A',
      model: 'SmartMeter Pro 5000',
      location: 'Main panel - 892 Pine Ridge Blvd',
    },
  });

  const meter7b = await prisma.meter.upsert({
    where: { serialNumber: 'MTR-007-B' },
    update: {},
    create: {
      accountId: cust7Account.id,
      serialNumber: 'MTR-007-B',
      model: 'SmartMeter Lite 1000',
      location: 'Pool house - 892 Pine Ridge Blvd',
    },
  });

  // ─── Meter Readings ───────────────────────────────
  // Seasonal pattern: higher in summer (Jun-Aug) and winter (Dec-Feb)
  function seasonalUsage(month: number, base: number, range: number): number {
    const seasonal = [1.3, 1.2, 1.0, 0.8, 0.7, 0.9, 1.4, 1.5, 1.1, 0.8, 0.9, 1.2];
    const factor = seasonal[month] || 1.0;
    return Math.round(base * factor + Math.random() * range);
  }

  const readings: Array<{
    meterId: string;
    readingValue: number;
    readingDate: Date;
    source: 'SMART_METER' | 'MANUAL' | 'ESTIMATED';
    idempotencyKey: string;
  }> = [];

  // Jane Doe main meter — 12 months, moderate usage
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter1.id,
      readingValue: seasonalUsage(date.getMonth(), 450, 150),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // Jane Doe garage meter — 12 months, low usage
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter1b.id,
      readingValue: seasonalUsage(date.getMonth(), 80, 40),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // John Smith — 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter2.id,
      readingValue: seasonalUsage(date.getMonth(), 380, 120),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // Lisa Chen — 12 months, efficient household
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter3.id,
      readingValue: seasonalUsage(date.getMonth(), 320, 100),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // Marcus Johnson — 12 months, high usage
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter4.id,
      readingValue: seasonalUsage(date.getMonth(), 900, 300),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // Sarah Williams — only 4 months (then suspended)
  for (let i = 7; i >= 4; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter5.id,
      readingValue: seasonalUsage(date.getMonth(), 500, 150),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // David Kim — 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter6.id,
      readingValue: seasonalUsage(date.getMonth(), 410, 130),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // Rachel Torres main meter — 12 months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter7.id,
      readingValue: seasonalUsage(date.getMonth(), 520, 180),
      readingDate: date,
      source: 'SMART_METER',
      idempotencyKey: uuid(),
    });
  }

  // Rachel Torres pool house — 8 months (pool season)
  for (let i = 7; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    readings.push({
      meterId: meter7b.id,
      readingValue: seasonalUsage(date.getMonth(), 150, 80),
      readingDate: date,
      source: 'SMART_METER',
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

  // ─── Billing Cycles + Payments ────────────────────
  // Helper: create billing cycles for an account
  async function createBillingHistory(
    accountId: string,
    monthsBack: number,
    avgKwh: number,
    kwhRange: number,
    opts?: { overdueMonth?: number; skippedPaymentMonth?: number },
  ) {
    for (let i = monthsBack - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i, 0);
      const due = new Date(now.getFullYear(), now.getMonth() - i + 1, 15);
      const kwh = seasonalUsage(start.getMonth(), avgKwh, kwhRange);
      const amount = Math.round((12.50 + kwh * 0.10) * 100) / 100;

      let status: 'PAID' | 'ISSUED' | 'OVERDUE';
      if (i === 0) {
        status = 'ISSUED';
      } else if (opts?.overdueMonth !== undefined && i === opts.overdueMonth) {
        status = 'OVERDUE';
      } else {
        status = 'PAID';
      }

      const cycle = await prisma.billingCycle.create({
        data: {
          accountId,
          startDate: start,
          endDate: end,
          totalKwh: kwh,
          amountDue: amount,
          status,
          dueDate: due,
        },
      });

      // Create payment records for paid bills
      if (status === 'PAID') {
        const methods: Array<'CREDIT_CARD' | 'BANK_TRANSFER' | 'AUTO_PAY'> = ['CREDIT_CARD', 'BANK_TRANSFER', 'AUTO_PAY'];
        await prisma.payment.create({
          data: {
            billingCycleId: cycle.id,
            amount,
            method: methods[Math.floor(Math.random() * methods.length)],
            status: 'COMPLETED',
            idempotencyKey: uuid(),
            paidAt: new Date(due.getTime() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  // Jane Doe — 8 months of billing
  await createBillingHistory(custAccount.id, 8, 450, 150);

  // John Smith — 6 months
  await createBillingHistory(cust2Account.id, 6, 380, 120);

  // Lisa Chen — 10 months, clean history
  await createBillingHistory(cust3Account.id, 10, 320, 100);

  // Marcus Johnson — 8 months, one overdue
  await createBillingHistory(cust4Account.id, 8, 900, 300, { overdueMonth: 2 });

  // Sarah Williams — 4 months (suspended)
  await createBillingHistory(cust5Account.id, 4, 500, 150, { overdueMonth: 1 });

  // David Kim — 6 months
  await createBillingHistory(cust6Account.id, 6, 410, 130);

  // Rachel Torres — 8 months
  await createBillingHistory(cust7Account.id, 8, 520, 180);

  // ─── Notifications ────────────────────────────────

  // Jane Doe
  await prisma.notification.createMany({
    data: [
      {
        accountId: custAccount.id,
        type: 'BILLING',
        title: 'New Bill Available',
        message: 'Your billing statement for this month is now available. Total: $57.42.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        accountId: custAccount.id,
        type: 'USAGE_ALERT',
        title: 'High Usage Detected',
        message: 'Your energy usage this week is 23% higher than your monthly average. Consider checking your HVAC settings.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        accountId: custAccount.id,
        type: 'OUTAGE',
        title: 'Planned Maintenance Nearby',
        message: 'Scheduled maintenance will affect the Downtown Power City area on the 15th from 2 AM to 6 AM.',
        idempotencyKey: uuid(),
        readAt: new Date(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: custAccount.id,
        type: 'GENERAL',
        title: 'Welcome to Electric Grid Energy X',
        message: 'Thank you for choosing EGX as your energy provider. Visit your dashboard to monitor usage.',
        idempotencyKey: uuid(),
        readAt: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // John Smith
  await prisma.notification.createMany({
    data: [
      {
        accountId: cust2Account.id,
        type: 'BILLING',
        title: 'New Bill Available',
        message: 'Your billing statement for this month is now available. Total: $48.15.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        accountId: cust2Account.id,
        type: 'MAINTENANCE',
        title: 'Meter Inspection Scheduled',
        message: 'A routine meter inspection is scheduled for your address next Tuesday between 9 AM and 12 PM.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: cust2Account.id,
        type: 'GENERAL',
        title: 'Welcome to Electric Grid Energy X',
        message: 'Thank you for choosing EGX as your energy provider.',
        idempotencyKey: uuid(),
        readAt: new Date(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Lisa Chen
  await prisma.notification.createMany({
    data: [
      {
        accountId: cust3Account.id,
        type: 'USAGE_ALERT',
        title: 'Monthly Usage Summary',
        message: 'Great news! Your energy usage this month was 12% lower than last month. Keep up the efficient habits!',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        accountId: cust3Account.id,
        type: 'BILLING',
        title: 'Payment Confirmed',
        message: 'Your payment of $44.50 has been processed successfully via Auto-Pay.',
        idempotencyKey: uuid(),
        readAt: new Date(),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Marcus Johnson
  await prisma.notification.createMany({
    data: [
      {
        accountId: cust4Account.id,
        type: 'BILLING',
        title: 'Payment Overdue',
        message: 'Your payment for the billing period ending last month is now overdue. Please make a payment to avoid service interruption.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        accountId: cust4Account.id,
        type: 'USAGE_ALERT',
        title: 'Unusually High Usage',
        message: 'Your energy consumption this month is significantly above average. You may want to check for inefficient appliances.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: cust4Account.id,
        type: 'BILLING',
        title: 'New Bill Available',
        message: 'Your billing statement for this month is now available. Total: $142.80.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Sarah Williams (suspended)
  await prisma.notification.createMany({
    data: [
      {
        accountId: cust5Account.id,
        type: 'GENERAL',
        title: 'Account Suspended',
        message: 'Your account has been suspended due to non-payment. Please contact support to restore service.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: cust5Account.id,
        type: 'BILLING',
        title: 'Final Payment Notice',
        message: 'This is your final notice for overdue payment of $78.25. Service may be interrupted.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // David Kim
  await prisma.notification.createMany({
    data: [
      {
        accountId: cust6Account.id,
        type: 'OUTAGE',
        title: 'Power Restored',
        message: 'Power has been restored to the Willow Way area. Thank you for your patience.',
        idempotencyKey: uuid(),
        readAt: new Date(),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: cust6Account.id,
        type: 'BILLING',
        title: 'New Bill Available',
        message: 'Your billing statement for this month is now available. Total: $53.60.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
    ],
  });

  // Rachel Torres
  await prisma.notification.createMany({
    data: [
      {
        accountId: cust7Account.id,
        type: 'MAINTENANCE',
        title: 'Smart Meter Upgrade Available',
        message: 'A new firmware update is available for your SmartMeter Pro 5000. We will apply it remotely within 48 hours.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        accountId: cust7Account.id,
        type: 'USAGE_ALERT',
        title: 'Pool Pump Usage Spike',
        message: 'Your pool house meter (MTR-007-B) recorded unusually high usage yesterday. You may want to inspect the pool pump.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        accountId: cust7Account.id,
        type: 'BILLING',
        title: 'New Bill Available',
        message: 'Your billing statement for this month is now available. Total: $89.30.',
        idempotencyKey: uuid(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // ─── Outages ──────────────────────────────────────

  // Active: Critical — storm damage
  await prisma.outage.create({
    data: {
      affectedArea: 'North Power City - Industrial District',
      status: 'CONFIRMED',
      severity: 'CRITICAL',
      title: 'Storm Damage — Multiple Lines Down',
      description: 'Severe thunderstorm caused multiple power line failures in the industrial district. Crews have been dispatched and are working to restore service.',
      estimatedResolution: new Date(Date.now() + 8 * 60 * 60 * 1000),
      reportedById: tech.id,
    },
  });

  // Active: Medium — scheduled maintenance
  await prisma.outage.create({
    data: {
      affectedArea: 'Downtown Power City - Blocks 1-5',
      status: 'IN_PROGRESS',
      severity: 'MEDIUM',
      title: 'Scheduled Transformer Upgrade',
      description: 'Planned transformer upgrade affecting downtown area. Power will be intermittent during the maintenance window.',
      estimatedResolution: new Date(Date.now() + 4 * 60 * 60 * 1000),
      reportedById: tech.id,
    },
  });

  // Active: High — substation issue
  await prisma.outage.create({
    data: {
      affectedArea: 'Willow Way & Cedar Court Area',
      status: 'IN_PROGRESS',
      severity: 'HIGH',
      title: 'Substation Equipment Failure',
      description: 'A capacitor bank failure at Substation 7 is causing intermittent outages. Replacement parts are en route.',
      estimatedResolution: new Date(Date.now() + 6 * 60 * 60 * 1000),
      reportedById: tech2.id,
    },
  });

  // Active: Low — reported, not yet confirmed
  await prisma.outage.create({
    data: {
      affectedArea: 'Pine Ridge Boulevard - 800 Block',
      status: 'REPORTED',
      severity: 'LOW',
      title: 'Flickering Lights Reported',
      description: 'Multiple residents on Pine Ridge Blvd have reported intermittent flickering. A technician is being dispatched to investigate.',
      reportedById: tech2.id,
    },
  });

  // Resolved: tree branch
  await prisma.outage.create({
    data: {
      affectedArea: 'Maple Street Area',
      status: 'RESOLVED',
      severity: 'LOW',
      title: 'Brief Power Interruption',
      description: 'Short interruption due to fallen tree branch on power line. Branch removed and line repaired.',
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      reportedById: tech.id,
    },
  });

  // Resolved: vehicle hit pole
  await prisma.outage.create({
    data: {
      affectedArea: 'Oak Avenue - Intersection at 5th Street',
      status: 'RESOLVED',
      severity: 'HIGH',
      title: 'Vehicle Collision with Utility Pole',
      description: 'A vehicle struck a utility pole, damaging the transformer. Emergency crews replaced the transformer and restored power.',
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
      reportedById: tech.id,
    },
  });

  // Resolved: planned maintenance completed
  await prisma.outage.create({
    data: {
      affectedArea: 'Elm Drive - Blocks 300-400',
      status: 'RESOLVED',
      severity: 'MEDIUM',
      title: 'Underground Cable Replacement',
      description: 'Aging underground cables were replaced as part of the infrastructure improvement program. Service was temporarily interrupted during the switch-over.',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 6.75 * 24 * 60 * 60 * 1000),
      reportedById: tech2.id,
    },
  });

  // ─── Audit Logs ───────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'STATUS_CHANGE',
        resource: 'Account',
        resourceId: cust5Account.id,
        traceId: uuid(),
        metadata: { from: 'ACTIVE', to: 'SUSPENDED', reason: 'Non-payment' },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        userId: admin.id,
        action: 'LOGIN',
        resource: 'User',
        resourceId: admin.id,
        traceId: uuid(),
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        userId: tech.id,
        action: 'CREATE',
        resource: 'Outage',
        resourceId: 'storm-outage',
        traceId: uuid(),
        metadata: { severity: 'CRITICAL', area: 'North Power City - Industrial District' },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        userId: tech2.id,
        action: 'CREATE',
        resource: 'Outage',
        resourceId: 'substation-outage',
        traceId: uuid(),
        metadata: { severity: 'HIGH', area: 'Willow Way & Cedar Court Area' },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        userId: customer.id,
        action: 'LOGIN',
        resource: 'User',
        resourceId: customer.id,
        traceId: uuid(),
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  });

  // ─── Summary ──────────────────────────────────────

  console.log('✅ Seed complete!');
  console.log(`   Users:         ${await prisma.user.count()}`);
  console.log(`   Accounts:      ${await prisma.account.count()}`);
  console.log(`   Meters:        ${await prisma.meter.count()}`);
  console.log(`   Readings:      ${await prisma.meterReading.count()}`);
  console.log(`   Bills:         ${await prisma.billingCycle.count()}`);
  console.log(`   Payments:      ${await prisma.payment.count()}`);
  console.log(`   Notifications: ${await prisma.notification.count()}`);
  console.log(`   Outages:       ${await prisma.outage.count()}`);
  console.log(`   Audit Logs:    ${await prisma.auditLog.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
