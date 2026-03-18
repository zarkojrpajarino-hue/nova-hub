import type { LucideIcon } from 'lucide-react';
import { Activity } from 'lucide-react';

interface EngineEmptyStateProps {
  title: string;
  description: string;
  cta?: { label: string; onClick: () => void };
  icon?: LucideIcon;
}

export function EngineEmptyState({ title, description, cta, icon: Icon = Activity }: EngineEmptyStateProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center text-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {cta && (
        <button
          onClick={cta.onClick}
          className="text-xs font-medium text-primary hover:underline"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
