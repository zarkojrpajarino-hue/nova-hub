/**
 * invalidation-helpers — V5.5.7
 *
 * Centralized invalidation functions that invalidate all related queries at once.
 * Prevents scattered invalidation logic across mutations.
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Invalidate all project-related queries for a given project.
 * Use after mutations that affect project data (OBVs, tasks, members, engine).
 */
export function invalidateProjectData(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.complete(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.withStats(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.context(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.engine.all(projectId) });
}

/**
 * Invalidate all OBV-related queries for a given project.
 * Use after OBV create/update/delete/validate.
 */
export function invalidateOBVData(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.obvs.byProject(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.obvs.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.engine.all(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(projectId) });
}

/**
 * Invalidate all team member queries for a given project.
 * Use after member add/remove/role change.
 */
export function invalidateTeamData(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.members.byProject(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.members.stats });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.complete(projectId) });
}

/**
 * Invalidate all task-related queries for a given project.
 * Use after task create/update/complete/delete.
 */
export function invalidateTaskData(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.engine.all(projectId) });
}

/**
 * Invalidate all financial queries for a given project.
 * Use after financial data changes.
 */
export function invalidateFinancialData(queryClient: QueryClient, projectId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.financial.mrrForecast(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.financial.stressTest(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.financial.risks(projectId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.financial.metricsSecure });
}

/**
 * Invalidate all validation-related queries.
 * Use after a validation vote or status change.
 */
export function invalidateValidationData(queryClient: QueryClient, profileId: string) {
  queryClient.invalidateQueries({ queryKey: queryKeys.validations.pending(profileId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.validations.dashboard });
  queryClient.invalidateQueries({ queryKey: queryKeys.validations.forValidation });
  queryClient.invalidateQueries({ queryKey: queryKeys.validations.stats(profileId) });
}
