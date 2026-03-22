import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, AlertTriangle, DollarSign, PieChart, Activity, Target, Wallet, CreditCard, Building2, Users, Zap, Server, Megaphone, BarChart3, ArrowUpRight, ArrowDownRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface FinancieroPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancieroPreviewModal({ open, onOpenChange }: FinancieroPreviewModalProps) {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: t('preview.dashboardFinancieroEnterprise'),
      subtitle: t('preview.panelDeControlCon'),
      icon: DollarSign,
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      title: t('preview.revenueOverview'),
      subtitle: t('preview.evoluciónDeIngresosRecurrentes'),
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      title: t('preview.expenseBreakdown'),
      subtitle: t('preview.distribuciónDeGastosPor'),
      icon: PieChart,
      gradient: "from-purple-500 to-pink-600"
    },
    {
      title: t('preview.cashFlowAnalysis'),
      subtitle: t('preview.flujoDeCajaCon'),
      icon: Activity,
      gradient: "from-orange-500 to-red-600"
    },
    {
      title: t('preview.profitLoss'),
      subtitle: t('preview.estadoDeResultadosCon'),
      icon: BarChart3,
      gradient: "from-indigo-500 to-purple-600"
    },
    {
      title: "Proyecciones IA",
      subtitle: t('preview.forecastFinancieroParaPróximos'),
      icon: Sparkles,
      gradient: "from-pink-500 to-rose-600"
    },
    {
      title: t('preview.alertasFinancieras'),
      subtitle: t('preview.monitoreoDeBurnRate'),
      icon: AlertTriangle,
      gradient: "from-yellow-500 to-orange-600"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Data for revenue evolution (12 months)
  const revenueData = [
    { month: 'Ene', mrr: 185, arr: 2220, growth: 18.5 },
    { month: 'Feb', mrr: 192, arr: 2304, growth: 3.8 },
    { month: 'Mar', mrr: 198, arr: 2376, growth: 3.1 },
    { month: 'Abr', mrr: 205, arr: 2460, growth: 3.5 },
    { month: 'May', mrr: 212, arr: 2544, growth: 3.4 },
    { month: 'Jun', mrr: 218, arr: 2616, growth: 2.8 },
    { month: 'Jul', mrr: 225, arr: 2700, growth: 3.2 },
    { month: 'Ago', mrr: 230, arr: 2760, growth: 2.2 },
    { month: 'Sep', mrr: 235, arr: 2820, growth: 2.2 },
    { month: 'Oct', mrr: 238, arr: 2856, growth: 1.3 },
    { month: 'Nov', mrr: 242, arr: 2904, growth: 1.7 },
    { month: 'Dic', mrr: 245, arr: 2940, growth: 1.2 }
  ];

  // Expense categories
  const expenseData = [
    { category: t('preview.salariesBenefits'), amount: 142000, percentage: 58, color: 'bg-blue-500', icon: Users },
    { category: t('preview.marketingSales'), amount: 49000, percentage: 20, color: 'bg-purple-500', icon: Megaphone },
    { category: t('preview.infrastructure'), amount: 29400, percentage: 12, color: 'bg-orange-500', icon: Server },
    { category: t('preview.operations'), amount: 24500, percentage: 10, color: 'bg-green-500', icon: Building2 }
  ];

  // Cash flow data
  const cashFlowData = [
    { label: t('preview.startingBalance'), value: 850000, type: 'start' },
    { label: t('preview.revenue'), value: 245000, type: 'income' },
    { label: t('preview.operatingExpenses'), value: -244900, type: 'expense' },
    { label: t('preview.netCashFlow1'), value: 850100, type: 'end' }
  ];

  // P&L quarterly comparison
  const plData = [
    { item: t('preview.revenue'), q3: 672000, q4: 725000, change: 7.9, trend: 'up' },
    { item: t('preview.costOfRevenue'), q3: 221760, q4: 232000, change: 4.6, trend: 'up' },
    { item: t('preview.grossProfit'), q3: 450240, q4: 493000, change: 9.5, trend: 'up' },
    { item: t('preview.operatingExpenses'), q3: 720000, q4: 734700, change: 2.0, trend: 'up' },
    { item: t('preview.netIncome'), q3: -269760, q4: -241700, change: 10.4, trend: 'up' },
  ];

  // Projections data
  const projectionData = [
    { month: 'Ene 26', projected: 248000, confidence: 95, scenario: 'conservative' },
    { month: 'Feb 26', projected: 255000, confidence: 92, scenario: 'conservative' },
    { month: 'Mar 26', projected: 263000, confidence: 88, scenario: 'base' },
    { month: 'Abr 26', projected: 272000, confidence: 85, scenario: 'base' },
    { month: 'May 26', projected: 282000, confidence: 80, scenario: 'optimistic' },
    { month: 'Jun 26', projected: 293000, confidence: 75, scenario: 'optimistic' }
  ];

  // Financial alerts
  const alerts = [
    {
      type: 'warning',
      title: t('preview.burnRateElevado'),
      message: t('preview.gastoMensualNetoDe'),
      metric: '€244.9K/mes',
      status: t('preview.monitorear')
    },
    {
      type: 'info',
      title: t('preview.presupuestoMarketing'),
      message: t('preview.utilizado82DelPresupuesto'),
      metric: '82% usado',
      status: t('preview.atención')
    },
    {
      type: 'success',
      title: t('preview.grossMarginSaludable'),
      message: t('preview.margenBrutoDe68'),
      metric: '68%',
      status: t('preview.óptimo')
    },
    {
      type: 'warning',
      title: t('preview.cacPaybackPeriod'),
      message: t('preview.tiempoDeRecuperación18'),
      metric: '18 meses',
      status: t('preview.revisar')
    }
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.mrr));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <VisuallyHidden>
          <DialogTitle>{t('preview.financieroPreview')}</DialogTitle>
          <DialogDescription>{t('preview.interactivePreviewOfThe')}</DialogDescription>
        </VisuallyHidden>
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-white/10">
            <div className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              slides[currentSlide].gradient
            )}>
              {slides[currentSlide].icon && (() => {
                const IconComponent = slides[currentSlide].icon;
                return <IconComponent className="w-5 h-5 text-white" />;
              })()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{slides[currentSlide].title}</h2>
              <p className="text-sm text-slate-400">{slides[currentSlide].subtitle}</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-8 max-h-[calc(85vh-160px)]">
            {/* Slide 0: Dashboard Overview */}
            {currentSlide === 0 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>+23.5%</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">€245K</div>
                    <div className="text-sm text-slate-400">{t('preview.mrrActual')}</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <div className="flex items-center gap-1 text-blue-400 text-sm">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>+5.2%</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">€2.94M</div>
                    <div className="text-sm text-slate-400">ARR</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <PieChart className="w-5 h-5 text-purple-400" />
                      <div className="flex items-center gap-1 text-purple-400 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>+3.0%</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">68%</div>
                    <div className="text-sm text-slate-400">{t('preview.grossMargin')}</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Wallet className="w-5 h-5 text-orange-400" />
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>-€245K</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">42m</div>
                    <div className="text-sm text-slate-400">{t('preview.runway')}</div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">2,847</div>
                        <div className="text-sm text-slate-400">{t('preview.totalCustomers')}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{t('preview.churnRate')}</span>
                      <span className="text-green-400 font-medium">2.3%</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">€86</div>
                        <div className="text-sm text-slate-400">ARPU</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">vs. Last Month</span>
                      <span className="text-green-400 font-medium">+€2.50</span>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-white">€1,245</div>
                        <div className="text-sm text-slate-400">LTV</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{t('preview.ltvcacRatio')}</span>
                      <span className="text-green-400 font-medium">3.2:1</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('preview.actividadReciente')}</h3>
                  <div className="space-y-3">
                    {[
                      { action: t('preview.nuevoContratoEnterpriseCerrado'), amount: '+€12,500 MRR', time: t('preview.hace2Horas'), icon: TrendingUp, color: 'text-green-400' },
                      { action: 'Pago procesado - Invoice #2847', amount: '€8,750', time: t('preview.hace4Horas'), icon: DollarSign, color: 'text-blue-400' },
                      { action: 'Downgrade de plan - Customer #1923', amount: '-€250 MRR', time: t('preview.hace6Horas'), icon: TrendingDown, color: 'text-red-400' },
                      { action: t('preview.aprobadoPresupuestoQ1Marketing'), amount: '€147,000', time: t('preview.hace8Horas'), icon: Megaphone, color: 'text-purple-400' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center", item.color)}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{item.action}</div>
                            <div className="text-xs text-slate-400">{item.time}</div>
                          </div>
                        </div>
                        <div className={cn("text-sm font-semibold", item.color)}>{item.amount}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 1: Revenue Overview */}
            {currentSlide === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.mrrActual')}</div>
                    <div className="text-3xl font-bold text-white mb-2">€245K</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+23.5% YoY</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">ARR</div>
                    <div className="text-3xl font-bold text-white mb-2">€2.94M</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+32.4% YoY</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.crecimientoPromedio')}</div>
                    <div className="text-3xl font-bold text-white mb-2">3.1%</div>
                    <div className="text-sm text-slate-400">{t('preview.porMes')}</div>
                  </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Evolución MRR (12 meses)</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-slate-400">MRR</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm text-slate-400">Growth %</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-80 flex items-end justify-between gap-2">
                    {revenueData.map((item, i) => {
                      const height = (item.mrr / maxRevenue) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                          <div className="text-xs font-medium text-green-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            +{item.growth}%
                          </div>
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg hover:from-blue-400 hover:to-cyan-300 transition-all relative"
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-t-lg"></div>
                          </div>
                          <div className="text-xs text-slate-400 mt-2">{item.month}</div>
                          <div className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            €{item.mrr}K
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.desglosePorTipoDe')}</h4>
                    <div className="space-y-3">
                      {[
                        { plan: t('preview.enterprise'), mrr: 127750, percentage: 52, color: 'bg-blue-500' },
                        { plan: t('preview.professional'), mrr: 73500, percentage: 30, color: 'bg-purple-500' },
                        { plan: t('preview.starter'), mrr: 43750, percentage: 18, color: 'bg-cyan-500' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{item.plan}</span>
                            <span className="text-sm font-semibold text-white">€{(item.mrr / 1000).toFixed(1)}K ({item.percentage}%)</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.métricasDeCrecimiento')}</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">{t('preview.nuevosClientes')}</span>
                        <span className="text-sm font-semibold text-green-400">+184 este mes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Expansion MRR</span>
                        <span className="text-sm font-semibold text-blue-400">€12,400</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Churn MRR</span>
                        <span className="text-sm font-semibold text-red-400">-€5,635</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Net New MRR</span>
                        <span className="text-sm font-semibold text-emerald-400">€9,765</span>
                      </div>
                      <div className="pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">{t('preview.quickRatio')}</span>
                          <span className="text-lg font-bold text-emerald-400">3.2x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Expense Breakdown */}
            {currentSlide === 2 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-4 gap-4">
                  {expenseData.map((expense, i) => (
                    <div key={i} className={cn("border rounded-xl p-6", `${expense.color}/20 border-${expense.color.replace('bg-', '')}/30`)}>
                      <div className="flex items-center gap-2 mb-2">
                        <expense.icon className="w-5 h-5" style={{ color: expense.color.replace('bg-', '') }} />
                        <div className="text-sm text-slate-400">{expense.category}</div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">€{(expense.amount / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-slate-400">{expense.percentage}% del total</div>
                    </div>
                  ))}
                </div>

                {/* Pie Chart Visualization */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">{t('preview.distribuciónDeGastos')}</h3>

                    <div className="relative w-64 h-64 mx-auto">
                      {/* Pie chart simulation */}
                      <svg viewBox="0 0 200 200" className="transform -rotate-90">
                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgb(59 130 246)" strokeWidth="40"
                          strokeDasharray="290 314" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgb(168 85 247)" strokeWidth="40"
                          strokeDasharray="125 479" strokeDashoffset="-290" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgb(249 115 22)" strokeWidth="40"
                          strokeDasharray="75 529" strokeDashoffset="-415" />
                        <circle cx="100" cy="100" r="80" fill="none" stroke="rgb(34 197 94)" strokeWidth="40"
                          strokeDasharray="63 541" strokeDashoffset="-490" />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-3xl font-bold text-white">€245K</div>
                        <div className="text-sm text-slate-400">{t('preview.totalMensual')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">{t('preview.detallePorCategoría')}</h3>
                    <div className="space-y-4">
                      {expenseData.map((expense, i) => (
                        <div key={i} className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", `${expense.color}/20`)}>
                                <expense.icon className="w-5 h-5" style={{ color: expense.color.replace('bg-', '') }} />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{expense.category}</div>
                                <div className="text-xs text-slate-400">{expense.percentage}% del presupuesto</div>
                              </div>
                            </div>
                            <div className="text-lg font-bold text-white">€{(expense.amount / 1000).toFixed(1)}K</div>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", expense.color)} style={{ width: `${expense.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Monthly Comparison */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{t('preview.comparativaMensual')}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { month: t('preview.octubre'), total: 238500, change: -2.3 },
                      { month: t('preview.noviembre'), total: 242100, change: 1.5 },
                      { month: t('preview.diciembre'), total: 244900, change: 1.2 }
                    ].map((item, i) => (
                      <div key={i} className="p-4 rounded-lg bg-white/5">
                        <div className="text-sm text-slate-400 mb-1">{item.month}</div>
                        <div className="text-2xl font-bold text-white mb-2">€{(item.total / 1000).toFixed(1)}K</div>
                        <div className={cn("flex items-center gap-1 text-sm", item.change > 0 ? 'text-red-400' : 'text-green-400')}>
                          {item.change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{Math.abs(item.change)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Cash Flow Analysis */}
            {currentSlide === 3 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.ingresos')}</div>
                    <div className="text-3xl font-bold text-white mb-2">€245K</div>
                    <div className="text-sm text-green-400">{t('preview.cashIn')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-rose-600/20 border border-red-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.gastos')}</div>
                    <div className="text-3xl font-bold text-white mb-2">€244.9K</div>
                    <div className="text-sm text-red-400">{t('preview.cashOut')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.flujoNeto')}</div>
                    <div className="text-3xl font-bold text-white mb-2">€100</div>
                    <div className="text-sm text-blue-400">{t('preview.netCashFlow')}</div>
                  </div>
                </div>

                {/* Waterfall Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Análisis de Flujo de Caja (Waterfall)</h3>

                  <div className="relative h-96 px-4">
                    <div className="h-full flex items-end justify-between gap-8">
                      {cashFlowData.map((item, i) => {
                        const isStart = item.type === 'start';
                        const isEnd = item.type === 'end';
                        const isIncome = item.type === 'income';
                        const heightPercent = (Math.abs(item.value) / 850000) * 100;

                        return (
                          <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                            <div className="text-sm font-semibold text-white mb-2">
                              €{(item.value / 1000).toFixed(0)}K
                            </div>
                            <div
                              className={cn(
                                "w-full rounded-lg relative transition-all hover:opacity-90",
                                isStart || isEnd ? "bg-gradient-to-t from-blue-500 to-cyan-400" :
                                isIncome ? "bg-gradient-to-t from-green-500 to-emerald-400" :
                                "bg-gradient-to-t from-red-500 to-rose-400"
                              )}
                              style={{ height: `${heightPercent}%` }}
                            >
                              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-lg"></div>
                            </div>
                            <div className="text-xs text-slate-400 text-center mt-2">{item.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cash Flow Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.ingresosPorFuente')}</h4>
                    <div className="space-y-3">
                      {[
                        { source: 'Suscripciones MRR', amount: 245000, percentage: 92 },
                        { source: t('preview.setupFees'), amount: 12500, percentage: 5 },
                        { source: t('preview.serviciosProfesionales'), amount: 8000, percentage: 3 }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{item.source}</span>
                            <span className="text-sm font-semibold text-green-400">€{(item.amount / 1000).toFixed(1)}K</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.balanceYLiquidez')}</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">{t('preview.balanceInicial')}</span>
                        <span className="text-sm font-semibold text-white">€850K</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">{t('preview.balanceFinal')}</span>
                        <span className="text-sm font-semibold text-white">€850.1K</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">{t('preview.burnRateMensual')}</span>
                        <span className="text-sm font-semibold text-orange-400">€244.9K</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">{t('preview.runwayActual')}</span>
                        <span className="text-sm font-semibold text-blue-400">42 meses</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 4: Profit & Loss */}
            {currentSlide === 4 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">Revenue Q4</div>
                    <div className="text-3xl font-bold text-white mb-2">€725K</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+7.9% vs Q3</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">Gross Profit Q4</div>
                    <div className="text-3xl font-bold text-white mb-2">€493K</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>68% margin</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">Net Income Q4</div>
                    <div className="text-3xl font-bold text-white mb-2">-€241.7K</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>+10.4% improvement</span>
                    </div>
                  </div>
                </div>

                {/* P&L Table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-semibold text-white">{t('preview.estadoDeResultadosComparativa')}</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">{t('preview.concepto')}</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Q3 2025</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Q4 2025</th>
                          <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">{t('preview.cambio')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plData.map((item, i) => {
                          const isRevenue = item.item === t('preview.revenue');
                          const isGrossProfit = item.item === t('preview.grossProfit');
                          const isNetIncome = item.item === t('preview.netIncome');
                          const isBold = isRevenue || isGrossProfit || isNetIncome;

                          return (
                            <tr key={i} className={cn(
                              "border-b border-white/5 hover:bg-white/5 transition-colors",
                              isBold && "bg-white/5 font-semibold"
                            )}>
                              <td className={cn("py-4 px-6 text-sm", isBold ? "text-white font-semibold" : "text-slate-300")}>
                                {item.item}
                              </td>
                              <td className="py-4 px-6 text-sm text-right text-white">
                                {item.q3 < 0 ? '-' : ''}€{Math.abs(item.q3 / 1000).toFixed(0)}K
                              </td>
                              <td className="py-4 px-6 text-sm text-right text-white">
                                {item.q4 < 0 ? '-' : ''}€{Math.abs(item.q4 / 1000).toFixed(0)}K
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className={cn(
                                  "inline-flex items-center gap-1 text-sm font-medium",
                                  item.trend === 'up' && !item.item.includes(t('preview.expense')) && !item.item.includes(t('preview.cost')) ? 'text-green-400' :
                                  item.trend === 'up' ? 'text-red-400' : 'text-green-400'
                                )}>
                                  {item.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                  <span>{item.change}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.márgenes')}</h4>
                    <div className="space-y-4">
                      {[
                        { label: t('preview.grossMargin2'), value: 68, target: 65, color: 'bg-green-500' },
                        { label: t('preview.operatingMargin'), value: -33, target: -20, color: 'bg-orange-500' },
                        { label: t('preview.netMargin'), value: -33.3, target: -15, color: 'bg-red-500' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{item.value}%</span>
                              <span className="text-xs text-slate-400">(Target: {item.target}%)</span>
                            </div>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", item.color)} style={{ width: `${Math.abs(item.value)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.análisisDeRentabilidad')}</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">EBITDA Q4</span>
                        <span className="text-sm font-semibold text-white">-€215K</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">{t('preview.pathToProfitability')}</span>
                        <span className="text-sm font-semibold text-orange-400">8 meses</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">Break-even MRR</span>
                        <span className="text-sm font-semibold text-blue-400">€280K</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <span className="text-sm text-slate-400">Rule of 40</span>
                        <span className="text-sm font-semibold text-purple-400">-9.8</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 5: Proyecciones IA */}
            {currentSlide === 5 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-pink-500/20 to-rose-600/20 border border-pink-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6 text-pink-400" />
                    <h3 className="text-lg font-semibold text-white">Forecast Financiero con IA</h3>
                  </div>
                  <p className="text-sm text-slate-400">{t('preview.proyeccionesParaLosPróximos')}</p>
                </div>

                {/* Projection Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">Proyección Jun 26</div>
                    <div className="text-3xl font-bold text-white mb-2">€293K</div>
                    <div className="flex items-center gap-1 text-blue-400 text-sm">
                      <Sparkles className="w-4 h-4" />
                      <span>75% confianza</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.crecimientoTotal')}</div>
                    <div className="text-3xl font-bold text-white mb-2">+19.6%</div>
                    <div className="flex items-center gap-1 text-green-400 text-sm">
                      <TrendingUp className="w-4 h-4" />
                      <span>6 meses</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                    <div className="text-sm text-slate-400 mb-1">{t('preview.arrProyectado')}</div>
                    <div className="text-3xl font-bold text-white mb-2">€3.52M</div>
                    <div className="flex items-center gap-1 text-purple-400 text-sm">
                      <Target className="w-4 h-4" />
                      <span>Jun 2026</span>
                    </div>
                  </div>
                </div>

                {/* Projection Chart */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-6">Proyección MRR (6 meses)</h3>

                  <div className="h-80 flex items-end justify-between gap-2">
                    {projectionData.map((item, i) => {
                      const height = (item.projected / 293000) * 100;
                      const confidenceColor = item.confidence >= 90 ? 'from-green-500 to-emerald-400' :
                                             item.confidence >= 80 ? 'from-blue-500 to-cyan-400' :
                                             'from-purple-500 to-pink-400';

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group cursor-pointer">
                          <div className="text-xs font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            {item.confidence}% confianza
                          </div>
                          <div
                            className={cn("w-full bg-gradient-to-t rounded-t-lg hover:opacity-90 transition-all relative", confidenceColor)}
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-t-lg"></div>

                            {/* Dashed lines for lower confidence */}
                            {item.confidence < 85 && (
                              <div className="absolute inset-0 bg-white/20 rounded-t-lg" style={{
                                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                              }}></div>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-2">{item.month}</div>
                          <div className="text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            €{(item.projected / 1000).toFixed(0)}K
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-slate-400">Alta confianza (90%+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-slate-400">Media confianza (80-90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-slate-400">Baja confianza (&lt;80%)</span>
                    </div>
                  </div>
                </div>

                {/* Scenarios */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { scenario: t('preview.conservador'), mrr: 268000, growth: 9.4, color: 'from-orange-500/20 to-red-600/20', border: 'border-orange-500/30' },
                    { scenario: t('preview.baseCase'), mrr: 282000, growth: 15.1, color: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/30' },
                    { scenario: t('preview.optimista'), mrr: 293000, growth: 19.6, color: 'from-emerald-500/20 to-teal-600/20', border: 'border-emerald-500/30' }
                  ].map((item, i) => (
                    <div key={i} className={cn("bg-gradient-to-br border rounded-xl p-6", item.color, item.border)}>
                      <div className="text-sm text-slate-400 mb-3">{item.scenario}</div>
                      <div className="text-2xl font-bold text-white mb-1">€{(item.mrr / 1000).toFixed(0)}K</div>
                      <div className="flex items-center gap-1 text-sm text-white">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{item.growth}% crecimiento</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* IA Insights */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4">Insights del Modelo IA</h4>
                  <div className="space-y-3">
                    {[
                      { insight: t('preview.tendenciaDeCrecimientoSostenida'), confidence: 92 },
                      { insight: t('preview.estacionalidadQ1IndicaAceleración'), confidence: 87 },
                      { insight: t('preview.expansiónMrrDeClientes'), confidence: 94 },
                      { insight: t('preview.reducciónGradualDeChurn'), confidence: 89 }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                        <Sparkles className="w-5 h-5 text-pink-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm text-white mb-1">{item.insight}</div>
                          <div className="text-xs text-slate-400">Confianza: {item.confidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slide 6: Alertas Financieras */}
            {currentSlide === 6 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">{t('preview.sistemaDeAlertasFinancieras')}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{t('preview.monitoreoEnTiempoReal')}</p>
                </div>

                {/* Alert Cards */}
                <div className="grid grid-cols-2 gap-4">
                  {alerts.map((alert, i) => {
                    const alertConfig = {
                      warning: { bg: 'from-yellow-500/20 to-orange-600/20', border: 'border-yellow-500/30', icon: AlertTriangle, iconColor: 'text-yellow-400' },
                      info: { bg: 'from-blue-500/20 to-cyan-600/20', border: 'border-blue-500/30', icon: Activity, iconColor: 'text-blue-400' },
                      success: { bg: 'from-green-500/20 to-emerald-600/20', border: 'border-green-500/30', icon: TrendingUp, iconColor: 'text-green-400' }
                    }[alert.type];

                    const Icon = alertConfig.icon;

                    return (
                      <div key={i} className={cn("bg-gradient-to-br border rounded-xl p-6", alertConfig.bg, alertConfig.border)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-5 h-5", alertConfig.iconColor)} />
                            <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                          </div>
                          <span className={cn("text-xs px-2 py-1 rounded-full",
                            alert.status === t('preview.óptimo') ? 'bg-green-500/20 text-green-400' :
                            alert.status === t('preview.monitorear') ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-orange-500/20 text-orange-400'
                          )}>
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-3">{alert.message}</p>
                        <div className={cn("text-lg font-bold", alertConfig.iconColor)}>{alert.metric}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Key Metrics Monitor */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.métricasDeLiquidez')}</h4>
                    <div className="space-y-4">
                      {[
                        { label: t('preview.cashBalance'), value: '€850.1K', status: 'success', change: '+€100' },
                        { label: t('preview.monthlyBurnRate'), value: '€244.9K', status: 'warning', change: '+€2.8K' },
                        { label: t('preview.runway3'), value: '42 meses', status: 'success', change: t('preview.estable') },
                        { label: t('preview.quickRatio4'), value: '3.2x', status: 'success', change: '+0.1x' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div>
                            <div className="text-sm text-slate-400 mb-1">{item.label}</div>
                            <div className="text-lg font-bold text-white">{item.value}</div>
                          </div>
                          <div className={cn("text-sm font-medium",
                            item.status === 'success' ? 'text-green-400' : 'text-yellow-400'
                          )}>
                            {item.change}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.budgetTracking')}</h4>
                    <div className="space-y-4">
                      {[
                        { category: 'Marketing Q1', spent: 82, budget: 147000, status: 'warning' },
                        { category: 'Engineering Q1', spent: 65, budget: 425000, status: 'success' },
                        { category: 'Sales Q1', spent: 71, budget: 180000, status: 'success' },
                        { category: 'Operations Q1', spent: 58, budget: 73500, status: 'success' }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-white">{item.category}</span>
                            <span className={cn("text-sm font-semibold",
                              item.status === 'warning' ? 'text-yellow-400' : 'text-green-400'
                            )}>
                              {item.spent}% usado
                            </span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full",
                                item.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                              )}
                              style={{ width: `${item.spent}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Alerts Timeline */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-4">{t('preview.historialDeAlertasRecientes')}</h4>
                  <div className="space-y-3">
                    {[
                      { time: t('preview.hace2Horas'), message: t('preview.budgetMarketingAlcanzó80'), type: 'warning' },
                      { time: t('preview.hace5Horas'), message: 'MRR superó target mensual de €242K', type: 'success' },
                      { time: t('preview.hace1Día'), message: 'Gross Margin alcanzó 68%, superando target de 65%', type: 'success' },
                      { time: t('preview.hace2Días'), message: t('preview.cacPaybackPeriodAumentó'), type: 'warning' },
                      { time: t('preview.hace3Días'), message: t('preview.runwaySeMantieneEstable'), type: 'info' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1.5",
                          item.type === 'success' ? 'bg-green-400' :
                          item.type === 'warning' ? 'bg-yellow-400' :
                          'bg-blue-400'
                        )}></div>
                        <div className="flex-1">
                          <div className="text-sm text-white mb-1">{item.message}</div>
                          <div className="text-xs text-slate-400">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                  <h4 className="text-sm font-medium text-white mb-4">{t('preview.accionesRecomendadas')}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { action: 'Revisar presupuesto Marketing Q1', priority: t('preview.alta') },
                      { action: t('preview.optimizarCacPaybackPeriod'), priority: t('preview.media') },
                      { action: t('preview.análisisDeEficienciaOperativa'), priority: t('preview.media') },
                      { action: 'Planificación financiera Q2', priority: t('preview.baja') }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/10">
                        <span className="text-sm text-white">{item.action}</span>
                        <span className={cn("text-xs px-2 py-1 rounded-full font-medium",
                          item.priority === t('preview.alta') ? 'bg-red-500/20 text-red-400' :
                          item.priority === t('preview.media') ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        )}>
                          {item.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />{t('preview.anterior')}</Button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    currentSlide === index
                      ? "bg-white w-8"
                      : "bg-white/30 hover:bg-white/50"
                  )}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={currentSlide === slides.length - 1 ? () => onOpenChange(false) : nextSlide}
              className="text-slate-400 hover:text-white hover:bg-white/10"
            >
              {currentSlide === slides.length - 1 ? (
                <>{t('preview.finalizar')}<CheckCircle2 className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>{t('preview.siguiente')}<ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
