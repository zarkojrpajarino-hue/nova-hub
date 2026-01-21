import { useMemo } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, Crown, Diamond } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { RankingCard } from '@/components/nova/RankingCard';
import { ActivityCard } from '@/components/nova/ActivityCard';
import { ValidationCard } from '@/components/nova/ValidationCard';
import { Member, OBJECTIVES, RECENT_ACTIVITY, PENDING_VALIDATIONS } from '@/data/mockData';

interface DashboardViewProps {
  members: Member[];
  onNewOBV?: () => void;
}

export function DashboardView({ members, onNewOBV }: DashboardViewProps) {
  const totals = useMemo(() => {
    return members.reduce((acc, m) => ({
      obvs: acc.obvs + m.obvs,
      lps: acc.lps + m.lps,
      bps: acc.bps + m.bps,
      cps: acc.cps + m.cps,
      facturacion: acc.facturacion + m.facturacion,
      margen: acc.margen + m.margen,
    }), { obvs: 0, lps: 0, bps: 0, cps: 0, facturacion: 0, margen: 0 });
  }, [members]);

  const teamObjectives = {
    obvs: OBJECTIVES.obvs * 9,
    lps: OBJECTIVES.lps * 9,
    bps: OBJECTIVES.bps * 9,
    cps: OBJECTIVES.cps * 9,
    facturacion: OBJECTIVES.facturacion * 9,
    margen: OBJECTIVES.margen * 9,
  };

  const sortedByOBVs = [...members].sort((a, b) => b.obvs - a.obvs);
  const sortedByMargen = [...members].sort((a, b) => b.margen - a.margen);

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
            objective={OBJECTIVES.obvs}
            delay={2}
          />
          <RankingCard
            title="Ranking Margen"
            icon={Diamond}
            iconColor="#A855F7"
            members={sortedByMargen}
            valueKey="margen"
            formatValue={(v) => `€${v.toFixed(0)}`}
            objective={OBJECTIVES.margen}
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
