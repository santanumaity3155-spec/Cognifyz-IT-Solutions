import { z } from 'zod';

/**
 * Zod validation schema for repository listing query parameters.
 */
export const repositoriesQuerySchema = z.object({
  page: z.coerce
    .number()
    .int({ message: 'Page must be an integer' })
    .positive({ message: 'Page must be greater than 0' })
    .default(1),
  per_page: z.coerce
    .number()
    .int({ message: 'per_page must be an integer' })
    .min(1, { message: 'per_page must be at least 1' })
    .max(100, { message: 'per_page cannot exceed 100' })
    .default(30),
  sort: z
    .enum(['updated', 'created', 'pushed', 'full_name'], {
      errorMap: () => ({ message: "sort must be one of: 'updated', 'created', 'pushed', 'full_name'" }),
    })
    .default('updated'),
  direction: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: "direction must be 'asc' or 'desc'" }),
    })
    .default('desc'),
  type: z
    .enum(['all', 'owner', 'public', 'member'], {
      errorMap: () => ({ message: "type must be one of: 'all', 'owner', 'public', 'member'" }),
    })
    .default('owner'),
});

/**
 * Zod validation schema for repository route parameters (:owner/:repo).
 */
export const repoParamsSchema = z.object({
  owner: z
    .string()
    .trim()
    .min(1, { message: 'Repository owner is required' })
    .max(100, { message: 'Owner cannot exceed 100 characters' })
    .regex(/^[a-zA-Z0-9_\-\.]+$/, {
      message: 'Owner contains invalid characters. Only alphanumeric, underscores, hyphens, and periods are allowed.',
    }),
  repo: z
    .string()
    .trim()
    .min(1, { message: 'Repository name is required' })
    .max(100, { message: 'Repository name cannot exceed 100 characters' })
    .regex(/^[a-zA-Z0-9_\-\.]+$/, {
      message: 'Repository name contains invalid characters.',
    }),
});

/**
 * Helper to validate request payload and return structured error response if validation fails.
 * @param {import('zod').ZodSchema} schema
 * @param {unknown} data
 * @returns {{ success: true, data: any } | { success: false, errors: Array<{ field: string, message: string }> }}
 */
export const validateSchema = (schema, data) => {
  const parsed = schema.safeParse(data);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }

  const errors = parsed.error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, errors };
};

export default {
  repositoriesQuerySchema,
  repoParamsSchema,
  validateSchema,
};

