import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OsWindowProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: 'default' | 'compact';
  toolbar?: React.ReactNode;
}

export function OsWindow({
  title,
  icon: Icon,
  children,
  className,
  contentClassName,
  variant = 'default',
  toolbar,
}: OsWindowProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden shadow-lg',
        className
      )}
    >
      {/* Title bar — hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border-b border-border select-none">
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70 border border-red-600/30" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70 border border-yellow-600/30" />
          <span className="w-3 h-3 rounded-full bg-green-500/70 border border-green-600/30" />
        </div>
        {/* Title centered */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-xs font-medium text-muted-foreground truncate">
            {title}
          </span>
        </div>
        {/* Spacer for symmetry */}
        <div className="w-[52px]" />
      </div>

      {/* Optional toolbar */}
      {toolbar && (
        <div className="hidden md:flex px-4 py-2 bg-secondary/30 border-b border-border items-center gap-2">
          {toolbar}
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          variant === 'compact' ? 'p-3 md:p-4' : 'p-4 md:p-6',
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
