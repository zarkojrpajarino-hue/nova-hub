/**
 * DASHBOARD VIEW - Enterprise Edition
 *
 * Vista principal que consolida métricas de toda la organización.
 * SIN datos demo - Solo datos reales.
 */

import { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, Loader2, AlertTriangle, CheckCircle2, Activity, Plus, Sparkles, ShoppingCart } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { HowItWorks } from '@/components/ui/how-it-works';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';
// S5.2 — Lazy load chart components (recharts is heavy)
const WeeklyEvolutionChart = lazy(() =>
  import('@/components/dashboard/WeeklyEvolutionChart').then(m => ({ default: m.WeeklyEvolutionChart }))
);
import { TopRankingsWidget } from '@/components/dashboard/TopRankingsWidget';
// RecentActivityFeed removed — V4.4.13 (queryFn returns [] always, activity_log table does not exist)
import { PendingValidationsWidget } from '@/components/dashboard/PendingValidationsWidget';
import { SmartAlertsWidget } from '@/components/dashboard/SmartAlertsWidget';
import { EmptyStateDashboard } from '@/components/dashboard/EmptyStateDashboard';
import { HelpWidget } from '@/components/ui/section-help';
import { DashboardPreviewModal } from '@/components/preview/DashboardPreviewModal';
import { OnboardingProgressBanner } from '@/components/onboarding/OnboardingProgressBanner';
import { RegenerationTriggersWidget } from '@/components/onboarding/RegenerationTriggersWidget';
import { GamificationWidget } from '@/components/onboarding/GamificationWidget';
import { OsWindow } from '@/components/ui/os-window';
import { supabase } from '@/integrations/supabase/client';

import { useTranslation } from 'react-i18next';
interface DashboardViewProps {
  onNewOBV?: () => void;
}

