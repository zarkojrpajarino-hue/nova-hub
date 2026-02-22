import { memo } from 'react';
import { TrendingUp, Wallet, PieChart, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/nova/StatCard';

interface ProjectFinancialStats {
  facturacion?: number;
  margen?: number;
  total_obvs?: number;
  leads_ganados?: number;
  total_leads?: number;
}

interface ProjectFinancialTabProps {
  stats: ProjectFinancialStats;
}

export function ProjectFinancialTab({ stats }: ProjectFinancialTabProps) {
  const facturacion = Number(stats?.facturacion) || 0;
  const margen = Number(stats?.margen) || 0;
  const margenPercent = facturacion > 0 ? (margen / facturacion) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          icon={TrendingUp}
          value={`€${facturacion}`}
          label="Facturación Total"
          progress={0}
          color="#3B82F6"
          delay={1}
        />
        <StatCard
          icon={Wallet}
          value={`€${margen}`}
          label="Margen Total"
          progress={0}
          color="#22C55E"
          delay={2}
        />
        <StatCard
          icon={PieChart}
          value={`${margenPercent.toFixed(0)}%`}
          label="Margen Porcentual"
          progress={margenPercent}
          color="#A855F7"
          delay={3}
        />
      </div>

      {/* Financial Details */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <BarChart3 size={18} className="text-primary" />
          <h3 className="font-semibold">Resumen Financiero</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">OBVs de Venta</p>
              <p className="text-2xl font-bold">{stats?.total_obvs || 0}</p>
            </div>
            <div className="p-4 bg-background rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Leads Ganados</p>
              <p className="text-2xl font-bold text-success">{stats?.leads_ganados || 0}</p>
            </div>
            <div className="p-4 bg-background rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Total Leads</p>
              <p className="text-2xl font-bold">{stats?.total_leads || 0}</p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
            <h4 className="font-semibold mb-4 text-success">Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facturación</span>
                <span className="font-bold">€{facturacion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costes</span>
                <span className="font-medium">€{(facturacion - margen).toFixed(0)}</span>
              </div>
              <div className="border-t border-success/20 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Margen Bruto</span>
                  <span className="font-bold text-success text-lg">€{margen}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future charts */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
          <BarChart3 size={28} className="text-muted-foreground" />
        </div>
        <h4 className="font-semibold mb-2">Gráficos de Evolución</h4>
        <p className="text-sm text-muted-foreground">
          Los gráficos de evolución mensual estarán disponibles próximamente
        </p>
      </div>
    </div>
  );
}

// ✨ OPTIMIZADO: Memoizar para evitar re-renders innecesarios
export const ProjectFinancialTab = memo(ProjectFinancialTabComponent);
