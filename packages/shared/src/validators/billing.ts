import { z } from 'zod';

export const payBillSchema = z.object({
  method: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'AUTO_PAY']),
  idempotencyKey: z.string().uuid(),
});

export const generateCycleSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateBillingStatusSchema = z.object({
  status: z.enum(['PENDING', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED']),
});

export type PayBillInput = z.infer<typeof payBillSchema>;
export type GenerateCycleInput = z.infer<typeof generateCycleSchema>;
export type UpdateBillingStatusInput = z.infer<typeof updateBillingStatusSchema>;
