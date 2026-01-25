import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

/**
 * Shared Zod validation schemas for edge functions
 * Provides type-safe input validation with clear error messages
 */

// Valid roles for the system
const VALID_ROLES = ['sales', 'finance', 'ai_tech', 'marketing', 'operations', 'strategy', 'leader', 'customer'] as const;

/**
 * Playbook generation request schema
 */
export const PlaybookRequestSchema = z.object({
  userId: z.string().uuid('Invalid user ID format').describe('User UUID'),
  roleName: z.enum(VALID_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
  }).transform(val => val.toLowerCase()),
});

/**
 * Project roles generation request schema
 */
export const ProjectRolesRequestSchema = z.object({
  project_id: z.string().uuid('Invalid project ID format'),
  onboarding_data: z.any().optional(), // Flexible schema for onboarding data
});

/**
 * Role questions generation request schema
 */
export const RoleQuestionsRequestSchema = z.object({
  role: z.any(), // Flexible schema for role context object
});

/**
 * Role questions generation V2 request schema
 */
export const RoleQuestionsV2RequestSchema = z.object({
  role: z.string().min(1, 'Role is required').max(50, 'Role name too long'),
  meetingType: z.string().max(50).optional().default('semanal'),
  duracionMinutos: z.number().int().min(15, 'Duration must be at least 15 minutes').max(180, 'Duration cannot exceed 180 minutes').optional().default(30),
});

/**
 * Task completion questions request schema
 */
export const TaskCompletionQuestionsRequestSchema = z.object({
  task: z.any(), // Flexible schema for task context object
});

/**
 * Tasks generation request schema (v2)
 */
export const TasksGenerationRequestSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
});

/**
 * Seed projects request schema
 */
export const SeedProjectsRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID format').optional(),
  count: z.number().int().min(1).max(10, 'Cannot seed more than 10 projects at once').optional().default(3),
});

/**
 * Seed users request schema
 */
export const SeedUsersRequestSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID format').optional(),
  count: z.number().int().min(1).max(20, 'Cannot seed more than 20 users at once').optional().default(5),
  roles: z.array(z.enum(VALID_ROLES)).optional(),
});

/**
 * Generic validation helper
 * Returns validated data or throws with user-friendly error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

/**
 * Async validation helper for use in edge functions
 * Returns { success: true, data } or { success: false, error }
 */
export async function validateRequestSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: `Validation failed: ${messages}` };
    }
    return { success: false, error: 'Validation error' };
  }
}
