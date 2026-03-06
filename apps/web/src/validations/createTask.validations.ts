import {z} from "zod";

export const createSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number('Must be a number').min(0.1).max(999),
});
export type CreateValues = z.infer<typeof createSchema>;

