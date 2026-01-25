import { memo } from 'react';
import { Circle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { TaskCard } from './TaskCard';
import type { Task } from '@/hooks/useTaskKanban';

const COLUMN_ICONS = {
  todo: Circle,
  doing: Clock,
  done: CheckCircle2,
  blocked: AlertCircle,
} as const;

interface Column {
  id: string;
  label: string;
  icon: string;
  color: string;
}

interface Member {
  id: string;
  nombre: string;
  color: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  getAssignee: (id: string | null) => Member | undefined;
  canDeleteTask: (task: Task) => boolean;
  hasPlaybook: (task: Task) => boolean;
  onCompleteClick: (task: Task) => void;
  onPlaybookClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
}

export const KanbanColumn = memo(function KanbanColumn({
  column,
  tasks,
  getAssignee,
  canDeleteTask,
  hasPlaybook,
  onCompleteClick,
  onPlaybookClick,
  onDeleteClick,
}: KanbanColumnProps) {
  const IconComponent = COLUMN_ICONS[column.id as keyof typeof COLUMN_ICONS] || Circle;

  return (
    <div>
      {/* Column Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-xl mb-3"
        style={{
          background: 'hsl(var(--muted))',
          borderTop: `3px solid ${column.color}`
        }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <IconComponent size={16} style={{ color: column.color }} />
          {column.label}
        </div>
        <span className="w-6 h-6 rounded-lg bg-background flex items-center justify-center text-xs font-semibold">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "space-y-3 min-h-[300px] p-2 rounded-xl transition-colors",
              snapshot.isDraggingOver && "bg-primary/5 ring-2 ring-primary/20"
            )}
          >
            {tasks.map((task, index) => {
              const assignee = getAssignee(task.assignee_id);

              return (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <TaskCard
                      task={task}
                      index={index}
                      assignee={assignee}
                      isDragging={snapshot.isDragging}
                      canDelete={canDeleteTask(task)}
                      hasPlaybook={hasPlaybook(task)}
                      onCompleteClick={onCompleteClick}
                      onPlaybookClick={onPlaybookClick}
                      onDeleteClick={onDeleteClick}
                      dragHandleProps={provided.dragHandleProps}
                      draggableProps={provided.draggableProps}
                      innerRef={provided.innerRef}
                    />
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}

            {tasks.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                Sin tareas
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
});
