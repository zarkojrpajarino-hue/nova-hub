/**
 * DEEP METRICS STEP
 *
 * Métricas profundas para entender health del negocio
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BarChart3, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { DeepMetrics } from '@/types/ultra-onboarding';

interface DeepMetricsStepProps {
  metrics: Partial<DeepMetrics>;
  onChange: (metrics: Partial<DeepMetrics>) => void;
}

export function DeepMetricsStep({ metrics, onChange }: DeepMetricsStepProps) {
  const updateMetric = <K extends keyof DeepMetrics>(
    key: K,
    value: DeepMetrics[K]
  ) => {
    onChange({ ...metrics, [key]: value });
  };

  // Calculations
  const hasRevenue = metrics.mrr !== undefined && metrics.mrr > 0;
  const hasUsers = metrics.total_users !== undefined && metrics.total_users > 0;

  const cac = metrics.cac || 0;
  const ltv = metrics.ltv || 0;
  const ltvCacRatio = ltv && cac ? ltv / cac : 0;

  const churnRate = metrics.monthly_churn_rate || 0;
  const retentionRate = 100 - churnRate;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📊 Deep Metrics</h2>
        <p className="text-gray-600">
          Si ya tienes producto, estas métricas nos ayudan a diagnosticar health
        </p>
      </div>

      {/* Revenue Metrics */}
      {hasRevenue && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mrr">MRR - Monthly Recurring Revenue (€)</Label>
                <Input
                  id="mrr"
                  type="number"
                  placeholder="5000"
                  value={metrics.mrr || ''}
                  onChange={(e) => updateMetric('mrr', parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="arr">ARR - Annual Recurring Revenue (€)</Label>
                <Input
                  id="arr"
                  type="number"
                  placeholder="60000"
                  value={metrics.arr || ''}
                  onChange={(e) => updateMetric('arr', parseInt(e.target.value) || undefined)}
                />
                <p className="text-xs text-gray-700 mt-1">ARR = MRR × 12</p>
              </div>
              <div>
                <Label htmlFor="growth_rate">MoM Growth Rate (%)</Label>
                <Input
                  id="growth_rate"
                  type="number"
                  placeholder="15"
                  value={metrics.growth_rate_mom || ''}
                  onChange={(e) => updateMetric('growth_rate_mom', parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="burn_rate">Monthly Burn Rate (€)</Label>
                <Input
                  id="burn_rate"
                  type="number"
                  placeholder="10000"
                  value={metrics.burn_rate || ''}
                  onChange={(e) => updateMetric('burn_rate', parseInt(e.target.value) || undefined)}
                />
              </div>
            </div>

            {metrics.growth_rate_mom && (
              <div className={`p-3 border rounded-lg ${
                metrics.growth_rate_mom >= 20
                  ? 'bg-green-50 border-green-200'
                  : metrics.growth_rate_mom >= 10
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className={`text-sm ${
                  metrics.growth_rate_mom >= 20
                    ? 'text-green-800'
                    : metrics.growth_rate_mom >= 10
                    ? 'text-blue-800'
                    : 'text-orange-800'
                }`}>
                  <strong>Growth rate:</strong> {metrics.growth_rate_mom >= 20 && '🚀 Excellent growth'}
                  {metrics.growth_rate_mom >= 10 && metrics.growth_rate_mom < 20 && '📈 Solid growth'}
                  {metrics.growth_rate_mom < 10 && '⚠️ Slow growth - diagnostica bottlenecks'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unit Economics */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Unit Economics
          </CardTitle>
          <CardDescription>
            La economía fundamental de tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cac">CAC - Customer Acquisition Cost (€)</Label>
              <Input
                id="cac"
                type="number"
                placeholder="50"
                value={metrics.cac || ''}
                onChange={(e) => updateMetric('cac', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-gray-700 mt-1">Total marketing/sales cost / new customers</p>
            </div>
            <div>
              <Label htmlFor="ltv">LTV - Lifetime Value (€)</Label>
              <Input
                id="ltv"
                type="number"
                placeholder="300"
                value={metrics.ltv || ''}
                onChange={(e) => updateMetric('ltv', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-gray-700 mt-1">Revenue per customer durante su vida</p>
            </div>
            <div>
              <Label htmlFor="gross_margin">Gross Margin (%)</Label>
              <Input
                id="gross_margin"
                type="number"
                placeholder="75"
                value={metrics.gross_margin || ''}
                onChange={(e) => updateMetric('gross_margin', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="payback_period">CAC Payback Period (meses)</Label>
              <Input
                id="payback_period"
                type="number"
                placeholder="6"
                value={metrics.cac_payback_period || ''}
                onChange={(e) => updateMetric('cac_payback_period', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          {/* LTV:CAC Ratio */}
          {ltvCacRatio > 0 && (
            <div className={`p-4 border-2 rounded-lg ${
              ltvCacRatio >= 3
                ? 'bg-green-50 border-green-200'
                : ltvCacRatio >= 1
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {ltvCacRatio >= 3 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className={`font-semibold mb-1 ${
                    ltvCacRatio >= 3 ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    LTV:CAC Ratio: {ltvCacRatio.toFixed(1)}:1
                  </div>
                  <div className={`text-sm ${
                    ltvCacRatio >= 3 ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {ltvCacRatio >= 3 && '✅ Excellent! Ratio saludable (target: 3:1 mínimo)'}
                    {ltvCacRatio >= 1 && ltvCacRatio < 3 && '⚠️ Necesitas mejorar - aumenta LTV o reduce CAC'}
                    {ltvCacRatio < 1 && '🔴 Crítico - pierdes dinero por cada cliente. No escalable.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retention & Churn */}
      {hasUsers && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Retention & Churn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_churn">Monthly Churn Rate (%)</Label>
                <Input
                  id="monthly_churn"
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={metrics.monthly_churn_rate || ''}
                  onChange={(e) => updateMetric('monthly_churn_rate', parseFloat(e.target.value) || undefined)}
                />
                <p className="text-xs text-gray-700 mt-1">% de usuarios que cancelan cada mes</p>
              </div>
              <div>
                <Label htmlFor="nps">NPS - Net Promoter Score</Label>
                <Input
                  id="nps"
                  type="number"
                  placeholder="50"
                  value={metrics.nps || ''}
                  onChange={(e) => updateMetric('nps', parseInt(e.target.value) || undefined)}
                />
                <p className="text-xs text-gray-700 mt-1">-100 a +100 (50+ es excelente)</p>
              </div>
            </div>

            {churnRate > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Retention rate:</strong> {retentionRate.toFixed(1)}% mensual
                  {churnRate <= 2 && ' ✅ Excelente retention'}
                  {churnRate > 2 && churnRate <= 5 && ' 📊 Retention aceptable'}
                  {churnRate > 5 && churnRate <= 10 && ' ⚠️ Churn alto - investiga por qué se van'}
                  {churnRate > 10 && ' 🔴 Churn crítico - problema de PMF o producto'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activation & Engagement */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Activation & Engagement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activation_rate">Activation Rate (%)</Label>
              <Input
                id="activation_rate"
                type="number"
                placeholder="40"
                value={metrics.activation_rate || ''}
                onChange={(e) => updateMetric('activation_rate', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-gray-700 mt-1">% de signups que llegan a "aha moment"</p>
            </div>
            <div>
              <Label htmlFor="dau_mau">DAU/MAU Ratio (%)</Label>
              <Input
                id="dau_mau"
                type="number"
                placeholder="25"
                value={metrics.dau_mau || ''}
                onChange={(e) => updateMetric('dau_mau', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-gray-700 mt-1">Daily Active / Monthly Active Users</p>
            </div>
          </div>

          <div>
            <Label htmlFor="time_to_value">Time to Value</Label>
            <Textarea
              id="time_to_value"
              value={metrics.time_to_value || ''}
              onChange={(e) => updateMetric('time_to_value', e.target.value)}
              placeholder="Ej: '5 minutos desde signup hasta primer resultado' o '24 horas hasta ver beneficio claro'"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Virality */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle>📢 Viral Growth Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="k_factor">K-Factor (viral coefficient)</Label>
            <Input
              id="k_factor"
              type="number"
              step="0.1"
              placeholder="1.2"
              value={metrics.k_factor || ''}
              onChange={(e) => updateMetric('k_factor', parseFloat(e.target.value) || undefined)}
            />
            <p className="text-xs text-gray-700 mt-1">
              Avg invites per user que se convierten. K {'>'} 1 = organic growth
            </p>
          </div>

          <div>
            <Label htmlFor="referral_rate">Referral Rate (%)</Label>
            <Input
              id="referral_rate"
              type="number"
              placeholder="15"
              value={metrics.referral_rate || ''}
              onChange={(e) => updateMetric('referral_rate', parseInt(e.target.value) || undefined)}
            />
            <p className="text-xs text-gray-700 mt-1">% de usuarios que refieren a otros</p>
          </div>

          {metrics.k_factor && (
            <div className={`p-3 border rounded-lg ${
              metrics.k_factor >= 1
                ? 'bg-green-50 border-green-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className={`text-sm ${
                metrics.k_factor >= 1 ? 'text-green-800' : 'text-blue-800'
              }`}>
                {metrics.k_factor >= 1
                  ? '🚀 K > 1: Organic viral growth - cada user trae más de 1 user nuevo'
                  : '📊 K < 1: Necesitas paid acquisition o content marketing para crecer'
                }
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
