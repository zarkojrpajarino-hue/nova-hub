import { memo } from 'react';
import { Circle, CheckCircle2, Calendar, Sparkles, BookOpen, Trash2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task } from '@/hooks/useTaskKanban';
import type { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from '@hello-pangea/dnd';

import { useTranslation } from 'react-i18next';
const PRIORITY_COLORS: Record<number, string> = {
  1: '#EF4444', // Alta
  2: '#F59E0B', // Media
  3: '#22C55E', // Baja
};

const FUNCTION_TYPE_LABELS: Record<string, { labelKey: string; color: string }> = {
  demand:   { labelKey: 'tasks.demanda',  color: '#F59E0B' },
  delivery: { labelKey: 'tasks.delivery', color: '#3B82F6' },
  cash:     { labelKey: 'tasks.cash',     color: '#22C55E' },
  support:  { labelKey: 'tasks.soporte',  color: '#A855F7' },
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
  leader: Member | undefined;
  isDragging: boolean;
  canDelete: boolean;
  hasPlaybook: boolean;
  onCompleteClick: (task: Task) => void;
  onPlaybookClick: (task: Task) => void;
  onDeleteClick: (task: Task) => void;
  dragHandleProps: DraggableProvidedDragHandleProps | null;
  draggableProps: DraggableProvidedDraggableProps;
  innerRef: (element: HTMLElement | null) => void;
  isHighRelevance?: boolean  // F19.B.5: punto de color si relevance=3 para la fase
}

export const TaskCard = memo(function TaskCard({
  task,
  assignee,
  leader,
  isDragging,
  canDelete,
  hasPlaybook,
  onCompleteClick,
  onPlaybookClick,
  onDeleteClick,
  dragHandleProps,
  draggableProps,
  innerRef,
  isHighRelevance = false,
}: TaskCardProps) {
  const { t } = useTranslation();
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
            title={`Prioridad ${task.prioridad === 1 ? Alta : task.prioridad === 2 ? Media : t('tasks.baja')}`}
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
          "font-medium text-sm flex items-center gap-1.5",
          task.status === 'done' && "line-through text-muted-foreground"
        )}>
          {/* F19.B.5 — punto de color para tareas de alta relevancia en la fase actual */}
          {isHighRelevance && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" title={t('tasks.altaRelevanciaParaTu')} />
          )}
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
          {task.function_type && FUNCTION_TYPE_LABELS[task.function_type] && (
            <div
              className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: FUNCTION_TYPE_LABELS[task.function_type].color + '20',
                color: FUNCTION_TYPE_LABELS[task.function_type].color,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: FUNCTION_TYPE_LABELS[task.function_type].color }}
              />
              {t(FUNCTION_TYPE_LABELS[task.function_type].labelKey)}
            </div>
          )}
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
              title={t('tasks.verPlaybook')}
            >
              <BookOpen size={12} />
              <span>{t('tasks.playbook')}</span>
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
              title={t('tasks.eliminarTarea')}
            >
              <Trash2 size={14} />
            </button>
          )}
          {/* Leader avatar — only shown when leader exists and differs from assignee.
              NULL leader_id = "sin dato", not "founder-led" (E4.5 rule). */}
          {leader && leader.id !== task.assignee_id && (
            <div className="relative" title={`Responsable: ${leader.nombre}`}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background"
                style={{ backgroundColor: leader.color, opacity: 0.85 }}
              >
                {leader.nombre.charAt(0)}
              </div>
              <Shield
                size={8}
                className="absolute -bottom-0.5 -right-0.5 text-amber-500 bg-background rounded-full"
              />
            </div>
          )}
          {assignee && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: assignee.color }}
              title={`Ejecutor: ${assignee.nombre}`}
            >
              {assignee.nombre.charAt(0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
