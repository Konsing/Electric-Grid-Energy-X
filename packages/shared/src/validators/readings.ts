import { z } from 'zod';

export const submitReadingSchema = z.object({
  readingValue: z.number().min(0),
  readingDate: z.string().datetime(),
  source: z.enum(['MANUAL', 'SMART_METER', 'ESTIMATED']).default('MANUAL'),
  idempotencyKey: z.string().uuid(),
});

export type SubmitReadingInput = z.infer<typeof submitReadingSchema>;
