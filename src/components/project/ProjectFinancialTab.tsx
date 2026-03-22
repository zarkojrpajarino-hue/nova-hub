import { memo } from 'react';
import { TrendingUp, Wallet, PieChart, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/nova/StatCard';
import { KeyMetricsEditor } from './KeyMetricsEditor';

import { useTranslation } from 'react-i18next';
interface ProjectFinancialStats {
  facturacion?: number;
  margen?: number;
  total_obvs?: number;
  leads_ganados?: number;
  total_leads?: number;
}

interface ProjectFinancialTabProps {
  stats: ProjectFinancialStats;
  projectId: string;
}

function ProjectFinancialTabComponent({ stats, projectId }: ProjectFinancialTabProps) {
  const { t } = useTranslation();
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
          label={t('project.facturaciónTotal')}
          progress={0}
          color="#3B82F6"
          delay={1}
        />
        <StatCard
          icon={Wallet}
          value={`€${margen}`}
          label={t('project.margenTotal')}
          progress={0}
          color="#22C55E"
          delay={2}
        />
        <StatCard
          icon={PieChart}
          value={`${margenPercent.toFixed(0)}%`}
          label={t('project.margenPorcentual')}
          progress={margenPercent}
          color="#A855F7"
          delay={3}
        />
      </div>

      {/* Financial Details */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <BarChart3 size={18} className="text-primary" />
          <h3 className="font-semibold">{t('project.resumenFinanciero')}</h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t('project.obvsDeVenta')}</p>
              <p className="text-2xl font-bold">{stats?.total_obvs || 0}</p>
            </div>
            <div className="p-4 bg-background rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t('project.leadsGanados')}</p>
              <p className="text-2xl font-bold text-success">{stats?.leads_ganados || 0}</p>
            </div>
            <div className="p-4 bg-background rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">{t('project.totalLeads')}</p>
              <p className="text-2xl font-bold">{stats?.total_leads || 0}</p>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20">
            <h4 className="font-semibold mb-4 text-success">{t('project.performance')}</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('project.facturación')}</span>
                <span className="font-bold">€{facturacion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('project.costes')}</span>
                <span className="font-medium">€{(facturacion - margen).toFixed(0)}</span>
              </div>
              <div className="border-t border-success/20 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">{t('project.margenBruto')}</span>
                  <span className="font-bold text-success text-lg">€{margen}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Editor — MRR mensual para Phase 3 Engine */}
      <KeyMetricsEditor projectId={projectId} />
    </div>
  );
}

export const ProjectFinancialTab = memo(ProjectFinancialTabComponent);
