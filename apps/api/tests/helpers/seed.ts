import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const PASSWORD = 'password123';
const PASSWORD_HASH_PROMISE = bcrypt.hash(PASSWORD, 10);

export interface TestFixtures {
  admin: { userId: string; accountId: string; email: string };
  tech: { userId: string; accountId: string; email: string };
  customer: { userId: string; accountId: string; email: string };
  customer2: { userId: string; accountId: string; email: string };
  meter1Id: string;
  meter2Id: string;
}

/**
 * Seed minimal test fixtures.
 * Creates 4 users (admin, tech, customer, customer2), their accounts,
 * 2 meters, and a few readings/billing cycles.
 */
export async function seedTestData(prisma: PrismaClient): Promise<TestFixtures> {
  const passwordHash = await PASSWORD_HASH_PROMISE;

  // ─── Users ──────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@egx.dev',
      firebaseUid: 'mock-uid-admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const tech = await prisma.user.create({
    data: {
      email: 'tech@egx.dev',
      firebaseUid: 'mock-uid-tech',
      passwordHash,
      role: Role.TECHNICIAN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@egx.dev',
      firebaseUid: 'mock-uid-customer',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@egx.dev',
      firebaseUid: 'mock-uid-customer2',
      passwordHash,
      role: Role.CUSTOMER,
    },
  });

  // ─── Accounts ───────────────────────────────────
  const adminAccount = await prisma.account.create({
    data: {
      userId: admin.id,
      accountNumber: 'EGX-ADM-001',
      firstName: 'Admin',
      lastName: 'User',
      serviceAddress: '100 Grid Control Center',
    },
  });

  const techAccount = await prisma.account.create({
    data: {
      userId: tech.id,
      accountNumber: 'EGX-TCH-001',
      firstName: 'Tech',
      lastName: 'Support',
      serviceAddress: '200 Maintenance Way',
    },
  });

  const custAccount = await prisma.account.create({
    data: {
      userId: customer.id,
      accountNumber: 'EGX-CST-001',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '555-0101',
      serviceAddress: '42 Maple Street',
    },
  });

  const cust2Account = await prisma.account.create({
    data: {
      userId: customer2.id,
      accountNumber: 'EGX-CST-002',
      firstName: 'John',
      lastName: 'Smith',
      phone: '555-0102',
      serviceAddress: '88 Oak Avenue',
    },
  });

  // ─── Meters ─────────────────────────────────────
  const meter1 = await prisma.meter.create({
    data: {
      accountId: custAccount.id,
      serialNumber: 'MTR-TEST-001',
      model: 'SmartMeter Pro 3000',
      location: 'Main panel - 42 Maple Street',
    },
  });

  const meter2 = await prisma.meter.create({
    data: {
      accountId: cust2Account.id,
      serialNumber: 'MTR-TEST-002',
      model: 'SmartMeter Pro 3000',
      location: 'Main panel - 88 Oak Avenue',
    },
  });

  // ─── Readings (3 months for customer 1) ─────────
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    await prisma.meterReading.create({
      data: {
        meterId: meter1.id,
        readingValue: 400 + i * 50,
        readingDate: new Date(now.getFullYear(), now.getMonth() - i, 1),
        source: 'SMART_METER',
        idempotencyKey: uuid(),
      },
    });
  }

  // ─── Billing cycle (1 issued for customer 1) ───
  const cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const cycleEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  await prisma.billingCycle.create({
    data: {
      accountId: custAccount.id,
      startDate: cycleStart,
      endDate: cycleEnd,
      totalKwh: 450,
      amountDue: 48.50,
      status: 'ISSUED',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
    },
  });

  // ─── Notifications ─────────────────────────────
  await prisma.notification.create({
    data: {
      accountId: custAccount.id,
      type: 'BILLING',
      title: 'Test Bill Available',
      message: 'Your test bill is ready.',
      idempotencyKey: uuid(),
    },
  });

  return {
    admin: { userId: admin.id, accountId: adminAccount.id, email: admin.email },
    tech: { userId: tech.id, accountId: techAccount.id, email: tech.email },
    customer: { userId: customer.id, accountId: custAccount.id, email: customer.email },
    customer2: { userId: customer2.id, accountId: cust2Account.id, email: customer2.email },
    meter1Id: meter1.id,
    meter2Id: meter2.id,
  };
}
