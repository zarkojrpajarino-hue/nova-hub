import { useState, useMemo } from 'react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Filter } from 'lucide-react';
import { useMemberStats, useProjects, useProjectStats } from '@/hooks/useNovaData';
import { PartnerComparisonTable } from '@/components/analytics/PartnerComparisonTable';
import { PartnerRadarChart } from '@/components/analytics/PartnerRadarChart';
import { ProjectComparisonCharts } from '@/components/analytics/ProjectComparisonCharts';
import { TemporalEvolutionChart } from '@/components/analytics/TemporalEvolutionChart';
import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
import { PredictionsWidget } from '@/components/analytics/PredictionsWidget';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { ExportButton } from '@/components/export/ExportButton';
import { AnalyticsPreviewModal } from '@/components/preview/AnalyticsPreviewModal';
import { CompetitiveAnalysisView } from '@/components/analytics/CompetitiveAnalysisView';
import { WeeklyInsightsView } from '@/components/analytics/WeeklyInsightsView';

import { useTranslation } from 'react-i18next';
interface AnalyticsViewProps {
  onNewOBV?: () => void;
  isDemoMode?: boolean; // Viene de FeatureGate cuando está bloqueado
}

// Componente interno que renderiza el contenido
function AnalyticsContent({ onNewOBV, isDemoMode: _isDemoMode = false }: AnalyticsViewProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Real data hooks
  const { data: members = [] } = useMemberStats();
  const { data: projects = [] } = useProjects();
  const { data: projectStats = [] } = useProjectStats();

  const handleExportCSV = (data: unknown[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0] as object).join(',');
    const rows = data.map(row => Object.values(row as object).join(','));
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Filter members based on selection
  const filteredMembers = useMemo(() => {
    if (selectedPartners.length === 0) return members;
    return members.filter(m => selectedPartners.includes(m.id || ''));
  }, [members, selectedPartners]);

  // Filter projects based on selection
  const filteredProjectStats = useMemo(() => {
    if (selectedProject === 'all') return projectStats;
    return projectStats.filter(p => p.id === selectedProject);
  }, [projectStats, selectedProject]);

  return (
    <>
      <NovaHeader
          title={t('analytics.analytics')}
          subtitle={t('analytics.deepDivesEnMétricas')}
          onNewOBV={onNewOBV}
          showBackButton={true}
        />

        <div className="p-8 space-y-6">
        {/* How it works */}
        <HowItWorks
          title={t('analytics.cómoFunciona')}
          description={t('analytics.dashboardsDetalladosConMétricas')}
          whatIsIt={t('analytics.herramientaDeBusinessIntelligence')}
          onViewPreview={() => setShowPreviewModal(true)}
          premiumFeature="advanced_analytics"
          requiredPlan="advanced"
          dataInputs={[
            {
              from: t('analytics.todasLasSecciones'),
              items: [
                t('analytics.dashboardKpisConsolidadosDe'),
                t('analytics.centroObvsActividadY'),
                t('analytics.crmPipelineConversionesY'),
                t('analytics.financieroMrrGrowthRate'),
                t('analytics.kpisLearningPathsBook'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: t('analytics.decisionesEstratégicas'),
              items: [
                'Qué socio tiene mejor performance (y por qué)',
                t('analytics.quéProyectoEsMás'),
                t('analytics.correlacionesMásLearningMás'),
              ],
            },
            {
              to: 'Predicciones IA',
              items: [
                t('analytics.revenueProyectadoPróximos3'),
                t('analytics.riesgoDeIncumplimientoDe'),
                t('analytics.recomendacionesDeAccionesA'),
              ],
            },
            {
              to: t('analytics.reportes'),
              items: [
                'Exportar comparativas a Excel/PDF',
                t('analytics.dashboardsPersonalizadosPorPeríodo'),
                t('analytics.visualizacionesParaInvestors'),
              ],
            },
          ]}
          nextStep={{
            action: t('analytics.exploraComparativasIdentificaPatrones'),
            destination: t('analytics.aplicaInsightsEnProyectos'),
          }}
        />

        {/* Global Filters Bar */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Período:</span>
                <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">{t('analytics.semana')}</SelectItem>
                    <SelectItem value="month">{t('analytics.mes')}</SelectItem>
                    <SelectItem value="quarter">{t('analytics.trimestre')}</SelectItem>
                    <SelectItem value="year">{t('analytics.año')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Proyecto:</span>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t('analytics.todos')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('analytics.todosLosProyectos')}</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />{t('analytics.másFiltros')}</Button>

              <div className="ml-auto flex items-center gap-2">
                <ExportButton
                  options={[
                    {
                      label: t('analytics.exportarSocios'),
                      type: 'members',
                      data: filteredMembers.map(m => ({
                        nombre: m.nombre || '',
                        email: m.email || '',
                        rol: m.rol || '',
                        facturacion: m.facturacion || 0,
                        margen: m.margen || 0,
                        obvs_creadas: m.obvs_creadas || 0,
                        obvs_validadas: m.obvs_validadas || 0,
                        kpis_validados: m.kpis_validados || 0,
                        tareas_completadas: m.tareas_completadas || 0,
                      })),
                      metadata: {
                        title: t('analytics.analyticsSocios'),
                        currencyColumns: [3, 4],
                      },
                    },
                    {
                      label: t('analytics.exportarProyectos'),
                      type: 'proyectos',
                      data: filteredProjectStats.map(p => ({
                        nombre: p.nombre || '',
                        num_miembros: p.num_members || 0,
                        obvs_total: p.total_obvs || 0,
                        leads_total: p.total_leads || 0,
                        leads_ganados: p.leads_ganados || 0,
                        facturacion: p.facturacion || 0,
                        margen: p.margen || 0,
                      })),
                      metadata: {
                        title: t('analytics.analyticsProyectos'),
                        currencyColumns: [5, 6],
                      },
                    },
                  ]}
                  variant="outline"
                  size="sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {showFilters && (
              <AnalyticsFilters 
                members={members}
                selectedPartners={selectedPartners}
                onPartnersChange={setSelectedPartners}
              />
            )}
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="partners" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-fit">
            <TabsTrigger value="partners">{t('analytics.comparativaSocios')}</TabsTrigger>
            <TabsTrigger value="projects">{t('analytics.comparativaProyectos')}</TabsTrigger>
            <TabsTrigger value="temporal">{t('analytics.evoluciónTemporal')}</TabsTrigger>
            <TabsTrigger value="predictions">{t('analytics.predicciones')}</TabsTrigger>
            <TabsTrigger value="competitive">{t('analytics.competitiveTab')}</TabsTrigger>
            <TabsTrigger value="weekly">{t('analytics.weeklyTab')}</TabsTrigger>
          </TabsList>

          {/* Partners Comparison Tab */}
          <TabsContent value="partners" className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{t('analytics.tablaComparativaDeSocios')}</CardTitle>
                    <ExportButton
                      options={[
                        {
                          label: t('analytics.exportar'),
                          type: 'members',
                          data: filteredMembers.map(m => ({
                            nombre: m.nombre || '',
                            email: m.email || '',
                            rol: m.rol || '',
                            facturacion: m.facturacion || 0,
                            margen: m.margen || 0,
                            obvs_creadas: m.obvs_creadas || 0,
                            obvs_validadas: m.obvs_validadas || 0,
                            kpis_validados: m.kpis_validados || 0,
                            tareas_completadas: m.tareas_completadas || 0,
                          })),
                          metadata: {
                            title: t('analytics.sociosComparativa'),
                            currencyColumns: [3, 4],
                          },
                        },
                      ]}
                      variant="ghost"
                      size="sm"
                      showLabel={false}
                    />
                  </CardHeader>
                  <CardContent>
                    <PartnerComparisonTable 
                      members={filteredMembers} 
                      onSelectPartner={(id) => {
                        setSelectedPartners(prev => 
                          prev.includes(id) 
                            ? prev.filter(p => p !== id)
                            : prev.length < 3 ? [...prev, id] : prev
                        );
                      }}
                      selectedPartners={selectedPartners}
                    />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>{t('analytics.radarComparativo')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PartnerRadarChart 
                      members={members.filter(m => selectedPartners.includes(m.id || ''))}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Projects Comparison Tab */}
          <TabsContent value="projects" className="space-y-6">
            <ProjectComparisonCharts 
              projectStats={filteredProjectStats}
              onExportCSV={(data) => handleExportCSV(data, 'proyectos-comparativa')}
            />
          </TabsContent>

          {/* Temporal Evolution Tab */}
          <TabsContent value="temporal" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.evoluciónDeKpis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemporalEvolutionChart period={period} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.mapaDeActividad')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityHeatmap />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <PredictionsWidget members={members} period={period} />
          </TabsContent>

          {/* V4.6.2 Competitive Analysis Tab */}
          <TabsContent value="competitive" className="space-y-6">
            <CompetitiveAnalysisView />
          </TabsContent>

          {/* V4.6.3 Weekly Insights Tab */}
          <TabsContent value="weekly" className="space-y-6">
            <WeeklyInsightsView />
          </TabsContent>
        </Tabs>
        </div>

        <HelpWidget section="analytics" />

        {/* Analytics Preview Modal */}
        <AnalyticsPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}

// Componente principal exportado SIN FeatureGate
// Analytics es accesible para todos, solo muestra datos si los hay
export function AnalyticsView(props: AnalyticsViewProps) {
  return <AnalyticsContent {...props} />;
}
