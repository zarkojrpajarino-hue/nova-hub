/**
 * CENTRO OBVs VIEW - Enterprise Edition
 *
 * Centro de gestión de OBVs (Objective-Based Validations).
 * Recibe OBVs de Validaciones y genera tareas para el equipo.
 */

import { useState } from 'react';
import { Loader2, FileCheck, CheckCircle, Clock, XCircle, MinusCircle, CheckCircle2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { OBVForm } from '@/components/nova/OBVForm';
import { OBVValidationList } from '@/components/nova/OBVValidationList';
import { AITaskExecutor } from '@/components/tasks/AITaskExecutor';
import { HowItWorks } from '@/components/ui/how-it-works';
import { OBVCenterPreviewModal } from '@/components/preview/OBVCenterPreviewModal';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { HelpWidget } from '@/components/ui/section-help';
import { toast } from 'sonner';

const TABS = [
  { id: 'subir', label: '📤 Subir OBV' },
  { id: 'validar', label: '✅ Validar' },
  { id: 'ai-executor', label: '✨ AI Executor' },
  { id: 'mis-obvs', label: '📋 Mis OBVs' },
  { id: 'todas', label: '📊 Todas' },
];

interface OBVCenterViewProps {
  onNewOBV?: () => void;
}

const OUTCOME_OPTIONS = [
  { value: 'success', label: 'Éxito',    icon: CheckCircle2, color: 'text-success',     bg: 'bg-success/10 border-success/40' },
  { value: 'partial', label: 'Parcial',  icon: MinusCircle,  color: 'text-warning',     bg: 'bg-warning/10 border-warning/40' },
  { value: 'fail',    label: 'No validó', icon: XCircle,     color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/40' },
] as const;

export function OBVCenterView({ onNewOBV }: OBVCenterViewProps) {
  const [activeTab, setActiveTab] = useState('subir');
  const [showForm, setShowForm] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's OBVs
  const { data: myOBVs = [], isLoading: loadingMyOBVs } = useQuery({
    queryKey: ['my_obvs', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs')
        .select(`
          id, titulo, descripcion, tipo, fecha, status,
          es_venta, facturacion, margen, producto, evidence_url,
          obv_outcome, project_id
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

  const handleSetOutcome = async (obvId: string, outcome: string) => {
    const { error } = await supabase
      .from('obvs')
      .update({ obv_outcome: outcome || null })
      .eq('id', obvId);
    if (error) {
      toast.error('Error al actualizar el resultado');
    } else {
      toast.success('Resultado registrado');
      queryClient.invalidateQueries({ queryKey: ['my_obvs', profile?.id] });
    }
    setEditingOutcomeId(null);
  };

  // Fetch all OBVs
  const { data: allOBVs = [], isLoading: loadingAllOBVs } = useQuery({
    queryKey: ['all_obvs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obvs')
        .select(`
          id, titulo, tipo, fecha, status, owner_id,
          es_venta
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Get profiles
      const { data: profiles } = await supabase
        .from('members')
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
        title="Centro OBVs"
        subtitle="Ejecuta objetivos validados y genera tareas para el equipo"
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* How it works */}
        <HowItWorks
          title="Cómo funciona"
          description="Convierte objetivos validados en tareas ejecutables"
          whatIsIt="Centro de ejecución donde creas OBVs (Objective-Based Validations) basadas en experimentos aprobados. Cada OBV se convierte en tareas asignadas al equipo. Sistema peer-to-peer: el equipo valida tus OBVs antes de ejecutarlas."
          dataInputs={[
            {
              from: 'Validaciones',
              items: [
                'Experimentos aprobados por el equipo',
                'Objetivos específicos (Ej: "100 leads en 2 semanas")',
                'Criterios de éxito definidos',
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'Tareas',
              items: [
                'Tareas específicas por rol',
                'Asignaciones automáticas según expertise',
                'Deadlines basados en objetivos',
              ],
            },
            {
              to: 'CRM',
              items: [
                'Leads a contactar (si OBV es de ventas)',
                'Scripts de prospección',
                'Seguimiento de conversiones',
              ],
            },
            {
              to: 'KPIs',
              items: [
                'Métricas a trackear en tiempo real',
                'Progress hacia objetivo',
                'Alertas si vas retrasado',
              ],
            },
          ]}
          nextStep={{
            action: 'Crea OBV → El equipo la valida → Se generan tareas automáticamente',
            destination: 'Ejecuta tareas asignadas y trackea progreso en KPIs',
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

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

        {/* AI Task Executor */}
        {activeTab === 'ai-executor' && (
          <AITaskExecutor />
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
                {myOBVs.map(obv => {
                  const outcomeOpt = OUTCOME_OPTIONS.find(o => o.value === obv.obv_outcome);
                  const isEditingThis = editingOutcomeId === obv.id;
                  return (
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

                        {/* Outcome badge / editor */}
                        <div>
                          {outcomeOpt ? (
                            <button
                              onClick={() => setEditingOutcomeId(isEditingThis ? null : obv.id)}
                              className={cn(
                                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border',
                                outcomeOpt.bg, outcomeOpt.color
                              )}
                              title="Cambiar resultado"
                            >
                              <outcomeOpt.icon size={12} />
                              {outcomeOpt.label}
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingOutcomeId(isEditingThis ? null : obv.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              + Resultado
                            </button>
                          )}
                        </div>

                        {/* Validation status */}
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

                      {/* Inline outcome picker */}
                      {isEditingThis && (
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">¿Cuál fue el resultado?</span>
                          {OUTCOME_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleSetOutcome(obv.id, opt.value)}
                              className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                                obv.obv_outcome === opt.value
                                  ? opt.bg + ' ' + opt.color
                                  : 'border-border hover:border-muted-foreground/40'
                              )}
                            >
                              <opt.icon size={11} className={obv.obv_outcome === opt.value ? opt.color : ''} />
                              {opt.label}
                            </button>
                          ))}
                          {obv.obv_outcome && (
                            <button
                              onClick={() => handleSetOutcome(obv.id, '')}
                              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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

      <OBVCenterPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </>
  );
}
