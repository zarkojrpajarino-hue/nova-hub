import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle2, Clock, DollarSign, Users, Package, BarChart3, Activity } from 'lucide-react';

import { useTranslation } from 'react-i18next';
interface KPIsPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KPI {
  id: string;
  name: string;
  value: string;
  change: number;
  target: string;
  status: 'good' | 'warning' | 'critical';
  category: string;
  unit?: string;
}

interface Category {
  name: string;
  icon: React.ReactNode;
  color: string;
  metrics: Array<{ label: string; value: string; trend: number }>;
}

interface Goal {
  title: string;
  progress: number;
  target: string;
  current: string;
  deadline: string;
  keyResults: Array<{ kr: string; progress: number }>;
}

export const KPIsPreviewModal: React.FC<KPIsPreviewModalProps> = ({ open, onOpenChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 6;

  const kpis: KPI[] = [
    { id: '1', name: t('preview.monthlyRevenue'), value: '$284,500', change: 12.5, target: '$300K', status: 'good', category: t('preview.financial'), unit: 'USD' },
    { id: '2', name: t('preview.activeUsers'), value: '15,847', change: 8.3, target: '18K', status: 'good', category: t('preview.business'), unit: 'users' },
    { id: '3', name: t('preview.conversionRate'), value: '4.2%', change: -2.1, target: '5%', status: 'warning', category: t('preview.business'), unit: '%' },
    { id: '4', name: t('preview.churnRate'), value: '2.8%', change: -0.5, target: '<3%', status: 'good', category: t('preview.business'), unit: '%' },
    { id: '5', name: t('preview.customerSatisfaction'), value: '4.6/5', change: 0.3, target: '4.5/5', status: 'good', category: t('preview.product'), unit: 'score' },
    { id: '6', name: t('preview.teamProductivity'), value: '92%', change: 5.2, target: '90%', status: 'good', category: t('preview.team'), unit: '%' },
    { id: '7', name: t('preview.deploymentFrequency'), value: '23/week', change: -8.0, target: '25/week', status: 'critical', category: t('preview.team'), unit: 'deploys' },
    { id: '8', name: t('preview.supportResponseTime'), value: '2.3h', change: -15.2, target: '<3h', status: 'good', category: t('preview.product'), unit: 'hours' },
  ];

  const categories: Category[] = [
    {
      name: t('preview.business'),
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'blue',
      metrics: [
        { label: t('preview.totalUsers'), value: '15,847', trend: 8.3 },
        { label: t('preview.newSignups'), value: '1,234', trend: 15.2 },
        { label: t('preview.conversionRate'), value: '4.2%', trend: -2.1 },
        { label: t('preview.churnRate'), value: '2.8%', trend: -0.5 },
        { label: 'LTV', value: '$12,450', trend: 6.8 },
        { label: 'CAC', value: '$450', trend: -3.2 },
      ],
    },
    {
      name: t('preview.product'),
      icon: <Package className="w-5 h-5" />,
      color: 'purple',
      metrics: [
        { label: t('preview.featureAdoption'), value: '68%', trend: 12.4 },
        { label: t('preview.userSatisfaction'), value: '4.6/5', trend: 0.3 },
        { label: t('preview.bugRate'), value: '0.8%', trend: -25.0 },
        { label: t('preview.responseTime'), value: '2.3h', trend: -15.2 },
        { label: t('preview.npsScore'), value: '67', trend: 5.0 },
        { label: t('preview.apiUptime'), value: '99.8%', trend: 0.1 },
      ],
    },
    {
      name: t('preview.team'),
      icon: <Users className="w-5 h-5" />,
      color: 'green',
      metrics: [
        { label: t('preview.productivity'), value: '92%', trend: 5.2 },
        { label: t('preview.velocity'), value: '87 pts', trend: 3.5 },
        { label: t('preview.deploymentFreq'), value: '23/week', trend: -8.0 },
        { label: t('preview.codeReviewTime'), value: '4.2h', trend: -12.0 },
        { label: t('preview.sprintCompletion'), value: '94%', trend: 2.1 },
        { label: t('preview.teamSatisfaction'), value: '8.4/10', trend: 0.8 },
      ],
    },
    {
      name: t('preview.financial'),
      icon: <DollarSign className="w-5 h-5" />,
      color: 'amber',
      metrics: [
        { label: t('preview.monthlyRevenue'), value: '$284.5K', trend: 12.5 },
        { label: t('preview.mrrGrowth'), value: '8.2%', trend: 1.3 },
        { label: t('preview.grossMargin'), value: '72%', trend: 2.0 },
        { label: t('preview.operatingCosts'), value: '$156K', trend: -5.5 },
        { label: t('preview.runway'), value: '18 months', trend: 0 },
        { label: 'ARR', value: '$3.4M', trend: 15.8 },
      ],
    },
  ];

  const goals: Goal[] = [
    {
      title: 'Reach $500K MRR',
      progress: 57,
      current: '$284.5K',
      target: '$500K',
      deadline: 'Q4 2026',
      keyResults: [
        { kr: 'Increase user base to 25K', progress: 63 },
        { kr: t('preview.launchEnterpriseTier'), progress: 45 },
        { kr: 'Reduce churn to <2%', progress: 93 },
      ],
    },
    {
      title: t('preview.productExcellence'),
      progress: 72,
      current: '72%',
      target: '100%',
      deadline: 'Q3 2026',
      keyResults: [
        { kr: t('preview.ship5MajorFeatures'), progress: 60 },
        { kr: 'Achieve NPS >70', progress: 96 },
        { kr: 'Reduce bug rate to <0.5%', progress: 60 },
      ],
    },
    {
      title: t('preview.teamScaleEfficiency'),
      progress: 68,
      current: '68%',
      target: '100%',
      deadline: 'Q4 2026',
      keyResults: [
        { kr: t('preview.hire8Engineers'), progress: 50 },
        { kr: t('preview.deploy30Timesweek'), progress: 77 },
        { kr: t('preview.maintain95Productivity'), progress: 97 },
      ],
    },
  ];

  const alerts = [
    { id: '1', kpi: t('preview.deploymentFrequency'), message: t('preview.belowTargetBy8'), severity: 'critical', time: '2h ago' },
    { id: '2', kpi: t('preview.conversionRate'), message: t('preview.trendingDownReviewFunnel'), severity: 'warning', time: '5h ago' },
    { id: '3', kpi: t('preview.supportResponseTime'), message: t('preview.improvedBy15On'), severity: 'good', time: '1d ago' },
    { id: '4', kpi: t('preview.bugRate'), message: t('preview.decreasedBy25Excellent'), severity: 'good', time: '2d ago' },
    { id: '5', kpi: t('preview.mrrGrowth'), message: t('preview.targetMetContinueCurrent'), severity: 'good', time: '3d ago' },
  ];

  const historicalData = [
    { month: 'Aug', value: 3.8 },
    { month: 'Sep', value: 4.1 },
    { month: 'Oct', value: 4.5 },
    { month: 'Nov', value: 4.3 },
    { month: 'Dec', value: 4.6 },
    { month: 'Jan', value: 4.2 },
    { month: 'Feb', value: 4.0 },
  ];

  if (!open) return null;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500 bg-green-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'critical': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30',
      amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      green: 'text-green-400',
      amber: 'text-amber-400',
    };
    return colors[color] || colors.blue;
  };

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="flex flex-col items-center justify-center text-center px-12">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-blue-500/30">
                <Activity className="w-12 h-12 text-blue-400" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">{t('preview.tusKpisEnTiempo')}</h2>
              <p className="text-xl text-gray-400 max-w-2xl">{t('preview.dashboardCompletoDeIndicadores')}</p>
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-xl w-full">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl font-bold text-white mb-1">24</div>
                <div className="text-sm text-gray-400">{t('preview.kpisTracked')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl font-bold text-white mb-1">4</div>
                <div className="text-sm text-gray-400">{t('preview.categories')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl font-bold text-green-400 mb-1">18</div>
                <div className="text-sm text-gray-400">{t('preview.onTarget')}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl font-bold text-amber-400 mb-1">5</div>
                <div className="text-sm text-gray-400">{t('preview.needAttention')}</div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{t('preview.kpiDashboard')}</h3>
              <p className="text-gray-400">{t('preview.principalesIndicadoresDeRendimiento')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {kpis.map((kpi) => (
                <div
                  key={kpi.id}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-5 border border-gray-700/50 hover:border-gray-600/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-1">{kpi.name}</div>
                      <div className="text-2xl font-bold text-white">{kpi.value}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(kpi.status)}`}>
                      {kpi.status}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {kpi.change > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-sm font-medium ${kpi.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: <span className="text-gray-400">{kpi.target}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${kpi.status === 'good' ? 'bg-green-500' : kpi.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (parseFloat(kpi.value.replace(/[^0-9.]/g, '')) / parseFloat(kpi.target.replace(/[^0-9.]/g, ''))) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{t('preview.categoríasDeKpis')}</h3>
              <p className="text-gray-400">{t('preview.métricasOrganizadasPorÁrea')}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <div
                  key={category.name}
                  className={`bg-gradient-to-br ${getCategoryColor(category.color)} rounded-xl p-5 border`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`${getIconColor(category.color)}`}>
                      {category.icon}
                    </div>
                    <h4 className="text-lg font-semibold text-white">{category.name}</h4>
                  </div>
                  <div className="space-y-3">
                    {category.metrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">{metric.label}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-white">{metric.value}</div>
                          <div className={`flex items-center text-xs ${metric.trend > 0 ? 'text-green-400' : metric.trend < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                            {metric.trend > 0 && <TrendingUp className="w-3 h-3" />}
                            {metric.trend < 0 && <TrendingDown className="w-3 h-3" />}
                            <span>{metric.trend > 0 ? '+' : ''}{metric.trend}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{t('preview.deepDiveConversionRate')}</h3>
              <p className="text-gray-400">{t('preview.análisisHistóricoYProyección')}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">{t('preview.current')}</div>
                <div className="text-2xl font-bold text-white">4.2%</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">-2.1%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">{t('preview.target')}</div>
                <div className="text-2xl font-bold text-white">5.0%</div>
                <div className="text-sm text-gray-500 mt-1">By Q3 2026</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">{t('preview.forecast')}</div>
                <div className="text-2xl font-bold text-white">4.6%</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-400">+9.5%</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Historical Trend (7 Months)</h4>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-400">{t('preview.actual')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-dashed border-green-500 rounded"></div>
                    <span className="text-gray-400">{t('preview.target')}</span>
                  </div>
                </div>
              </div>
              <div className="relative h-64">
                <div className="absolute inset-0 flex items-end justify-between gap-3 px-4">
                  {historicalData.map((data, idx) => {
                    const height = (data.value / 5) * 100;
                    const isTarget = data.value >= 5;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full" style={{ height: '200px' }}>
                          <div
                            className={`absolute bottom-0 w-full rounded-t-lg transition-all ${isTarget ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-white whitespace-nowrap">
                              {data.value}%
                            </div>
                          </div>
                          <div className="absolute bottom-0 w-full h-px border-t-2 border-dashed border-green-500/50" style={{ bottom: '100%' }} />
                        </div>
                        <div className="text-xs text-gray-400">{data.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Goals & Targets (OKRs)</h3>
              <p className="text-gray-400">{t('preview.objetivosClaveYSeguimiento')}</p>
            </div>
            <div className="space-y-4">
              {goals.map((goal, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-5 border border-gray-700/50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-1">{goal.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          <span>{goal.current} / {goal.target}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{goal.deadline}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-white">{goal.progress}%</div>
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-gray-700"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - goal.progress / 100)}`}
                            className="text-blue-500"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {goal.keyResults.map((kr, krIdx) => (
                      <div key={krIdx}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-300">{kr.kr}</div>
                          <div className="text-sm font-semibold text-white">{kr.progress}%</div>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                            style={{ width: `${kr.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="overflow-y-auto px-8 py-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{t('preview.alertasYNotificaciones')}</h3>
              <p className="text-gray-400">{t('preview.kpisQueRequierenAtención')}</p>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const severityConfig = {
                  critical: { icon: AlertTriangle, color: 'red', bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/30' },
                  warning: { icon: AlertTriangle, color: 'amber', bg: 'from-amber-500/20 to-amber-600/20', border: 'border-amber-500/30' },
                  good: { icon: CheckCircle2, color: 'green', bg: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30' },
                };
                const config = severityConfig[alert.severity as keyof typeof severityConfig];
                const Icon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={`bg-gradient-to-br ${config.bg} rounded-xl p-4 border ${config.border}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 text-${config.color}-400`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white">{alert.kpi}</h4>
                          <span className="text-xs text-gray-400">{alert.time}</span>
                        </div>
                        <p className="text-sm text-gray-300">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl p-4 border border-red-500/20">
                <div className="text-2xl font-bold text-red-400 mb-1">1</div>
                <div className="text-sm text-gray-300">{t('preview.critical')}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-xl p-4 border border-amber-500/20">
                <div className="text-2xl font-bold text-amber-400 mb-1">1</div>
                <div className="text-sm text-gray-300">{t('preview.warning')}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-4 border border-green-500/20">
                <div className="text-2xl font-bold text-green-400 mb-1">3</div>
                <div className="text-sm text-gray-300">{t('preview.onTrack')}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">{t('preview.kpisDashboard')}</h2>
          <p className="text-sm text-gray-400">
            Slide {currentSlide + 1} of {totalSlides}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden max-h-[calc(90vh-180px)]">
          {renderSlide()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentSlide === 0
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-white hover:bg-gray-800'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t('preview.previous')}</span>
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all rounded-full ${
                    idx === currentSlide
                      ? 'w-8 h-2 bg-blue-500'
                      : 'w-2 h-2 bg-gray-700 hover:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={currentSlide === totalSlides - 1 ? () => onOpenChange(false) : nextSlide}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-white hover:bg-gray-800"
            >
              {currentSlide === totalSlides - 1 ? (
                <>
                  <span>{t('preview.finish')}</span>
                  <CheckCircle2 className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span>{t('preview.next')}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

