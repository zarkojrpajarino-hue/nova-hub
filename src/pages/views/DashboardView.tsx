import { useMemo } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, Crown, Diamond, Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { RankingCard } from '@/components/nova/RankingCard';
import { ActivityCard } from '@/components/nova/ActivityCard';
import { ValidationCard } from '@/components/nova/ValidationCard';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { RECENT_ACTIVITY, PENDING_VALIDATIONS } from '@/data/mockData';

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

  const teamObjectives = {
    obvs: objectivesMap.obvs * 9,
    lps: objectivesMap.lps * 9,
    bps: objectivesMap.bps * 9,
    cps: objectivesMap.cps * 9,
    facturacion: objectivesMap.facturacion * 9,
    margen: objectivesMap.margen * 9,
  };

  // Transform members for RankingCard compatibility
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
    email: m.email,
    avatar: m.avatar,
    exploracion: 0,
    validacion: 0,
    venta: 0,
  }));

  const sortedByOBVs = [...membersForRanking].sort((a, b) => b.obvs - a.obvs);
  const sortedByMargen = [...membersForRanking].sort((a, b) => b.margen - a.margen);

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
      
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-6 gap-4 mb-8">
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

        {/* Rankings */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <RankingCard
            title="Ranking OBVs"
            icon={Crown}
            iconColor="#F59E0B"
            members={sortedByOBVs}
            valueKey="obvs"
            objective={objectivesMap.obvs}
            delay={2}
          />
          <RankingCard
            title="Ranking Margen"
            icon={Diamond}
            iconColor="#A855F7"
            members={sortedByMargen}
            valueKey="margen"
            formatValue={(v) => `€${v.toFixed(0)}`}
            objective={objectivesMap.margen}
            delay={3}
          />
        </div>

        {/* Activity & Validations */}
        <div className="grid grid-cols-2 gap-6">
          <ActivityCard activities={RECENT_ACTIVITY} delay={4} />
          <ValidationCard validations={PENDING_VALIDATIONS.slice(0, 4)} delay={5} />
        </div>
      </div>
    </>
  );
}
