import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { RoleRotationRequest } from '@/hooks/useRoleRotation';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';

import { useTranslation } from 'react-i18next';
interface RotationRequestsListProps {
  requests: RoleRotationRequest[];
}

const statusConfig: Record<string, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { labelKey: 'rotation.pendiente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  accepted: { labelKey: 'rotation.aceptada', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected: { labelKey: 'rotation.rechazada', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  cancelled: { labelKey: 'rotation.cancelada', variant: 'outline', icon: <XCircle className="h-3 w-3" /> },
  completed: { labelKey: 'rotation.completada', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
};

const recommendationConfig: Record<string, { labelKey: string; color: string }> = {
  highly_recommended: { labelKey: 'rotation.muyRecomendado', color: 'text-green-600' },
  recommended: { labelKey: 'rotation.recomendado', color: 'text-blue-600' },
  neutral: { labelKey: 'rotation.neutral', color: 'text-yellow-600' },
  not_recommended: { labelKey: 'rotation.noRecomendado', color: 'text-red-600' },
};

const roleLabelKeys: Record<string, string> = {
  sales: 'rotation.ventas',
  finance: 'rotation.finanzas',
  ai_tech: 'rotation.aitech',
  marketing: 'rotation.marketing',
  operations: 'rotation.operaciones',
  strategy: 'rotation.estrategia',
};

export function RotationRequestsList({ requests }: RotationRequestsListProps) {
  const { t } = useTranslation();
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('rotation.noHaySolicitudesDe')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status] || statusConfig.pending;
        const recommendation = request.compatibility_analysis?.recommendation 
          ? recommendationConfig[request.compatibility_analysis.recommendation]
          : null;

        return (
          <Card key={request.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Requester */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.requester?.avatar || undefined} />
                      <AvatarFallback>
                        {request.requester?.nombre?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.requester?.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleLabelKeys[request.requester_current_role] ? t(roleLabelKeys[request.requester_current_role]) : request.requester_current_role}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 text-muted-foreground" />

                  {/* Target */}
                  {request.target_user ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.target_user?.avatar || undefined} />
                        <AvatarFallback>
                          {request.target_user?.nombre?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.target_user?.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabelKeys[request.target_role || ''] ? t(roleLabelKeys[request.target_role || '']) : request.target_role}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <p className="font-medium">{t('rotation.pendienteDeAsignar')}</p>
                      <p className="text-xs">
                        {roleLabelKeys[request.target_role || ''] ? t(roleLabelKeys[request.target_role || '']) : t('rotation.cualquierRol')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={status.variant} className="flex items-center gap-1">
                    {status.icon}
                    {t(status.labelKey)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  {/* Projects */}
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: request.requester_project?.color || '#6366F1' }}
                    />
                    <span className="text-muted-foreground">
                      {request.requester_project?.nombre}
                    </span>
                    {request.target_project && request.target_project.id !== request.requester_project?.id && (
                      <>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: request.target_project?.color || '#6366F1' }}
                        />
                        <span className="text-muted-foreground">
                          {request.target_project?.nombre}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Compatibility */}
                  {request.compatibility_analysis?.score && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Compatibilidad:</span>
                      <span className={`font-medium ${recommendation?.color || ''}`}>
                        {Math.round(request.compatibility_analysis.score)}%
                      </span>
                      {recommendation && (
                        <span className={`text-xs ${recommendation.color}`}>
                          ({t(recommendation.labelKey)})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground">
                  {/* Acceptance status */}
                  <div className="flex items-center gap-2">
                    <span className={request.requester_accepted ? 'text-green-600' : ''}>
                      Solicitante: {request.requester_accepted ? '✓' : '○'}
                    </span>
                    <span className={request.target_accepted ? 'text-green-600' : ''}>
                      Objetivo: {request.target_accepted ? '✓' : '○'}
                    </span>
                  </div>

                  <span>
                    {formatDistanceToNow(new Date(request.created_at), { 
                      addSuffix: true, 
                      locale: getDateFnsLocale() 
                    })}
                  </span>
                </div>
              </div>

              {request.reason && (
                <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                  {request.reason}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
