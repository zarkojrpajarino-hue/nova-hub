import { useMemo } from 'react';
import { TrendingUp, Wallet, PieChart as PieChartIcon, BarChart3, Loader2, Clock } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { RevenueEvolutionChart } from '@/components/financiero/RevenueEvolutionChart';
import { ProjectBreakdownChart } from '@/components/financiero/ProjectBreakdownChart';
import { PendingPaymentsCard } from '@/components/financiero/PendingPaymentsCard';
import { FinancialAlertsCard } from '@/components/financiero/FinancialAlertsCard';

interface FinancieroViewProps {
  onNewOBV?: () => void;
}

export function FinancieroView({ onNewOBV }: FinancieroViewProps) {
  const { data: members = [], isLoading: loadingMembers } = useMemberStats();
  const { data: objectives = [] } = useObjectives();
  
  // Fetch financial metrics
  const { data: financialMetrics = [] } = useQuery({
    queryKey: ['financial_metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_metrics')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending payments
  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['pending_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_payments')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Map objectives
  const objectivesMap = useMemo(() => {
    const map: Record<string, number> = {
      facturacion: 15000,
      margen: 7500,
    };
    objectives.forEach(obj => {
      map[obj.name] = obj.target_value;
    });
    return map;
  }, [objectives]);

  const totalFacturacion = members.reduce((sum, m) => sum + (Number(m.facturacion) || 0), 0);
  const totalMargen = members.reduce((sum, m) => sum + (Number(m.margen) || 0), 0);
  const margenPromedio = totalFacturacion > 0 ? (totalMargen / totalFacturacion) * 100 : 0;
  
  // Pending payments stats
  const totalPending = pendingPayments.reduce((sum, p) => sum + (Number(p.pendiente) || 0), 0);
  const overdueCount = pendingPayments.filter(p => (p.dias_vencido || 0) > 0).length;

  // Calculate monthly growth (simplified)
  const monthlyGrowth = useMemo(() => {
    if (financialMetrics.length < 2) return 0;
    const sorted = [...financialMetrics].sort((a, b) => 
      new Date(b.month).getTime() - new Date(a.month).getTime()
    );
    const currentMonth = sorted[0]?.facturacion || 0;
    const previousMonth = sorted[1]?.facturacion || 0;
    if (previousMonth === 0) return 0;
    return ((currentMonth - previousMonth) / previousMonth) * 100;
  }, [financialMetrics]);

  const sortedByFacturacion = [...members].sort((a, b) => 
    (Number(b.facturacion) || 0) - (Number(a.facturacion) || 0)
  );

  if (loadingMembers) {
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
        subtitle="Control de facturación y márgenes" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8 space-y-8">
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
          <RevenueEvolutionChart data={financialMetrics as any} />
          <ProjectBreakdownChart data={financialMetrics as any} />
        </div>

        {/* Alerts and Pending Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialAlertsCard 
            totalPending={totalPending}
            overdueCount={overdueCount}
            marginPercent={margenPromedio}
            monthlyGrowth={monthlyGrowth}
          />
          <PendingPaymentsCard payments={pendingPayments as any} />
        </div>

        {/* Facturación por Socio */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2.5">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-semibold">Facturación por Socio</h3>
          </div>
          
          <div className="p-4 space-y-2">
            {sortedByFacturacion.map((member, i) => {
              const facturacion = Number(member.facturacion) || 0;
              const margen = Number(member.margen) || 0;
              const marginPercent = facturacion > 0 ? (margen / facturacion) * 100 : 0;
              
              return (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Position */}
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm",
                    i === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-black",
                    i === 1 && "bg-gradient-to-br from-slate-300 to-slate-400 text-black",
                    i === 2 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                    i > 2 && "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>

                  {/* Avatar */}
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                    style={{ background: member.color || '#6366F1' }}
                  >
                    {member.nombre.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{member.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Margen: {marginPercent.toFixed(0)}%
                    </p>
                  </div>

                  {/* Values */}
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
    </>
  );
}
