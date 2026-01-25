import { Loader2, FileCheck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProjectOBVsTabProps {
  projectId: string;
}

export function ProjectOBVsTab({ projectId }: ProjectOBVsTabProps) {
  const { data: obvs = [], isLoading } = useQuery({
    queryKey: ['project_obvs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs_public')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profiles
      const { data: profiles } = await supabase
        .from('members_public')
        .select('id, nombre, color');

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data?.map(obv => ({
        ...obv,
        owner: profileMap.get(obv.owner_id),
      })) || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle size={16} className="text-success" />;
      case 'rejected': return <XCircle size={16} className="text-destructive" />;
      default: return <Clock size={16} className="text-warning" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated': return 'Validada';
      case 'rejected': return 'Rechazada';
      default: return 'Pendiente';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2.5">
          <FileCheck size={18} className="text-primary" />
          <h3 className="font-semibold">OBVs del Proyecto</h3>
          <span className="ml-auto text-sm text-muted-foreground">{obvs.length} registradas</span>
        </div>

        {obvs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay OBVs registradas en este proyecto
          </div>
        ) : (
          <div className="divide-y divide-border">
            {obvs.map(obv => (
              <div key={obv.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Owner avatar */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{ background: obv.owner?.color || '#6366F1' }}
                  >
                    {obv.owner?.nombre?.charAt(0) || '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{obv.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {obv.owner?.nombre} • {obv.fecha}
                    </p>
                  </div>

                  {/* Type */}
                  <div className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold uppercase",
                    obv.tipo === 'exploracion' && "bg-info/20 text-info",
                    obv.tipo === 'validacion' && "bg-warning/20 text-warning",
                    obv.tipo === 'venta' && "bg-success/20 text-success",
                  )}>
                    {obv.tipo}
                  </div>

                  {/* Sale amount */}
                  {obv.es_venta && (
                    <div className="text-right">
                      <p className="font-bold text-success">€{obv.facturacion}</p>
                      <p className="text-xs text-muted-foreground">+€{obv.margen} margen</p>
                    </div>
                  )}

                  {/* Status */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                    obv.status === 'validated' && "bg-success/20 text-success",
                    obv.status === 'rejected' && "bg-destructive/20 text-destructive",
                    obv.status === 'pending' && "bg-warning/20 text-warning",
                  )}>
                    {getStatusIcon(obv.status)}
                    {getStatusLabel(obv.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
