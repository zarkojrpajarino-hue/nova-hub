import { Users, ArrowUp, ArrowDown, Shield, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useValidationOrder, useMyValidators, useValidatorStats } from '@/hooks/useValidationSystem';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

export function ValidationOrderCard() {
  const { profile } = useAuth();
  const { data: order, isLoading: loadingOrder } = useValidationOrder();
  const { data: myValidators, isLoading: loadingValidators } = useMyValidators(profile?.id);
  const { data: myStats } = useValidatorStats(profile?.id);

  if (loadingOrder || loadingValidators) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <Skeleton className="h-5 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const myPosition = order?.find(o => o.user_id === profile?.id)?.position;
  const totalUsers = order?.length || 0;

  // Get people I validate (3 below me)
  const getValidatees = () => {
    if (!myPosition || totalUsers < 4) return [];
    
    const positions = [
      myPosition + 1 > totalUsers ? (myPosition + 1) - totalUsers : myPosition + 1,
      myPosition + 2 > totalUsers ? (myPosition + 2) - totalUsers : myPosition + 2,
      myPosition + 3 > totalUsers ? (myPosition + 3) - totalUsers : myPosition + 3,
    ];
    
    return order?.filter(o => positions.includes(o.position)) || [];
  };

  const validatees = getValidatees();
  const onTimeRate = myStats && myStats.total_validations > 0
    ? Math.round((myStats.on_time_validations / myStats.total_validations) * 100)
    : 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            Sistema de Validación
          </span>
          {myStats?.is_blocked && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle size={12} className="mr-1" />
              BLOQUEADO
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My position */}
        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Tu posición este mes</p>
          <p className="text-2xl font-bold text-primary">#{myPosition || '-'}</p>
        </div>

        {/* My validators (people above me) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowUp size={14} className="text-green-500" />
            <p className="text-sm font-medium">Te validan</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {myValidators?.map((validator) => (
              <TooltipProvider key={validator.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: validator.color }}
                    >
                      {validator.nombre.charAt(0)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{validator.nombre}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {(!myValidators || myValidators.length === 0) && (
              <p className="text-sm text-muted-foreground">Sin validadores asignados</p>
            )}
          </div>
        </div>

        {/* People I validate (below me) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ArrowDown size={14} className="text-blue-500" />
            <p className="text-sm font-medium">Validas a</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {validatees.map((person) => (
              <TooltipProvider key={person.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: person.profile?.color || '#6366F1' }}
                    >
                      {person.profile?.nombre.charAt(0) || '?'}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{person.profile?.nombre}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* Stats */}
        {myStats && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasa a tiempo</span>
              <span className={`font-bold ${onTimeRate >= 80 ? 'text-success' : onTimeRate >= 50 ? 'text-warning' : 'text-destructive'}`}>
                {onTimeRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Total validaciones</span>
              <span className="font-medium">{myStats.total_validations}</span>
            </div>
            {myStats.missed_validations > 0 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock size={12} className="text-destructive" />
                  Perdidas
                </span>
                <span className="font-medium text-destructive">{myStats.missed_validations}</span>
              </div>
            )}
          </div>
        )}

        {/* Order list */}
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Orden de validación ({new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {order?.map((o) => (
              <div 
                key={o.id}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${o.user_id === profile?.id ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
              >
                <span className="w-5 text-muted-foreground">{o.position}.</span>
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: o.profile?.color || '#6366F1' }}
                >
                  {o.profile?.nombre.charAt(0) || '?'}
                </div>
                <span className={o.user_id === profile?.id ? 'font-semibold' : ''}>
                  {o.profile?.nombre || 'Usuario'}
                </span>
                {o.user_id === profile?.id && (
                  <Badge variant="outline" className="ml-auto text-xs">Tú</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
