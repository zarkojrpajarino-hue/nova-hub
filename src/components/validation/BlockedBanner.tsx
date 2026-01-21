import { AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useIsBlocked, useMyPendingValidations } from '@/hooks/useValidationSystem';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface BlockedBannerProps {
  onNavigateToValidations?: () => void;
}

export function BlockedBanner({ onNavigateToValidations }: BlockedBannerProps) {
  const { data: isBlocked } = useIsBlocked();
  const { data: pendingValidations } = useMyPendingValidations();

  if (!isBlocked) return null;

  const overdueCount = pendingValidations?.filter(pv => 
    new Date(pv.deadline) < new Date()
  ).length || 0;

  return (
    <Alert variant="destructive" className="mb-4 border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">
        ⚠️ Estás bloqueado
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          No puedes subir KPIs ni OBVs hasta que valides tus pendientes.
          Tienes <strong>{overdueCount} validación(es) vencida(s)</strong>.
        </p>
        
        {pendingValidations && pendingValidations.length > 0 && (
          <div className="space-y-2 mb-3">
            {pendingValidations.slice(0, 3).map(pv => {
              const isOverdue = new Date(pv.deadline) < new Date();
              return (
                <div 
                  key={pv.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${isOverdue ? 'bg-destructive/20' : 'bg-muted'}`}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: pv.owner_color || '#6366F1' }}
                    >
                      {pv.owner_nombre?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm font-medium">{pv.titulo || 'Sin título'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock size={12} />
                    {isOverdue ? (
                      <span className="text-destructive font-bold">
                        Vencido hace {formatDistanceToNow(new Date(pv.deadline), { locale: es })}
                      </span>
                    ) : (
                      <span>
                        Vence {formatDistanceToNow(new Date(pv.deadline), { locale: es, addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {onNavigateToValidations && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onNavigateToValidations}
            className="mt-2"
          >
            Ir a validar ahora
            <ArrowRight size={14} className="ml-2" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
