import { z } from 'zod';

export const createManualTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().min(0.1).max(999).optional(),
  dueDate: z.iso.datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().min(0.1).max(999).optional(),
  dueDate: z.iso.datetime().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'REVIEW', 'APPROVED', 'FAILED', 'DONE']),
});

export const assignTaskSchema = z.object({
  assignedToId: z.number(),
});

export const bulkAssignSchema = z.object({
  taskIds: z.array(z.number()).min(1),
  assignedToId: z.number(),
});

export const bulkStatusSchema = z.object({
  taskIds: z.array(z.number()).min(1),
  status: z.enum(['IN_PROGRESS', 'REVIEW', 'APPROVED', 'FAILED', 'DONE']),
});

export const bulkDeleteSchema = z.object({
  taskIds: z.array(z.number()).min(1),
});

export const reviewApprovalSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().max(1000).optional(),
});
