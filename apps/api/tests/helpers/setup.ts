import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/index';
import { Express } from 'express';

// Use test database
process.env.NODE_ENV = 'test';
process.env.MOCK_AUTH = 'true';
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long!!';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

const prisma = new PrismaClient();
let app: Express;

export function getApp(): Express {
  if (!app) {
    app = createApp();
  }
  return app;
}

export function getPrisma(): PrismaClient {
  return prisma;
}

/**
 * Truncate all tables in dependency-safe order.
 * Called between tests for isolation.
 */
export async function cleanDatabase(): Promise<void> {
  const tablenames = [
    'AuditLog',
    'Payment',
    'BillingCycle',
    'Notification',
    'Outage',
    'MeterReading',
    'Meter',
    'Account',
    'User',
  ];

  for (const table of tablenames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

/**
 * Connect to DB and run migrations before all tests.
 */
export async function setupDatabase(): Promise<void> {
  await prisma.$connect();
}

/**
 * Disconnect after all tests.
 */
export async function teardownDatabase(): Promise<void> {
  await prisma.$disconnect();
}
