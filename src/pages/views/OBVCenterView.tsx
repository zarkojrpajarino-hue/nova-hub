import { useState } from 'react';
import { Loader2, FileCheck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { OBVForm } from '@/components/nova/OBVForm';
import { OBVValidationList } from '@/components/nova/OBVValidationList';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';

const TABS = [
  { id: 'subir', label: '📤 Subir OBV' },
  { id: 'validar', label: '✅ Validar' },
  { id: 'mis-obvs', label: '📋 Mis OBVs' },
  { id: 'todas', label: '📊 Todas' },
];

interface OBVCenterViewProps {
  onNewOBV?: () => void;
}

export function OBVCenterView({ onNewOBV }: OBVCenterViewProps) {
  const [activeTab, setActiveTab] = useState('subir');
  const [showForm, setShowForm] = useState(true);
  const { profile } = useAuth();

  // Fetch user's OBVs
  const { data: myOBVs = [], isLoading: loadingMyOBVs } = useQuery({
    queryKey: ['my_obvs', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs')
        .select(`
          id, titulo, descripcion, tipo, fecha, status, 
          es_venta, facturacion, margen, producto, evidence_url, project_id
        `)
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, nombre, icon, color');

      const projectMap = new Map(projects?.map(p => [p.id, p]) || []);

      return data?.map(obv => ({
        ...obv,
        project: projectMap.get(obv.project_id || ''),
      })) || [];
    },
    enabled: !!profile?.id && activeTab === 'mis-obvs',
  });

  // Fetch all OBVs
  const { data: allOBVs = [], isLoading: loadingAllOBVs } = useQuery({
    queryKey: ['all_obvs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs')
        .select(`
          id, titulo, tipo, fecha, status, owner_id,
          es_venta, facturacion, margen
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre, color');

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return data?.map(obv => ({
        ...obv,
        owner: profileMap.get(obv.owner_id),
      })) || [];
    },
    enabled: activeTab === 'todas',
  });

  const handleFormSuccess = () => {
    setShowForm(false);
    setTimeout(() => setShowForm(true), 100);
  };

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

  return (
    <>
      <NovaHeader 
        title="Centro de OBVs" 
        subtitle="Gestiona tus OBVs y validaciones" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Section Help */}
        <SectionHelp section="obvs" variant="inline" />

        {/* Tabs */}
        <div className="flex gap-1 bg-background p-1 rounded-xl mb-6 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subir OBV */}
        {activeTab === 'subir' && showForm && (
          <OBVForm 
            onCancel={() => setActiveTab('mis-obvs')} 
            onSuccess={handleFormSuccess}
          />
        )}

        {/* Validar */}
        {activeTab === 'validar' && (
          <OBVValidationList />
        )}

        {/* Mis OBVs */}
        {activeTab === 'mis-obvs' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2.5">
              <FileCheck size={18} className="text-primary" />
              <h3 className="font-semibold">Mis OBVs</h3>
            </div>

            {loadingMyOBVs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : myOBVs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No has subido ninguna OBV todavía
              </div>
            ) : (
              <div className="divide-y divide-border">
                {myOBVs.map(obv => (
                  <div key={obv.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Type icon */}
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                        obv.tipo === 'exploracion' && "bg-info/20",
                        obv.tipo === 'validacion' && "bg-warning/20",
                        obv.tipo === 'venta' && "bg-success/20",
                      )}>
                        {obv.tipo === 'exploracion' ? '🔍' : obv.tipo === 'validacion' ? '✅' : '💰'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{obv.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {obv.project?.icon} {obv.project?.nombre || 'Sin proyecto'} • {obv.fecha}
                        </p>
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
        )}

        {/* Todas */}
        {activeTab === 'todas' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2.5">
              <FileCheck size={18} className="text-primary" />
              <h3 className="font-semibold">Todas las OBVs</h3>
            </div>

            {loadingAllOBVs ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allOBVs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No hay OBVs registradas
              </div>
            ) : (
              <div className="divide-y divide-border">
                {allOBVs.map(obv => (
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
                        <p className="font-bold text-success">€{obv.facturacion}</p>
                      )}

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        {getStatusIcon(obv.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <HelpWidget section="obvs" />
    </>
  );
}
