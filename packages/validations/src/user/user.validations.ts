import { z } from 'zod';

export const passwordVerifySchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
});

export const addUserToOrg = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers and underscore',
    ),
  roleId: z.number(),
});

export const updateUserAdminLevelSchema = z.object({
  email: z.email('Invalid email').optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers and underscore',
    )
    .optional(),
  isActive: z.boolean().optional(),
  roleId: z.number().optional(),
});
