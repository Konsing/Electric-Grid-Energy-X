import { z } from 'zod';

export const createNotificationSchema = z.object({
  type: z.enum(['BILLING', 'OUTAGE', 'USAGE_ALERT', 'MAINTENANCE', 'GENERAL']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  idempotencyKey: z.string().uuid(),
});

export const subscribeSchema = z.object({
  fcmToken: z.string().min(1).max(500),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
