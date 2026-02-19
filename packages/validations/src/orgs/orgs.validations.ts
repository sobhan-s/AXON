import { z } from 'zod';

export const createOrgsSchemas = z.object({
  name: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(100, 'Organization name must be less than 100 characters'),

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

export const assignAdminSchema = z.object({
  adminEmail: z.email('Invalid email address'),
});

export const updateOrgsSchema = z.object({
  name: z
    .string()
    .min(3, 'Organization name must be at least 3 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),

  storageLimit: z
    .number()
    .positive('Storage limit must be positive')
    .optional(),
});
