import { useMemo } from 'react';
import { BookOpen, Trophy, Users, Crown, Diamond, Award, Loader2 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { RankingCard } from '@/components/nova/RankingCard';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';

interface KPIsViewProps {
  onNewOBV?: () => void;
}

export function KPIsView({ onNewOBV }: KPIsViewProps) {
  const { data: members = [], isLoading } = useMemberStats();
  const { data: objectives = [] } = useObjectives();

  // Map objectives
  const objectivesMap = useMemo(() => {
    const map: Record<string, number> = {
      lps: 18,
      bps: 66,
      cps: 40,
    };
    objectives.forEach(obj => {
      map[obj.name] = obj.target_value;
    });
    return map;
  }, [objectives]);

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

  const sortedByLPs = [...membersForRanking].sort((a, b) => b.lps - a.lps);
  const sortedByBPs = [...membersForRanking].sort((a, b) => b.bps - a.bps);
  const sortedByCPs = [...membersForRanking].sort((a, b) => b.cps - a.cps);

  // Calculate totals
  const totalLPs = members.reduce((sum, m) => sum + (Number(m.lps) || 0), 0);
  const totalBPs = members.reduce((sum, m) => sum + (Number(m.bps) || 0), 0);
  const totalCPs = members.reduce((sum, m) => sum + (Number(m.cps) || 0), 0);

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
        title="Otros KPIs" 
        subtitle="Learning Paths, Book Points y Community Points" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in delay-1" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-warning/20 flex items-center justify-center">
                <BookOpen size={20} className="text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLPs}</p>
                <p className="text-sm text-muted-foreground">Learning Paths</p>
              </div>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-warning rounded-full transition-all"
                style={{ width: `${(totalLPs / (objectivesMap.lps * 9)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {objectivesMap.lps * 9} LPs
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in delay-2" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-success/20 flex items-center justify-center">
                <Trophy size={20} className="text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalBPs}</p>
                <p className="text-sm text-muted-foreground">Book Points</p>
              </div>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${(totalBPs / (objectivesMap.bps * 9)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {objectivesMap.bps * 9} BPs
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 animate-fade-in delay-3" style={{ opacity: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Users size={20} className="text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCPs}</p>
                <p className="text-sm text-muted-foreground">Community Points</p>
              </div>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all"
                style={{ width: `${(totalCPs / (objectivesMap.cps * 9)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {objectivesMap.cps * 9} CPs
            </p>
          </div>
        </div>

        {/* Rankings */}
        <div className="grid grid-cols-3 gap-6">
          <RankingCard
            title="Ranking Learning Paths"
            icon={Crown}
            iconColor="#F59E0B"
            members={sortedByLPs}
            valueKey="lps"
            objective={objectivesMap.lps}
            delay={4}
          />
          <RankingCard
            title="Ranking Book Points"
            icon={Diamond}
            iconColor="#22C55E"
            members={sortedByBPs}
            valueKey="bps"
            objective={objectivesMap.bps}
            delay={5}
          />
          <RankingCard
            title="Ranking Community Points"
            icon={Award}
            iconColor="#EC4899"
            members={sortedByCPs}
            valueKey="cps"
            objective={objectivesMap.cps}
            delay={6}
          />
        </div>
      </div>
    </>
  );
}