export function DashboardView({ onNewOBV }: DashboardViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState<{ progress: number; fastStartCompleted: boolean; deepSetupSections: string[]; onboardingType: string } | null>(null);
  const [userId, setUserId] = useState<string>('');
  const { data: members = [], isLoading: loadingMembers } = useMemberStats();
  const { data: objectives = [] } = useObjectives();

  // Load onboarding progress and user ID
  useEffect(() => {
    const loadOnboardingProgress = async () => {
      if (!projectId) return;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      const { data: project } = await supabase
        .from('projects')
        .select('onboarding_data')
        .eq('id', projectId)
        .single();

      const od = project?.onboarding_data as Record<string, unknown> | null;
      if (od?.fast_start_completed) {
        setOnboardingProgress({
          progress: (od?.onboarding_progress as number) || 25,
          fastStartCompleted: (od?.fast_start_completed as boolean) || false,
          deepSetupSections: (od?.deep_setup_sections as string[]) || [],
          onboardingType: (od?.onboarding_type as string) || 'idea',
        });
      }
    };

    loadOnboardingProgress();
  }, [projectId]);

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

  // Team objectives (calculated from individual targets)
  const teamObjectives = {
    obvs: objectivesMap.obvs * Math.max(members.length, 1),
    lps: objectivesMap.lps * Math.max(members.length, 1),
    bps: objectivesMap.bps * Math.max(members.length, 1),
    cps: objectivesMap.cps * Math.max(members.length, 1),
    facturacion: objectivesMap.facturacion * Math.max(members.length, 1),
    margen: objectivesMap.margen * Math.max(members.length, 1),
  };

  // V4.4.10: Memoize to avoid re-renders of TopRankingsWidget
  const membersForRanking = useMemo(() =>
    members.map(m => ({
      id: m.id,
      nombre: m.nombre,
      color: m.color || '#6366F1',
      obvs: Number(m.obvs) || 0,
      margen: Number(m.margen) || 0,
      lps: Number(m.lps) || 0,
      bps: Number(m.bps) || 0,
      cps: Number(m.cps) || 0,
      facturacion: Number(m.facturacion) || 0,
    })),
    [members]
  );

  // O5.V2.2 — Check if user has zero data
  const hasZeroData = members.length === 0
    && totals.obvs === 0
    && totals.lps === 0
    && totals.facturacion === 0;

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
        title={t('dashboard.dashboard')}
        subtitle={t('dashboard.consolidaMétricasDeProyectos')}
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
        {/* S4.5 — Quick Actions Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(projectId ? `/proyecto/${projectId}/obvs?new=true` : '/tasks?new=true')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors border border-primary/20"
          >
            <Plus size={16} />
            {t('dashboard.quickNewTask')}
          </button>
          <button
            onClick={() => navigate(projectId ? `/proyecto/${projectId}/obvs?new=true` : '/obv-center?new=true')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium transition-colors border border-green-500/20"
          >
            <ShoppingCart size={16} />
            {t('dashboard.quickNewSale')}
          </button>
          <button
            onClick={() => navigate(projectId ? `/proyecto/${projectId}/analisis-ia` : '/ai-analysis')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-sm font-medium transition-colors border border-purple-500/20"
          >
            <Sparkles size={16} />
            {t('dashboard.quickAIAnalysis')}
          </button>
        </div>

        {/* O5.V2.2 — Empty state for Day 1 */}
        {projectId && hasZeroData && (
          <EmptyStateDashboard
            projectId={projectId}
            onNavigate={(path) => navigate(path)}
          />
        )}

        {/* Onboarding Progress Banner */}
        {projectId && onboardingProgress && onboardingProgress.progress < 100 && (
          <OnboardingProgressBanner
            projectId={projectId}
            progress={onboardingProgress.progress}
            fastStartCompleted={onboardingProgress.fastStartCompleted}
            deepSetupSections={onboardingProgress.deepSetupSections}
            onboardingType={onboardingProgress.onboardingType}
          />
        )}
        {/* How it works */}
        <HowItWorks
          title={t('dashboard.cómoFunciona')}
          description={t('dashboard.vistaGeneralConsolidadaDe')}
          whatIsIt={t('dashboard.dashboardPrincipalQueAgrega')}
          onViewPreview={() => setShowPreviewModal(true)}
          dataInputs={[
            {
              from: t('dashboard.todasLasSecciones'),
              items: [
                t('dashboard.centroObvsTotalDe'),
                t('dashboard.crmPipelineValueY'),
                t('dashboard.financieroRevenueYMárgenes'),
                t('dashboard.equipoFitScoresY'),
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'Tú (decisiones)',
              items: [
                t('dashboard.vista360DeLa'),
                t('dashboard.alertasDeProblemasCríticos'),
                t('dashboard.quéPriorizarHoy'),
              ],
            },
          ]}
          nextStep={{
            action: t('dashboard.identificaProblemasOCuellos'),
            destination: 'Navega a la sección específica para profundizar (Proyectos, CRM, etc.)',
          }}
        />

        {/* KPIs Grid */}
        <OsWindow title={t('dashboard.kpisDelEquipo')} icon={TrendingUp} variant="compact">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              icon={FileCheck}
              value={totals.obvs}
              label={t('dashboard.obvsTotales')}
              progress={(totals.obvs / teamObjectives.obvs) * 100}
              target={teamObjectives.obvs}
              color="#6366F1"
              delay={1}
            />
            <StatCard
              icon={BookOpen}
              value={totals.lps}
              label={t('dashboard.learningPaths')}
              progress={(totals.lps / teamObjectives.lps) * 100}
              target={teamObjectives.lps}
              color="#F59E0B"
              delay={2}
            />
            <StatCard
              icon={Trophy}
              value={totals.bps}
              label={t('dashboard.bookPoints')}
              progress={(totals.bps / teamObjectives.bps) * 100}
              target={teamObjectives.bps}
              color="#22C55E"
              delay={3}
            />
            <StatCard
              icon={Users}
              value={totals.cps}
              label={t('dashboard.communityPoints')}
              progress={(totals.cps / teamObjectives.cps) * 100}
              target={teamObjectives.cps}
              color="#EC4899"
              delay={4}
            />
            <StatCard
              icon={TrendingUp}
              value={`€${(totals.facturacion/1000).toFixed(1)}K`}
              label={t('dashboard.facturación')}
              progress={(totals.facturacion / teamObjectives.facturacion) * 100}
              target={`€${teamObjectives.facturacion/1000}K`}
              color="#3B82F6"
              delay={5}
            />
            <StatCard
              icon={Wallet}
              value={`€${(totals.margen/1000).toFixed(1)}K`}
              label={t('dashboard.margenBruto')}
              progress={(totals.margen / teamObjectives.margen) * 100}
              target={`€${teamObjectives.margen/1000}K`}
              color="#22C55E"
              delay={6}
            />
          </div>
        </OsWindow>

        {/* Charts & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OsWindow title={t('dashboard.evoluciónSemanal')} icon={TrendingUp}>
              <Suspense fallback={<div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}>
                <WeeklyEvolutionChart hideHeader />
              </Suspense>
            </OsWindow>
          </div>
          <OsWindow title={t('dashboard.alertasInteligentes')} icon={AlertTriangle}>
            <SmartAlertsWidget hideHeader />
          </OsWindow>
        </div>

        {/* Onboarding Widgets - Only show if Fast Start completed */}
        {projectId && userId && onboardingProgress && onboardingProgress.fastStartCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GamificationWidget projectId={projectId} userId={userId} />
            <RegenerationTriggersWidget projectId={projectId} />
          </div>
        )}

        {/* Top 3 Rankings */}
        <OsWindow title={t('dashboard.topPerformers')} icon={Trophy}>
          <TopRankingsWidget members={membersForRanking} hideHeader />
        </OsWindow>

        {/* Validations */}
        <OsWindow title={t('dashboard.validacionesPendientes')} icon={CheckCircle2}>
          <PendingValidationsWidget hideHeader />
        </OsWindow>
      </div>

      {/* Floating Help Widget */}
      <HelpWidget section="dashboard" />

      {/* Dashboard Preview Modal */}
      <DashboardPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}
