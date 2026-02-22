import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Clock, ArrowLeftRight } from 'lucide-react';
import { RoleRotationRequest, useRespondToRotation, useCancelRotationRequest } from '@/hooks/useRoleRotation';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MyRotationRequestsProps {
  requests: RoleRotationRequest[];
}

const roleLabels: Record<string, string> = {
  sales: 'Ventas',
  finance: 'Finanzas',
  ai_tech: 'AI/Tech',
  marketing: 'Marketing',
  operations: 'Operaciones',
  strategy: 'Estrategia',
};

export function MyRotationRequests({ requests }: MyRotationRequestsProps) {
  const { profile } = useAuth();
  const respondMutation = useRespondToRotation();
  const cancelMutation = useCancelRotationRequest();

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests = requests.filter(r => r.status !== 'pending');

  const handleAccept = (request: RoleRotationRequest) => {
    const isRequester = request.requester_id === profile?.id;
    respondMutation.mutate({
      requestId: request.id,
      accept: true,
      isRequester,
    });
  };

  const handleReject = (request: RoleRotationRequest) => {
    const isRequester = request.requester_id === profile?.id;
    respondMutation.mutate({
      requestId: request.id,
      accept: false,
      isRequester,
    });
  };

  const handleCancel = (requestId: string) => {
    cancelMutation.mutate(requestId);
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No tienes solicitudes de rotación</p>
          <p className="text-muted-foreground text-center max-w-md">
            Crea una nueva solicitud para intercambiar roles con otro miembro del equipo
            y desarrollar nuevas habilidades.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pendientes de Respuesta
          </h3>

          {pendingRequests.map((request) => {
            const isRequester = request.requester_id === profile?.id;
            const needsMyAction = isRequester ? !request.requester_accepted : !request.target_accepted;
            const otherPerson = isRequester ? request.target_user : request.requester;
            const myCurrentRole = isRequester ? request.requester_current_role : request.target_role;
            const theirCurrentRole = isRequester ? request.target_role : request.requester_current_role;

            return (
              <Card key={request.id} className={needsMyAction ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherPerson?.avatar || undefined} />
                        <AvatarFallback>{otherPerson?.nombre?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {isRequester ? 'Tu solicitud a' : 'Solicitud de'} {otherPerson?.nombre}
                        </CardTitle>
                        <CardDescription>
                          Intercambiar {roleLabels[myCurrentRole || ''] || myCurrentRole} ↔ {roleLabels[theirCurrentRole || ''] || theirCurrentRole}
                        </CardDescription>
                      </div>
                    </div>

                    {needsMyAction && (
                      <Badge variant="default" className="bg-primary">
                        Requiere tu acción
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Compatibility Score */}
                  {request.compatibility_analysis?.score && (
                    <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">Análisis de Compatibilidad</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Score: {Math.round(request.compatibility_analysis.score)}%</span>
                          <span>Tu rendimiento: {request.compatibility_analysis.user1_performance?.toFixed(0) || 50}%</span>
                          <span>Su rendimiento: {request.compatibility_analysis.user2_performance?.toFixed(0) || 50}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.reason && (
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                  )}

                  {/* Status indicators */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      {request.requester_accepted ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{request.requester?.nombre}: {request.requester_accepted ? 'Aceptó' : 'Pendiente'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.target_accepted ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{request.target_user?.nombre}: {request.target_accepted ? 'Aceptó' : 'Pendiente'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: es })}
                    </span>

                    <div className="flex items-center gap-2">
                      {isRequester && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancel(request.id)}
                          disabled={cancelMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      )}

                      {needsMyAction && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleReject(request)}
                            disabled={respondMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleAccept(request)}
                            disabled={respondMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aceptar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Other Requests */}
      {otherRequests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Historial de Solicitudes</h3>

          {otherRequests.map((request) => {
            const isRequester = request.requester_id === profile?.id;
            const otherPerson = isRequester ? request.target_user : request.requester;

            const statusBadge = {
              completed: { label: 'Completada', variant: 'default' as const },
              rejected: { label: 'Rechazada', variant: 'destructive' as const },
              cancelled: { label: 'Cancelada', variant: 'outline' as const },
              accepted: { label: 'Aceptada', variant: 'secondary' as const },
            }[request.status] || { label: request.status, variant: 'outline' as const };

            return (
              <Card key={request.id} className="opacity-75">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={otherPerson?.avatar || undefined} />
                        <AvatarFallback>{otherPerson?.nombre?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {isRequester ? 'Solicitud a' : 'Solicitud de'} {otherPerson?.nombre}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
