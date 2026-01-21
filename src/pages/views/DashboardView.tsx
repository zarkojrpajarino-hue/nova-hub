import { useMemo } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { WeeklyEvolutionChart } from '@/components/dashboard/WeeklyEvolutionChart';
import { TopRankingsWidget } from '@/components/dashboard/TopRankingsWidget';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { PendingValidationsWidget } from '@/components/dashboard/PendingValidationsWidget';
import { SmartAlertsWidget } from '@/components/dashboard/SmartAlertsWidget';

interface DashboardViewProps {
  onNewOBV?: () => void;
}

export function DashboardView({ onNewOBV }: DashboardViewProps) {
  const { data: members = [], isLoading: loadingMembers } = useMemberStats();
  const { data: objectives = [] } = useObjectives();

  // Map objectives to easily accessible format
  const objectivesMap = useMemo(() => {
    const map: Record<string, number> = {
      obvs: 150,
      lps: 18,
      bps: 66,
      cps: 40,
      facturacion: 15000,
      margen: 7500,
    };
    objectives.forEach(obj => {
      map[obj.name] = obj.target_value;
    });
    return map;
  }, [objectives]);

  const totals = useMemo(() => {
    return members.reduce((acc, m) => ({
      obvs: acc.obvs + (Number(m.obvs) || 0),
      lps: acc.lps + (Number(m.lps) || 0),
      bps: acc.bps + (Number(m.bps) || 0),
      cps: acc.cps + (Number(m.cps) || 0),
      facturacion: acc.facturacion + (Number(m.facturacion) || 0),
      margen: acc.margen + (Number(m.margen) || 0),
    }), { obvs: 0, lps: 0, bps: 0, cps: 0, facturacion: 0, margen: 0 });
  }, [members]);

  // Team objectives (9 members)
  const teamObjectives = {
    obvs: objectivesMap.obvs * 9,
    lps: objectivesMap.lps * 9,
    bps: objectivesMap.bps * 9,
    cps: objectivesMap.cps * 9,
    facturacion: objectivesMap.facturacion * 9,
    margen: objectivesMap.margen * 9,
  };

  // Transform members for widgets
  const membersForRanking = members.map(m => ({
    id: m.id,
    nombre: m.nombre,
    color: m.color || '#6366F1',
    obvs: Number(m.obvs) || 0,
    margen: Number(m.margen) || 0,
    lps: Number(m.lps) || 0,
    bps: Number(m.bps) || 0,
    cps: Number(m.cps) || 0,
    facturacion: Number(m.facturacion) || 0,
  }));

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
        title="Dashboard" 
        subtitle="Vista general del equipo NOVA" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8 space-y-6">
        {/* KPIs Grid */}
        <div className="grid grid-cols-6 gap-4">
          <StatCard 
            icon={FileCheck} 
            value={totals.obvs} 
            label="OBVs Totales" 
            progress={(totals.obvs / teamObjectives.obvs) * 100}
            target={teamObjectives.obvs}
            color="#6366F1"
            delay={1}
          />
          <StatCard 
            icon={BookOpen} 
            value={totals.lps} 
            label="Learning Paths" 
            progress={(totals.lps / teamObjectives.lps) * 100}
            target={teamObjectives.lps}
            color="#F59E0B"
            delay={2}
          />
          <StatCard 
            icon={Trophy} 
            value={totals.bps} 
            label="Book Points" 
            progress={(totals.bps / teamObjectives.bps) * 100}
            target={teamObjectives.bps}
            color="#22C55E"
            delay={3}
          />
          <StatCard 
            icon={Users} 
            value={totals.cps} 
            label="Community Points" 
            progress={(totals.cps / teamObjectives.cps) * 100}
            target={teamObjectives.cps}
            color="#EC4899"
            delay={4}
          />
          <StatCard 
            icon={TrendingUp} 
            value={`€${(totals.facturacion/1000).toFixed(1)}K`} 
            label="Facturación" 
            progress={(totals.facturacion / teamObjectives.facturacion) * 100}
            target={`€${teamObjectives.facturacion/1000}K`}
            color="#3B82F6"
            delay={5}
          />
          <StatCard 
            icon={Wallet} 
            value={`€${(totals.margen/1000).toFixed(1)}K`} 
            label="Margen Bruto" 
            progress={(totals.margen / teamObjectives.margen) * 100}
            target={`€${teamObjectives.margen/1000}K`}
            color="#22C55E"
            delay={6}
          />
        </div>

        {/* Charts & Rankings Row */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <WeeklyEvolutionChart />
          </div>
          <div>
            <SmartAlertsWidget />
          </div>
        </div>

        {/* Top 3 Rankings */}
        <TopRankingsWidget members={membersForRanking} />

        {/* Activity & Validations */}
        <div className="grid grid-cols-2 gap-6">
          <RecentActivityFeed />
          <PendingValidationsWidget />
        </div>
      </div>
    </>
  );
}
