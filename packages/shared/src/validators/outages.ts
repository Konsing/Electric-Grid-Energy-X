import { z } from 'zod';

export const createOutageSchema = z.object({
  affectedArea: z.string().min(1).max(500),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  estimatedResolution: z.string().datetime().optional(),
});

export const updateOutageSchema = z.object({
  affectedArea: z.string().min(1).max(500).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  status: z.enum(['REPORTED', 'CONFIRMED', 'IN_PROGRESS', 'RESOLVED']).optional(),
  estimatedResolution: z.string().datetime().nullable().optional(),
});

export type CreateOutageInput = z.infer<typeof createOutageSchema>;
export type UpdateOutageInput = z.infer<typeof updateOutageSchema>;
