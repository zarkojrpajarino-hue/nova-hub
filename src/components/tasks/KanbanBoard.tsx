/**
 * Kanban Board - Refactored into modular components
 *
 * This file now serves as a thin wrapper around the new modular architecture:
 * - KanbanBoardContainer: Main orchestrator (handles dialogs, drag-drop)
 * - useTaskKanban: Custom hook with all business logic (state, actions, queries)
 * - KanbanColumn: Column component with droppable area
 * - TaskCard: Memoized task card component for performance
 *
 * Original file: 506 lines → Refactored to 3 components + custom hook
 */

import { KanbanBoardContainer } from './kanban/KanbanBoardContainer';

interface KanbanBoardProps {
  projectId: string;
  projectMembers: Array<{ id: string; nombre: string; color: string }>;
}

export function KanbanBoard(props: KanbanBoardProps) {
  return <KanbanBoardContainer {...props} />;
}
