/**
 * CRM VIEW - Enterprise Edition
 *
 * Sistema de gestión de leads y ventas.
 * Recibe buyer personas de Proyectos y genera pipeline de ventas.
 * SIN datos demo - Solo datos reales.
 */

import { useState, useMemo } from 'react';
import { Loader2, LayoutDashboard, Kanban, List, Users, TrendingUp, Target, DollarSign, Brain, Sparkles, Mail } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { usePipelineGlobal, useProjects, useProfiles } from '@/hooks/useNovaData';
import { CRMPipeline } from '@/components/crm/CRMPipeline';
import { CRMFilters } from '@/components/crm/CRMFilters';
import { AILeadScoring } from '@/components/crm/AILeadScoring';
import { AILeadFinder } from '@/components/crm/AILeadFinder';
import { EmailPitchGenerator } from '@/components/crm/EmailPitchGenerator';
import { HowItWorks } from '@/components/ui/how-it-works';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpWidget } from '@/components/ui/section-help';
import { ExportButton } from '@/components/export/ExportButton';
import { CRMPreviewModal } from '@/components/preview/CRMPreviewModal';

import { useTranslation } from 'react-i18next';
interface CRMViewProps {
  onNewOBV?: () => void;
}

export function CRMView({ onNewOBV }: CRMViewProps) {
  const { t } = useTranslation();
  const { data: leads = [], isLoading: loadingLeads } = usePipelineGlobal();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: profiles = [], isLoading: loadingProfiles } = useProfiles();

  const [viewMode, setViewMode] = useState<'overview' | 'pipeline' | 'lista' | 'insights' | 'ai-finder' | 'email-pitch'>('overview');
  const [filters, setFilters] = useState({
    project: 'all',
    responsable: 'all',
    status: 'all',
    minValue: '',
    maxValue: '',
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const isLoading = loadingLeads || loadingProjects || loadingProfiles;

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    if (filters.project !== 'all' && lead.project_id !== filters.project) return false;
    if (filters.responsable !== 'all' && lead.responsable_id !== filters.responsable) return false;
    if (filters.status !== 'all' && lead.status !== filters.status) return false;
    if (filters.minValue && (lead.valor_potencial || 0) < parseFloat(filters.minValue)) return false;
    if (filters.maxValue && (lead.valor_potencial || 0) > parseFloat(filters.maxValue)) return false;
    return true;
  });

  // Transform data for components
  const projectsData = projects.map(p => ({
    id: p.id,
    nombre: p.nombre,
    icon: p.icon,
    color: p.color,
  }));

  const membersData = profiles.map(p => ({
    id: p.id,
    nombre: p.nombre,
    color: p.color,
  }));

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const totalValue = filteredLeads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
    const ganados = filteredLeads.filter(l => l.status === 'cerrado_ganado').length;
    const enNegociacion = filteredLeads.filter(l => l.status === 'negociacion').length;
    const calientes = filteredLeads.filter(l => l.status === 'hot').length;

    const byStatus: Record<string, number> = {};
    filteredLeads.forEach(l => {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    });

    return { totalLeads, totalValue, ganados, enNegociacion, calientes, byStatus };
  }, [filteredLeads]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <NovaHeader
        title={t('cRM.crmGlobal')}
        subtitle={t('cRM.gestionaLeadsUsandoBuyer')}
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* How it works */}
        <HowItWorks
          title={t('cRM.cómoFunciona')}
          description={t('cRM.crmInteligenteQueUsa')}
          whatIsIt={t('cRM.sistemaDeGestiónDe')}
          dataInputs={[
            {
              from: t('cRM.proyectos'),
              items: [
                'Buyer Personas (cliente ideal con pain points)',
                'Value Propositions (por qué comprar tu producto)',
                'Battle Cards (cómo competir vs competidores)',
              ],
            },
            {
              from: t('cRM.centroObvs'),
              items: [
                'OBVs de tipo "venta" generan leads automáticamente',
                'Objetivos de ventas (Ej: "10 demos cerradas")',
                t('cRM.scriptsDeProspección'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('cRM.financiero'),
              items: [
                'Revenue proyectado (pipeline value)',
                'Deals cerrados (revenue real)',
                t('cRM.forecastMensual'),
              ],
            },
            {
              to: t('cRM.kpis'),
              items: [
                t('cRM.tasaDeConversiónPor'),
                t('cRM.tiempoPromedioDeCierre'),
                t('cRM.valorPromedioDeDeal'),
              ],
            },
          ]}
          nextStep={{
            action: t('cRM.gestionaPipelineCierraDeals'),
            destination: t('cRM.revenueApareceEnFinanciero'),
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard size={16} />{t('cRM.vistaGeneral')}</TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Kanban size={16} />{t('cRM.pipelineKanban')}</TabsTrigger>
            <TabsTrigger value="lista" className="flex items-center gap-2">
              <List size={16} />{t('cRM.listaDetallada')}</TabsTrigger>
            <TabsTrigger value="ai-finder" className="flex items-center gap-2">
              <Sparkles size={16} />{t('cRM.aiLeadFinder')}</TabsTrigger>
            <TabsTrigger value="email-pitch" className="flex items-center gap-2">
              <Mail size={16} />
              Email Pitch IA
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain size={16} />
              Insights IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Header with Export Button */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{t('cRM.resumenDelPipeline')}</h3>
                <p className="text-sm text-muted-foreground">{t('cRM.vistaGeneralDeTodos')}</p>
              </div>
              <ExportButton
                options={[
                  {
                    label: t('cRM.exportarTodosLosLeads'),
                    type: 'crm',
                    data: filteredLeads.map(lead => {
                      const project = projects.find(p => p.id === lead.project_id);
                      const responsable = profiles.find(p => p.id === lead.responsable_id);
                      return {
                        obv_titulo: lead.nombre || '',
                        empresa: lead.empresa || '',
                        estado: lead.status || '',
                        valor_potencial: lead.valor_potencial || 0,
                        proyecto_nombre: project?.nombre || '',
                        responsable_nombre: responsable?.nombre || '',
                        proxima_accion: lead.proxima_accion || '',
                        email_contacto: '',
                        telefono_contacto: '',
                      };
                    }),
                    metadata: {
                      title: t('cRM.pipelineCrmTodosLos'),
                      currencyColumns: [3],
                    },
                  },
                  {
                    label: t('cRM.exportarSoloCerradosGanados'),
                    type: 'crm_cerrados',
                    data: filteredLeads
                      .filter(lead => lead.status === 'cerrado_ganado')
                      .map(lead => {
                        const project = projects.find(p => p.id === lead.project_id);
                        const responsable = profiles.find(p => p.id === lead.responsable_id);
                        return {
                          obv_titulo: lead.nombre || '',
                          empresa: lead.empresa || '',
                          valor_potencial: lead.valor_potencial || 0,
                          proyecto_nombre: project?.nombre || '',
                          responsable_nombre: responsable?.nombre || '',
                        };
                      }),
                    metadata: {
                      title: t('cRM.crmCerradosGanados'),
                      currencyColumns: [2],
                    },
                  },
                ]}
                variant="outline"
                size="sm"
              />
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cRM.totalLeads')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalLeads}</div>
                  <p className="text-xs text-muted-foreground">{t('cRM.enElPipeline')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cRM.valorPipeline')}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{metrics.totalValue.toLocaleString('es-ES')}</div>
                  <p className="text-xs text-muted-foreground">{t('cRM.potencialTotal')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cRM.enNegociación')}</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.enNegociacion}</div>
                  <p className="text-xs text-muted-foreground">Leads calientes: {metrics.calientes}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('cRM.cerradosGanados')}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{metrics.ganados}</div>
                  <p className="text-xs text-muted-foreground">{t('cRM.convertidosACliente')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Distribución por estado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('cRM.distribuciónPorEstado')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(metrics.byStatus).map(([status, count]) => (
                    <Badge key={status} variant="outline" className="text-sm py-1 px-3">
                      {status.replace('_', ' ')}: <span className="font-bold ml-1">{count}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Leads */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('cRM.top5LeadsPor')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredLeads
                    .sort((a, b) => (b.valor_potencial || 0) - (a.valor_potencial || 0))
                    .slice(0, 5)
                    .map((lead, i) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{lead.nombre}</p>
                            <p className="text-sm text-muted-foreground">{lead.empresa || t('cRM.sinEmpresa')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">€{(lead.valor_potencial || 0).toLocaleString('es-ES')}</p>
                          <Badge variant="secondary" className="text-xs">{lead.status?.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pipeline">
            <CRMFilters
              projects={projectsData}
              members={membersData}
              filters={filters}
              onFiltersChange={setFilters}
            />
            <div className="mt-6">
              <CRMPipeline
                leads={filteredLeads}
                projects={projectsData}
                members={membersData}
                isLoading={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="lista">
            <div className="flex items-center justify-between mb-4">
              <CRMFilters
                projects={projectsData}
                members={membersData}
                filters={filters}
                onFiltersChange={setFilters}
              />
              <ExportButton
                options={[
                  {
                    label: t('cRM.exportarListaFiltrada'),
                    type: 'crm',
                    data: filteredLeads.map(lead => {
                      const project = projects.find(p => p.id === lead.project_id);
                      const responsable = profiles.find(p => p.id === lead.responsable_id);
                      return {
                        obv_titulo: lead.nombre || '',
                        empresa: lead.empresa || '',
                        estado: lead.status || '',
                        valor_potencial: lead.valor_potencial || 0,
                        proyecto_nombre: project?.nombre || '',
                        responsable_nombre: responsable?.nombre || '',
                        proxima_accion: lead.proxima_accion || '',
                        email_contacto: '',
                        telefono_contacto: '',
                      };
                    }),
                    metadata: {
                      title: t('cRM.pipelineCrmListaFiltrada'),
                      currencyColumns: [3],
                    },
                  },
                ]}
                variant="outline"
                size="sm"
              />
            </div>
            <div className="mt-6">
              <CRMPipeline
                leads={filteredLeads}
                projects={projectsData}
                members={membersData}
                isLoading={false}
                defaultView="table"
              />
            </div>
          </TabsContent>

          <TabsContent value="ai-finder">
            <AILeadFinder />
          </TabsContent>

          <TabsContent value="email-pitch">
            <EmailPitchGenerator />
          </TabsContent>

          <TabsContent value="insights">
            <AILeadScoring leads={filteredLeads} />
          </TabsContent>
        </Tabs>
      </div>

      <HelpWidget section="crm" />
      <CRMPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}
