import { CheckCircle2, Eye, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Validation } from '@/data/mockData';

interface ValidationCardProps {
  validations: Validation[];
  delay?: number;
}

export function ValidationCard({ validations, delay = 5 }: ValidationCardProps) {
  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden animate-fade-in",
        `delay-${delay}`
      )}
      style={{ opacity: 0 }}
    >
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2.5">
          <CheckCircle2 size={18} className="text-success" />
          Validaciones Pendientes
        </h3>
        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
          {validations.length} pendientes
        </span>
      </div>

      <div className="p-4 space-y-3">
        {validations.map((v) => (
          <div 
            key={v.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-background"
          >
            {/* Type Badge */}
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase",
              v.type === 'obv' && "bg-gradient-to-br from-primary to-purple-500",
              v.type === 'bp' && "bg-gradient-to-br from-success to-emerald-600",
              v.type === 'lp' && "bg-gradient-to-br from-warning to-amber-600"
            )}>
              {v.type}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{v.titulo}</p>
              <p className="text-xs text-muted-foreground">
                {v.owner} {v.project && `• ${v.project}`} • {v.fecha}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Eye size={16} />
              </button>
              <button className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center text-success hover:bg-success hover:text-success-foreground transition-colors">
                <Check size={16} />
              </button>
              <button className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
