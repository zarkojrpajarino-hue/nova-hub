import { useState, useMemo } from 'react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { useMemberStats, useProjects, useProjectStats } from '@/hooks/useNovaData';
import { PartnerComparisonTable } from '@/components/analytics/PartnerComparisonTable';
import { PartnerRadarChart } from '@/components/analytics/PartnerRadarChart';
import { ProjectComparisonCharts } from '@/components/analytics/ProjectComparisonCharts';
import { TemporalEvolutionChart } from '@/components/analytics/TemporalEvolutionChart';
import { ActivityHeatmap } from '@/components/analytics/ActivityHeatmap';
import { PredictionsWidget } from '@/components/analytics/PredictionsWidget';
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters';

interface AnalyticsViewProps {
  onNewOBV?: () => void;
}

export function AnalyticsView({ onNewOBV }: AnalyticsViewProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
        title="Analytics" 
        subtitle="Análisis avanzado y comparativas" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8 space-y-6">
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
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mes</SelectItem>
                    <SelectItem value="quarter">Trimestre</SelectItem>
                    <SelectItem value="year">Año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Proyecto:</span>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los proyectos</SelectItem>
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
                <Filter className="w-4 h-4 mr-2" />
                Más filtros
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleExportCSV(members as unknown[], 'analytics-members')}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
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
          <TabsList className="grid grid-cols-4 w-fit">
            <TabsTrigger value="partners">Comparativa Socios</TabsTrigger>
            <TabsTrigger value="projects">Comparativa Proyectos</TabsTrigger>
            <TabsTrigger value="temporal">Evolución Temporal</TabsTrigger>
            <TabsTrigger value="predictions">Predicciones</TabsTrigger>
          </TabsList>

          {/* Partners Comparison Tab */}
          <TabsContent value="partners" className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Tabla Comparativa de Socios</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleExportCSV(filteredMembers as unknown[], 'socios-comparativa')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
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
                    <CardTitle>Radar Comparativo</CardTitle>
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
                  <CardTitle>Evolución de KPIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemporalEvolutionChart period={period} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Mapa de Actividad</CardTitle>
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
        </Tabs>
      </div>
    </>
  );
}
