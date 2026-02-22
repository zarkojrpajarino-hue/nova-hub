/**
 * FINANCIERO VIEW - Enterprise Edition
 *
 * Control de revenue, costos y rentabilidad.
 * Recibe datos de CRM (deals cerrados) y Productos (pricing).
 */

import { useState } from 'react';
import { TrendingUp, Wallet, PieChart as PieChartIcon, BarChart3, Loader2, Clock, Receipt, Target } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { HowItWorks } from '@/components/ui/how-it-works';
import { cn } from '@/lib/utils';
import { RevenueEvolutionChart } from '@/components/financiero/RevenueEvolutionChart';
import { ProjectBreakdownChart } from '@/components/financiero/ProjectBreakdownChart';
import { PendingPaymentsCard } from '@/components/financiero/PendingPaymentsCard';
import { FinancialAlertsCard } from '@/components/financiero/FinancialAlertsCard';
import { AIForecastWidget } from '@/components/financiero/AIForecastWidget';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';
import { useFinancieroData } from '@/hooks/useFinancieroData';
import { ExportButton } from '@/components/export/ExportButton';
import { FinancieroPreviewModal } from '@/components/preview/FinancieroPreviewModal';

interface FinancieroViewProps {
  onNewOBV?: () => void;
}

export function FinancieroView({ onNewOBV }: FinancieroViewProps) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'cobros' | 'proyecciones'>('dashboard');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const {
    isLoading,
    sortedByFacturacion,
    financialMetrics,
    pendingPayments,
    overduePayments,
    upcomingPayments,
    objectivesMap,
    metrics: {
      totalFacturacion,
      totalMargen,
      margenPromedio,
      totalPending,
      overdueCount,
      monthlyGrowth,
      metaAnual,
      progresoAnual,
    },
  } = useFinancieroData();

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
        title="Financiero"
        subtitle="Revenue, costos y rentabilidad consolidada de todos los proyectos"
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* How it works */}
        <HowItWorks
          title="Cómo funciona"
          description="Centro financiero que consolida revenue de todos tus proyectos"
          whatIsIt="Dashboard financiero que agrega automáticamente revenue de deals cerrados en CRM, multiplica por pricing de productos, y calcula márgenes. IA proyecta revenue futuro basado en pipeline actual y tendencias históricas."
          dataInputs={[
            {
              from: 'CRM Global',
              items: [
                'Deals cerrados (revenue real)',
                'Pipeline value (revenue proyectado)',
                'Forecast mensual',
              ],
            },
            {
              from: 'Proyectos',
              items: [
                'Productos con pricing',
                'Modelo de monetización',
                'Cost structure estimada',
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'KPIs',
              items: [
                'MRR (Monthly Recurring Revenue)',
                'Growth rate mensual',
                'Burn rate y runway',
              ],
            },
            {
              to: 'Analytics',
              items: [
                'Rentabilidad por proyecto',
                'Revenue breakdown por producto',
                'Cohort analysis',
              ],
            },
            {
              to: 'Decisiones',
              items: [
                'Cuánto dinero queda (runway)',
                'Proyectos más rentables',
                '¿Necesitas fundraising?',
              ],
            },
          ]}
          nextStep={{
            action: 'Monitorea cashflow y proyecciones',
            destination: 'Usa KPIs para trackear crecimiento, Analytics para deep dives',
          }}
          onViewPreview={() => setShowPreviewModal(true)}
        />

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="cobros" className="flex items-center gap-2">
              <Receipt size={16} />
              Gestión Cobros
            </TabsTrigger>
            <TabsTrigger value="proyecciones" className="flex items-center gap-2">
              <Target size={16} />
              Proyecciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={TrendingUp}
                value={`€${totalFacturacion.toLocaleString('es-ES')}`}
                label="Facturación Total"
                progress={(totalFacturacion / (objectivesMap.facturacion * 9)) * 100}
                target={`€${(objectivesMap.facturacion * 9).toLocaleString('es-ES')}`}
                color="#3B82F6"
                delay={1}
              />
              <StatCard
                icon={Wallet}
                value={`€${totalMargen.toLocaleString('es-ES')}`}
                label="Margen Total"
                progress={(totalMargen / (objectivesMap.margen * 9)) * 100}
                target={`€${(objectivesMap.margen * 9).toLocaleString('es-ES')}`}
                color="#22C55E"
                delay={2}
              />
              <StatCard
                icon={PieChartIcon}
                value={`${margenPromedio.toFixed(0)}%`}
                label="Margen Promedio"
                progress={margenPromedio}
                target="50%"
                color="#A855F7"
                delay={3}
              />
              <StatCard
                icon={Clock}
                value={`€${totalPending.toLocaleString('es-ES')}`}
                label="Pendiente de Cobro"
                progress={overdueCount > 0 ? 100 : 0}
                target={overdueCount > 0 ? `${overdueCount} vencidas` : 'Al día'}
                color={overdueCount > 0 ? '#EF4444' : '#22C55E'}
                delay={4}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueEvolutionChart data={financialMetrics} />
              <ProjectBreakdownChart data={financialMetrics} />
            </div>

            {/* Alerts and Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialAlertsCard 
                totalPending={totalPending}
                overdueCount={overdueCount}
                marginPercent={margenPromedio}
                monthlyGrowth={monthlyGrowth}
              />
              
              {/* Facturación por Socio */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center gap-2.5">
                  <BarChart3 size={18} className="text-primary" />
                  <h3 className="font-semibold">Top Facturación</h3>
                </div>
                
                <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {sortedByFacturacion.slice(0, 5).map((member, i) => {
                    const facturacion = Number(member.facturacion) || 0;
                    const margen = Number(member.margen) || 0;
                    
                    return (
                      <div 
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background"
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm",
                          i === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-black",
                          i === 1 && "bg-gradient-to-br from-slate-300 to-slate-400 text-black",
                          i === 2 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                          i > 2 && "bg-muted text-muted-foreground"
                        )}>
                          {i + 1}
                        </div>
                        <div 
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                          style={{ background: member.color || '#6366F1' }}
                        >
                          {member.nombre.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{member.nombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-base text-blue-600">€{facturacion.toLocaleString('es-ES')}</p>
                          <p className="text-xs text-green-600">+€{margen.toLocaleString('es-ES')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cobros" className="space-y-6">
            {/* Header with Export Button */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Control de Cobros</h3>
                <p className="text-sm text-muted-foreground">
                  Gestión y seguimiento de pagos
                </p>
              </div>
              <ExportButton
                options={[
                  {
                    label: 'Exportar Pagos Pendientes',
                    type: 'cobros',
                    data: pendingPayments.map(p => ({
                      obv_titulo: p.titulo || p.numero_factura || '',
                      empresa: p.cliente || '',
                      facturacion: p.monto || 0,
                      cobrado: (p.monto || 0) - (p.pendiente || 0),
                      pendiente_cobro: p.pendiente || 0,
                      cobro_estado: p.estado || 'pendiente',
                      cobro_dias_retraso: p.dias_vencido || 0,
                      cobro_fecha_esperada: p.fecha_vencimiento || '',
                      responsable_nombre: p.responsable || '',
                      email_contacto: '',
                      telefono_contacto: '',
                    })),
                    metadata: {
                      title: 'Control de Cobros',
                      currencyColumns: [2, 3, 4], // facturacion, cobrado, pendiente
                    },
                  },
                ]}
                variant="outline"
                size="sm"
              />
            </div>

            {/* Resumen cobros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendiente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{totalPending.toLocaleString('es-ES')}</div>
                </CardContent>
              </Card>
              <Card className={overdueCount > 0 ? "border-destructive" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Facturas Vencidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("text-2xl font-bold", overdueCount > 0 && "text-destructive")}>
                    {overdueCount}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Próximas a Vencer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingPayments.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Pagos vencidos */}
            {overduePayments.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Clock size={18} />
                    Facturas Vencidas ({overduePayments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {overduePayments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <div>
                          <p className="font-medium">{payment.titulo || payment.numero_factura}</p>
                          <p className="text-sm text-muted-foreground">{payment.cliente} - {payment.proyecto_nombre}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive">€{(payment.pendiente || 0).toLocaleString('es-ES')}</p>
                          <p className="text-xs text-destructive">{payment.dias_vencido} días vencida</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Todos los pagos pendientes */}
            <PendingPaymentsCard payments={pendingPayments} />
          </TabsContent>

          <TabsContent value="proyecciones" className="space-y-6">
            {/* AI Forecast Widget */}
            <AIForecastWidget />

            {/* Proyección anual */}
            <Card>
              <CardHeader>
                <CardTitle>Proyección Anual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-muted-foreground">Facturación actual</p>
                    <p className="text-3xl font-bold">€{totalFacturacion.toLocaleString('es-ES')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Meta anual</p>
                    <p className="text-2xl font-semibold text-muted-foreground">€{metaAnual.toLocaleString('es-ES')}</p>
                  </div>
                </div>
                <Progress value={progresoAnual} className="h-4" />
                <p className="text-sm text-muted-foreground text-center">{progresoAnual.toFixed(1)}% completado</p>
              </CardContent>
            </Card>

            {/* Proyección por socio */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso por Socio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedByFacturacion.map(member => {
                    const facturacion = Number(member.facturacion) || 0;
                    const meta = objectivesMap.facturacion;
                    const progreso = (facturacion / meta) * 100;
                    
                    return (
                      <div key={member.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                              style={{ background: member.color || '#6366F1' }}
                            >
                              {member.nombre.charAt(0)}
                            </div>
                            <span className="font-medium">{member.nombre}</span>
                          </div>
                          <span className="text-sm">
                            €{facturacion.toLocaleString('es-ES')} / €{meta.toLocaleString('es-ES')}
                          </span>
                        </div>
                        <Progress value={Math.min(progreso, 100)} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <HelpWidget section="financiero" />
      <FinancieroPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}
