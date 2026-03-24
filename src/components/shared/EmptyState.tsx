/**
 * EmptyState — Componente genérico reutilizable para estados vacíos.
 * Muestra icono, título, descripción, CTA principal, y progreso opcional.
 */

import { type LucideIcon, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline';
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  progress?: { current: number; total: number; label?: string };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, progress, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">{description}</p>

      {progress && (
        <div className="w-full max-w-xs mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{progress.label ?? `${progress.current}/${progress.total}`}</span>
            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {action && (
          <Button onClick={action.onClick} variant={action.variant ?? 'default'} className="gap-2">
            {action.label}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {secondaryAction && (
          <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant ?? 'outline'}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
