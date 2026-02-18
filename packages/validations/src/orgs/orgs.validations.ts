import { z } from 'zod';

const createOrgsSchemas = z.object({
  name: z.string(),
  description: z.string(),
  slug: z.string(),
});

export { createOrgsSchemas };
