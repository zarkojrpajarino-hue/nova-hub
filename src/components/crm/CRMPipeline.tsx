/**
 * CRM Pipeline - Refactored into modular components
 *
 * This file now serves as a thin wrapper around the new modular architecture:
 * - CRMPipelineContainer: Main orchestrator (handles view mode, search, header)
 * - useCRMPipeline: Custom hook with all business logic (filtering, drag-drop, state)
 * - KanbanView: Kanban board view with drag-and-drop
 * - ListView: Simple list view with status badges
 * - TableView: Table view with sortable columns
 *
 * Original file: 593 lines → Refactored to 4 components + custom hook
 */

import { CRMPipelineContainer } from './pipeline/CRMPipelineContainer';
import type { Lead, ViewMode } from '@/hooks/useCRMPipeline';

interface CRMPipelineProps {
  projectId?: string;
  leads: Lead[];
  projects: Array<{ id: string; nombre: string; icon: string; color: string }>;
  members: Array<{ id: string; nombre: string; color: string }>;
  isLoading: boolean;
  defaultView?: ViewMode;
}

export function CRMPipeline(props: CRMPipelineProps) {
  return <CRMPipelineContainer {...props} />;
}
