import { TrendingUp, Wallet, PieChart, BarChart3 } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { Member, OBJECTIVES } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface FinancieroViewProps {
  members: Member[];
  onNewOBV?: () => void;
}

export function FinancieroView({ members, onNewOBV }: FinancieroViewProps) {
  const totalFacturacion = members.reduce((sum, m) => sum + m.facturacion, 0);
  const totalMargen = members.reduce((sum, m) => sum + m.margen, 0);
  const margenPromedio = (totalMargen / totalFacturacion) * 100;

  const sortedByFacturacion = [...members].sort((a, b) => b.facturacion - a.facturacion);

  return (
    <>
      <NovaHeader 
        title="Financiero" 
        subtitle="Control de facturación y márgenes" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={TrendingUp}
            value={`€${totalFacturacion.toFixed(0)}`}
            label="Facturación Total"
            progress={(totalFacturacion / (OBJECTIVES.facturacion * 9)) * 100}
            target={`€${OBJECTIVES.facturacion * 9}`}
            color="#3B82F6"
            delay={1}
          />
          <StatCard
            icon={Wallet}
            value={`€${totalMargen.toFixed(0)}`}
            label="Margen Total"
            progress={(totalMargen / (OBJECTIVES.margen * 9)) * 100}
            target={`€${OBJECTIVES.margen * 9}`}
            color="#22C55E"
            delay={2}
          />
          <StatCard
            icon={PieChart}
            value={`${margenPromedio.toFixed(0)}%`}
            label="Margen Promedio"
            progress={margenPromedio}
            target="50%"
            color="#A855F7"
            delay={3}
          />
        </div>

        {/* Facturación por Socio */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in delay-4" style={{ opacity: 0 }}>
          <div className="p-5 border-b border-border flex items-center gap-2.5">
            <BarChart3 size={18} className="text-primary" />
            <h3 className="font-semibold">Facturación por Socio</h3>
          </div>
          
          <div className="p-4 space-y-2">
            {sortedByFacturacion.map((member, i) => {
              const marginPercent = (member.margen / member.facturacion) * 100;
              
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
                    style={{ background: member.color }}
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
                    <p className="font-bold text-base text-info">€{member.facturacion.toFixed(0)}</p>
                    <p className="text-xs text-success">+€{member.margen.toFixed(0)}</p>
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
