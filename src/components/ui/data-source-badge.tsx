/**
 * DATA SOURCE BADGE
 *
 * Badge que muestra de dónde vienen los datos (conexión entre secciones)
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, Sparkles, Users, Target, Package, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const sourceIcons = {
  proyecto: Sparkles,
  validaciones: Target,
  obvs: Target,
  crm: Users,
  productos: Package,
  analytics: TrendingUp,
  ai: Sparkles,
};

interface DataSourceBadgeProps {
  source: keyof typeof sourceIcons;
  label?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'default';
}

export function DataSourceBadge({
  source,
  label,
  description,
  className,
  size = 'default',
}: DataSourceBadgeProps) {
  const Icon = sourceIcons[source] || Database;
  const displayLabel = label || source.charAt(0).toUpperCase() + source.slice(1);

  if (description) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn(
                'gap-1.5 cursor-help',
                size === 'sm' && 'text-xs py-0.5',
                className
              )}
            >
              <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
              {displayLabel}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={cn('gap-1.5', size === 'sm' && 'text-xs py-0.5', className)}
    >
      <Icon className={cn('h-3 w-3', size === 'sm' && 'h-2.5 w-2.5')} />
      {displayLabel}
    </Badge>
  );
}
