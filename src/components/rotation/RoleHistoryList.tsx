import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, History, UserPlus, ArrowLeftRight, TrendingUp, RotateCcw } from 'lucide-react';
import { RoleHistory } from '@/hooks/useRoleRotation';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoleHistoryListProps {
  history: RoleHistory[];
}

const changeTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  assignment: { label: 'Asignación', icon: <UserPlus className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  swap: { label: 'Intercambio', icon: <ArrowLeftRight className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  transfer: { label: 'Transferencia', icon: <ArrowRight className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  rotation: { label: 'Rotación', icon: <RotateCcw className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  promotion: { label: 'Promoción', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
};

const roleLabels: Record<string, string> = {
  sales: 'Ventas',
  finance: 'Finanzas',
  ai_tech: 'AI/Tech',
  marketing: 'Marketing',
  operations: 'Operaciones',
  strategy: 'Estrategia',
};

export function RoleHistoryList({ history }: RoleHistoryListProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Sin historial de cambios</p>
          <p className="text-muted-foreground text-center max-w-md">
            Los cambios de rol se registrarán aquí automáticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = format(new Date(item.created_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, RoleHistory[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedHistory).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-2">
            {format(new Date(date), "d 'de' MMMM, yyyy", { locale: es })}
          </h4>

          <div className="space-y-2">
            {items.map((item) => {
              const typeConfig = changeTypeConfig[item.change_type] || changeTypeConfig.assignment;

              return (
                <Card key={item.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* User */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.user?.avatar || undefined} />
                        <AvatarFallback>{item.user?.nombre?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>

                      {/* Change info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.user?.nombre}</span>
                          <Badge variant="outline" className={typeConfig.color}>
                            {typeConfig.icon}
                            <span className="ml-1">{typeConfig.label}</span>
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {item.old_role && (
                            <>
                              <span>{roleLabels[item.old_role] || item.old_role}</span>
                              <ArrowRight className="h-3 w-3" />
                            </>
                          )}
                          <span className="font-medium text-foreground">
                            {roleLabels[item.new_role] || item.new_role}
                          </span>

                          {item.project && (
                            <>
                              <span className="mx-2">•</span>
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: item.project.color || '#6366F1' }}
                                />
                                <span>{item.project.nombre}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>

                      {/* Performance score change */}
                      {item.previous_performance_score !== null && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Score anterior</p>
                          <p className="font-medium">{item.previous_performance_score?.toFixed(0)}%</p>
                        </div>
                      )}

                      {/* Time */}
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(item.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
