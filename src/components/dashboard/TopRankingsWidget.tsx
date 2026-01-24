import { useMemo, memo } from 'react';
import { Crown, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopMember {
  id: string;
  nombre: string;
  color: string;
  value: number;
}

interface TopRankingsWidgetProps {
  members: Array<{
    id: string;
    nombre: string;
    color: string;
    obvs: number;
    facturacion: number;
    lps: number;
  }>;
}

function TopRankingsWidgetComponent({ members }: TopRankingsWidgetProps) {
  const topByOBVs = useMemo(
    () => [...members].sort((a, b) => b.obvs - a.obvs).slice(0, 3),
    [members]
  );

  const topByFacturacion = useMemo(
    () => [...members].sort((a, b) => b.facturacion - a.facturacion).slice(0, 3),
    [members]
  );

  const topByLPs = useMemo(
    () => [...members].sort((a, b) => b.lps - a.lps).slice(0, 3),
    [members]
  );

  const renderPodium = (
    items: TopMember[], 
    formatValue: (v: number) => string,
    icon: React.ReactNode
  ) => (
    <div className="flex items-end justify-center gap-2 h-[120px]">
      {/* Second place */}
      {items[1] && (
        <div className="flex flex-col items-center">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-1"
            style={{ backgroundColor: items[1].color }}
          >
            {items[1].nombre.charAt(0)}
          </div>
          <div className="w-16 h-14 bg-muted/50 rounded-t-lg flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-muted-foreground">2</span>
            <span className="text-[10px] text-muted-foreground">{formatValue(items[1].value)}</span>
          </div>
        </div>
      )}
      
      {/* First place */}
      {items[0] && (
        <div className="flex flex-col items-center">
          <div className="text-warning mb-1">👑</div>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-warning mb-1"
            style={{ backgroundColor: items[0].color }}
          >
            {items[0].nombre.charAt(0)}
          </div>
          <div className="w-20 h-20 bg-gradient-to-b from-warning/20 to-warning/5 rounded-t-lg flex flex-col items-center justify-center border-t-2 border-warning">
            <span className="text-2xl font-bold">1</span>
            <span className="text-xs font-medium">{formatValue(items[0].value)}</span>
          </div>
        </div>
      )}
      
      {/* Third place */}
      {items[2] && (
        <div className="flex flex-col items-center">
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold mb-1"
            style={{ backgroundColor: items[2].color }}
          >
            {items[2].nombre.charAt(0)}
          </div>
          <div className="w-14 h-10 bg-muted/30 rounded-t-lg flex flex-col items-center justify-center">
            <span className="text-base font-bold text-muted-foreground">3</span>
            <span className="text-[10px] text-muted-foreground">{formatValue(items[2].value)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Top OBVs */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <Crown size={16} className="text-warning" />
          <span className="text-sm font-semibold">Top OBVs</span>
        </div>
        {renderPodium(
          topByOBVs.map(m => ({ ...m, value: m.obvs })),
          (v) => `${v}`,
          <Crown size={14} className="text-warning" />
        )}
      </div>

      {/* Top Facturación */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-success" />
          <span className="text-sm font-semibold">Top Facturación</span>
        </div>
        {renderPodium(
          topByFacturacion.map(m => ({ ...m, value: m.facturacion })),
          (v) => `€${(v/1000).toFixed(1)}K`,
          <TrendingUp size={14} className="text-success" />
        )}
      </div>

      {/* Top LPs */}
      <div className="bg-card border border-border rounded-2xl p-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-primary" />
          <span className="text-sm font-semibold">Top LPs</span>
        </div>
        {renderPodium(
          topByLPs.map(m => ({ ...m, value: m.lps })),
          (v) => `${v}`,
          <BookOpen size={14} className="text-primary" />
        )}
      </div>
    </div>
  );
}

export const TopRankingsWidget = memo(TopRankingsWidgetComponent);
