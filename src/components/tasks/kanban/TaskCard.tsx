import { memo } from 'react';
import { Circle, CheckCircle2, Calendar, Sparkles, BookOpen, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/hooks/useTaskKanban';
import type { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from '@hello-pangea/dnd';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#EF4444', // Alta
  2: '#F59E0B', // Media
  3: '#22C55E', // Baja
};

interface Member {
  id: string;
  nombre: string;
  color: string;
}

interface TaskCardProps {
  task: Task;
  index: number;
  assignee: Member | undefined;
  isDragging: boolean;
  canDelete: boolean;
  hasPlaybook: boolean;
  onCompleteClick: (task: Task) => void;
  onPlaybookClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  draggableProps: DraggableProvidedDraggableProps;
  innerRef: (element: HTMLElement | null) => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  assignee,
  isDragging,
  canDelete,
  hasPlaybook,
  onCompleteClick,
  onPlaybookClick,
  onDeleteClick,
  dragHandleProps,
  draggableProps,
  innerRef,
}: TaskCardProps) {
  const isOverdue = task.fecha_limite &&
    new Date(task.fecha_limite) < new Date() &&
    task.status !== 'done';

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...dragHandleProps}
      className={cn(
        "bg-card border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg ring-2 ring-primary",
        task.status === 'done' && "opacity-60"
      )}
    >
      {/* Priority & AI badge */}
      <div className="flex items-center gap-2 mb-2">
        {task.prioridad && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: PRIORITY_COLORS[task.prioridad] }}
            title={`Prioridad ${task.prioridad === 1 ? 'Alta' : task.prioridad === 2 ? 'Media' : 'Baja'}`}
          />
        )}
        {task.ai_generated && (
          <div className="flex items-center gap-1 text-xs text-purple-500">
            <Sparkles size={10} />
            IA
          </div>
        )}
      </div>

      {/* Checkbox + Title */}
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={() => onCompleteClick(task)}
          className="mt-0.5 shrink-0"
        >
          {task.status === 'done' ? (
            <CheckCircle2 size={18} className="text-success" />
          ) : (
            <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
          )}
        </button>
        <p className={cn(
          "font-medium text-sm",
          task.status === 'done' && "line-through text-muted-foreground"
        )}>
          {task.titulo}
        </p>
      </div>

      {task.descripcion && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 pl-6">
          {task.descripcion}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pl-6">
        <div className="flex items-center gap-2">
          {task.fecha_limite && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue ? "text-destructive" : "text-muted-foreground"
            )}>
              <Calendar size={10} />
              {new Date(task.fecha_limite).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </div>
          )}

          {/* Playbook button */}
          {hasPlaybook && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlaybookClick(task);
              }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              title="Ver Playbook"
            >
              <BookOpen size={12} />
              <span>Playbook</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(task);
              }}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 size={14} />
            </button>
          )}
          {assignee && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: assignee.color }}
              title={assignee.nombre}
            >
              {assignee.nombre.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
