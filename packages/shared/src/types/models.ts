import { Role } from './roles';

// Enums matching Prisma schema
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type MeterStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type ReadingSource = 'MANUAL' | 'SMART_METER' | 'ESTIMATED';
export type BillingStatus = 'PENDING' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'AUTO_PAY';
export type NotificationType = 'BILLING' | 'OUTAGE' | 'USAGE_ALERT' | 'MAINTENANCE' | 'GENERAL';
export type OutageStatus = 'REPORTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'RESOLVED';
export type OutageSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT';

// Model types
export interface User {
  id: string;
  email: string;
  firebaseUid: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  serviceAddress: string;
  status: AccountStatus;
  fcmToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meter {
  id: string;
  accountId: string;
  serialNumber: string;
  model: string;
  location: string;
  status: MeterStatus;
  installedAt: Date;
  lastReadingAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeterReading {
  id: string;
  meterId: string;
  readingValue: number;
  readingDate: Date;
  source: ReadingSource;
  idempotencyKey: string;
  createdAt: Date;
}

export interface BillingCycle {
  id: string;
  accountId: string;
  startDate: Date;
  endDate: Date;
  totalKwh: number;
  amountDue: number;
  status: BillingStatus;
  dueDate: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  billingCycleId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  idempotencyKey: string;
  attempts: number;
  lastError: string | null;
  nextRetryAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  idempotencyKey: string;
  readAt: Date | null;
  createdAt: Date;
}

export interface Outage {
  id: string;
  affectedArea: string;
  status: OutageStatus;
  severity: OutageSeverity;
  title: string;
  description: string;
  estimatedResolution: Date | null;
  startedAt: Date;
  resolvedAt: Date | null;
  reportedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: AuditAction;
  resource: string;
  resourceId: string;
  traceId: string;
  spanId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
