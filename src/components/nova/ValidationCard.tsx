import { CheckCircle2, Check, X, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';
import { cn } from '@/lib/utils';
import { usePendingValidations, useValidate, PendingValidation } from '@/hooks/usePendingValidations';
import { useNavigation } from '@/contexts/NavigationContext';

import { useTranslation } from 'react-i18next';
interface ValidationCardProps {
  limit?: number;
  delay?: number;
}

const getTypeLabel = (type: string, subtype?: string) => {
  if (type === 'obv' && subtype) {
    const labels: Record<string, string> = {
      exploracion: '🔍',
      validacion: '✅',
      venta: '💰',
    };
    return labels[subtype] || 'OBV';
  }
  const labels: Record<string, string> = {
    obv: 'OBV',
    lp: '📚 LP',
    bp: '📖 BP',
    cp: '👥 CP',
  };
  return labels[type] || type.toUpperCase();
};

export function ValidationCard({ limit = 3, delay = 5 }: ValidationCardProps) {
  const { data: validations = [], isLoading } = usePendingValidations(limit);
  const validateMutation = useValidate();
  const { navigate } = useNavigation();

  const handleValidate = (item: PendingValidation, approved: boolean) => {
    validateMutation.mutate({ item, approved });
  };

  const handleViewAll = () => {
    navigate('obvs');
  };

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
          <CheckCircle2 size={18} className="text-success" />{t('nova.validacionesPendientes')}</h3>
        {validations.length > 0 ? (
          <span className="text-xs font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-lg">
            {validations.length}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
            0 pendientes
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : validations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('nova.todoValidado')}</p>
            <p className="text-xs mt-1">{t('nova.noTienesElementosPendientes')}</p>
          </div>
        ) : (
          validations.map((v) => (
            <div 
              key={`${v.type}-${v.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-background"
            >
              {/* Type Badge */}
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs text-white",
                v.type === 'obv' && "bg-gradient-to-br from-primary to-purple-500",
                v.type === 'bp' && "bg-gradient-to-br from-success to-emerald-600",
                v.type === 'lp' && "bg-gradient-to-br from-warning to-amber-600",
                v.type === 'cp' && "bg-gradient-to-br from-pink-500 to-rose-600"
              )}>
                <span className="text-lg">{getTypeLabel(v.type, v.subtype)}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{v.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {v.owner_nombre}
                  {v.project_nombre && ` • ${v.project_nombre}`}
                  {' • '}
                  {v.created_at && formatDistanceToNow(new Date(v.created_at), {
                    addSuffix: true,
                    locale: getDateFnsLocale(),
                  })}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    v.validation_count === 0 && "bg-muted text-muted-foreground",
                    v.validation_count === 1 && "bg-warning/20 text-warning"
                  )}>
                    {v.validation_count}/2 validaciones
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => handleValidate(v, true)}
                  disabled={validateMutation.isPending}
                  className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center text-success hover:bg-success hover:text-success-foreground transition-colors disabled:opacity-50"
                  title={t('nova.aprobar')}
                >
                  <Check size={16} />
                </button>
                <button 
                  onClick={() => handleValidate(v, false)}
                  disabled={validateMutation.isPending}
                  className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                  title={t('nova.rechazar')}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {validations.length > 0 && (
        <div className="border-t border-border p-3">
          <button 
            onClick={handleViewAll}
            className="w-full text-center text-sm text-primary hover:underline"
          >{t('nova.verTodasLasValidaciones')}</button>
        </div>
      )}
    </div>
  );
}
