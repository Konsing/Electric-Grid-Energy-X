import { z } from 'zod';

export const createMeterSchema = z.object({
  serialNumber: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  location: z.string().min(1).max(500),
});

export const updateMeterSchema = z.object({
  location: z.string().min(1).max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
});

export type CreateMeterInput = z.infer<typeof createMeterSchema>;
export type UpdateMeterInput = z.infer<typeof updateMeterSchema>;
