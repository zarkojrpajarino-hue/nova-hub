/**
 * EMPTY STATE COMPONENT — F.1
 *
 * Estado vacio profesional con icono, titulo, descripcion, CTAs y sugerencias.
 * Clean, minimal, Lucide icons only.
 */

import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  suggestions?: string[];
  className?: string;
  variant?: 'default' | 'card';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  suggestions,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const { t } = useTranslation();

  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>

      {action && (
        <div className="flex items-center gap-3 mb-6">
          <Button onClick={action.onClick} variant={action.variant || 'default'} size="lg">
            {action.label}
          </Button>
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="w-full max-w-sm space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('emptyState.suggestions')}
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((suggestion, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 text-left"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={cn('border-dashed border-2', className)}>
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}
