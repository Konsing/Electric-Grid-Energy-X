import { z } from 'zod';

export const updateAccountSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(20).nullable().optional(),
  serviceAddress: z.string().min(5).max(500).optional(),
  fcmToken: z.string().max(500).nullable().optional(),
});

export const updateAccountStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>;
