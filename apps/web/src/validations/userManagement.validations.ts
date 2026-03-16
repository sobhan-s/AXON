import {z} from "zod"

export const createSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore'),
  roleId: z.number('Select a role'),
});

export const updateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscore')
    .optional(),
  isActive: z.boolean().optional(),
  roleId: z.number().optional(),
});

export type CreateValues = z.infer<typeof createSchema>;
export type UpdateValues = z.infer<typeof updateSchema>;