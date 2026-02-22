/**
 * DASHBOARD VIEW - Enterprise Edition
 *
 * Vista principal que consolida métricas de toda la organización.
 * SIN datos demo - Solo datos reales.
 */

import { useMemo, useState, useEffect } from 'react';
import { FileCheck, BookOpen, Trophy, Users, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { StatCard } from '@/components/nova/StatCard';
import { HowItWorks } from '@/components/ui/how-it-works';
import { useMemberStats, useObjectives } from '@/hooks/useNovaData';
import { WeeklyEvolutionChart } from '@/components/dashboard/WeeklyEvolutionChart';
import { TopRankingsWidget } from '@/components/dashboard/TopRankingsWidget';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { PendingValidationsWidget } from '@/components/dashboard/PendingValidationsWidget';
import { SmartAlertsWidget } from '@/components/dashboard/SmartAlertsWidget';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';
import { DashboardPreviewModal } from '@/components/preview/DashboardPreviewModal';
import { OnboardingProgressBanner } from '@/components/onboarding/OnboardingProgressBanner';
import { RegenerationTriggersWidget } from '@/components/onboarding/RegenerationTriggersWidget';
import { GamificationWidget } from '@/components/onboarding/GamificationWidget';
import { supabase } from '@/integrations/supabase/client';

interface DashboardViewProps {
  onNewOBV?: () => void;
}

export function DashboardView({ onNewOBV }: DashboardViewProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState<any>(null);
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
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (project?.metadata?.fast_start_completed) {
        setOnboardingProgress({
          progress: project.metadata.onboarding_progress || 25,
          fastStartCompleted: project.metadata.fast_start_completed || false,
          deepSetupSections: project.metadata.deep_setup_sections || [],
          onboardingType: project.metadata.onboarding_type || 'idea',
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
        subtitle="Consolida métricas de proyectos, equipo y finanzas en un solo lugar"
        onNewOBV={onNewOBV}
        showBackButton={true}
      />

      <div className="p-8 space-y-6">
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
          title="Cómo funciona"
          description="Vista general consolidada de toda tu organización"
          whatIsIt="Dashboard principal que agrega automáticamente métricas de todos tus proyectos, OBVs ejecutadas, deals cerrados en CRM, revenue en Financiero, y progreso del equipo. Te da una foto completa de la salud de tu startup en tiempo real."
          onViewPreview={() => setShowPreviewModal(true)}
          dataInputs={[
            {
              from: 'Todas las secciones',
              items: [
                'Centro OBVs → Total de OBVs completadas',
                'CRM → Pipeline value y deals cerrados',
                'Financiero → Revenue y márgenes',
                'Equipo → Fit Scores y progreso en roles',
              ],
            },
          ]}
          dataOutputs={[
            {
              to: 'Tú (decisiones)',
              items: [
                'Vista 360° de la startup',
                'Alertas de problemas críticos',
                'Qué priorizar hoy',
              ],
            },
          ]}
          nextStep={{
            action: 'Identifica problemas o cuellos de botella',
            destination: 'Navega a la sección específica para profundizar (Proyectos, CRM, etc.)',
          }}
        />

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

        {/* Onboarding Widgets - Only show if Fast Start completed */}
        {projectId && userId && onboardingProgress && onboardingProgress.fastStartCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GamificationWidget projectId={projectId} userId={userId} />
            <RegenerationTriggersWidget projectId={projectId} />
          </div>
        )}

        {/* Top 3 Rankings */}
        <TopRankingsWidget members={membersForRanking} />

        {/* Activity & Validations */}
        <div className="grid grid-cols-2 gap-6">
          <RecentActivityFeed />
          <PendingValidationsWidget />
        </div>
      </div>

      {/* Floating Help Widget */}
      <HelpWidget section="dashboard" />

      {/* Dashboard Preview Modal */}
      <DashboardPreviewModal open={showPreviewModal} onOpenChange={setShowPreviewModal} />
    </>
  );
}
