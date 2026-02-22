/**
 * FOUNDER METRICS DASHBOARD
 *
 * Dashboard central con todas las métricas clave en una vista
 * - MRR, CAC, LTV, Churn, Runway
 * - Gráficos interactivos
 * - Alerts de red flags
 * - Comparación vs goals
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Calendar,
  Target,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage change
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  alert?: string;
}

function MetricCard({ title, value, change, icon, trend, alert }: MetricCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            <span>{change > 0 ? '+' : ''}{change}% vs last month</span>
          </div>
        )}
        {alert && (
          <Alert className="mt-2 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-xs text-red-800">{alert}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface KeyMetric {
  id: string;
  project_id: string;
  date: string;
  mrr: number;
  total_customers: number;
  cac?: number;
  ltv?: number;
  churn_rate?: number;
  runway_months?: number;
  [key: string]: unknown;
}

interface MetricAlert {
  id: string;
  project_id: string;
  metric: string;
  message: string;
  severity: string;
  acknowledged: boolean;
}

export function FounderMetricsDashboard({ projectId }: { projectId: string }) {
  const [metrics, setMetrics] = useState<KeyMetric | null>(null);
  const [history, setHistory] = useState<KeyMetric[]>([]);
  const [alerts, setAlerts] = useState<MetricAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      // Get latest metrics
      const { data: latestMetric } = await supabase
        .from('key_metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Get history (last 12 months)
      const { data: historyData } = await supabase
        .from('key_metrics')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false })
        .limit(12);

      // Get active alerts
      const { data: alertsData } = await supabase
        .from('metric_alerts')
        .select('*')
        .eq('project_id', projectId)
        .eq('acknowledged', false)
        .order('created_at', { ascending: false });

      setMetrics(latestMetric);
      setHistory(historyData?.reverse() || []);
      setAlerts(alertsData || []);
      setLoading(false);
    }

    loadData();
  }, [projectId, supabase]);

  if (loading) {
    return <div className="p-8 text-center">Loading metrics...</div>;
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No metrics data yet. Start tracking your business metrics!</p>
      </div>
    );
  }

  // Calculate changes (vs previous month)
  const prevMetrics = history[history.length - 2];
  const mrrChange = prevMetrics ? ((metrics.mrr - prevMetrics.mrr) / prevMetrics.mrr) * 100 : 0;
  const customerChange = prevMetrics
    ? ((metrics.total_customers - prevMetrics.total_customers) / prevMetrics.total_customers) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={`border-${alert.severity === 'critical' ? 'red' : 'yellow'}-200`}>
              <AlertTriangle className={`h-4 w-4 text-${alert.severity === 'critical' ? 'red' : 'yellow'}-600`} />
              <AlertDescription>
                <span className="font-semibold">{alert.metric}:</span> {alert.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="MRR"
          value={`$${metrics.mrr.toLocaleString()}`}
          change={mrrChange}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          trend={mrrChange > 0 ? 'up' : mrrChange < 0 ? 'down' : 'neutral'}
        />

        <MetricCard
          title="Total Customers"
          value={metrics.total_customers}
          change={customerChange}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          trend={customerChange > 0 ? 'up' : customerChange < 0 ? 'down' : 'neutral'}
        />

        <MetricCard
          title="Churn Rate"
          value={`${metrics.churn_rate.toFixed(1)}%`}
          icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
          trend={metrics.churn_rate > 5 ? 'down' : 'neutral'}
          alert={metrics.churn_rate > 10 ? 'Churn >10% is critical for SaaS' : undefined}
        />

        <MetricCard
          title="Runway"
          value={`${metrics.runway_months} months`}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          trend={metrics.runway_months < 6 ? 'down' : 'neutral'}
          alert={metrics.runway_months < 6 ? 'Runway <6 months - start fundraising now' : undefined}
        />
      </div>

      {/* Unit Economics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.cac}</div>
            <p className="text-xs text-muted-foreground mt-1">Customer Acquisition Cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.ltv}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">LTV / CAC Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ltv_cac_ratio.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.ltv_cac_ratio >= 3 ? '✅ Healthy (>3x)' : '⚠️ Low (<3x)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* MRR Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>MRR Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="mrr" stroke="#2563EB" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-md border">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="font-medium">Update this week's metrics</span>
            </div>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-md border">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Ask AI Advisor a question</span>
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
