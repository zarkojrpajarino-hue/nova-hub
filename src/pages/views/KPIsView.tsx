import { BookOpen, Trophy, Users, Crown, Diamond, Award } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { RankingCard } from '@/components/nova/RankingCard';
import { Member, OBJECTIVES } from '@/data/mockData';

interface KPIsViewProps {
  members: Member[];
  onNewOBV?: () => void;
}

export function KPIsView({ members, onNewOBV }: KPIsViewProps) {
  const sortedByLPs = [...members].sort((a, b) => b.lps - a.lps);
  const sortedByBPs = [...members].sort((a, b) => b.bps - a.bps);
  const sortedByCPs = [...members].sort((a, b) => b.cps - a.cps);

  // Calculate totals
  const totalLPs = members.reduce((sum, m) => sum + m.lps, 0);
  const totalBPs = members.reduce((sum, m) => sum + m.bps, 0);
  const totalCPs = members.reduce((sum, m) => sum + m.cps, 0);

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
                style={{ width: `${(totalLPs / (OBJECTIVES.lps * 9)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {OBJECTIVES.lps * 9} LPs
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
                style={{ width: `${(totalBPs / (OBJECTIVES.bps * 9)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {OBJECTIVES.bps * 9} BPs
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
                style={{ width: `${(totalCPs / (OBJECTIVES.cps * 9)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Meta: {OBJECTIVES.cps * 9} CPs
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
            objective={OBJECTIVES.lps}
            delay={4}
          />
          <RankingCard
            title="Ranking Book Points"
            icon={Diamond}
            iconColor="#22C55E"
            members={sortedByBPs}
            valueKey="bps"
            objective={OBJECTIVES.bps}
            delay={5}
          />
          <RankingCard
            title="Ranking Community Points"
            icon={Award}
            iconColor="#EC4899"
            members={sortedByCPs}
            valueKey="cps"
            objective={OBJECTIVES.cps}
            delay={6}
          />
        </div>
      </div>
    </>
  );
}
