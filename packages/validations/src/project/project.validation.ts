import { z } from 'zod';

export const createProjectsSchemas = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters'),

  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug can only contain lowercase letters, numbers, and hyphens',
    ),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
});

export const assignManagerSchema = z.object({
  mangerEmail: z.email('Invalid email address'),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Project name must be at least 3 characters')
    .max(100, 'Project name must be less than 100 characters')
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  storageLimit: z.string().optional(),
});

export const ProjectStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']),
});
