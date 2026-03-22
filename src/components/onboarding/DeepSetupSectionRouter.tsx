/**
 * 🎯 DEEP SETUP SECTION ROUTER
 *
 * Routes to the correct Deep Setup section component based on:
 * - section_id
 * - onboarding_type
 *
 * Handles section completion and progress updates
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from '@/lib/confetti';

// Generative sections
import { BusinessIdeasSection } from './deep-setup-sections/generative/BusinessIdeasSection';
import { FounderProfileSection } from './deep-setup-sections/generative/FounderProfileSection';

// Idea sections
import { BusinessModelDeepSection } from './deep-setup-sections/idea/BusinessModelDeepSection';
import { BuyerPersonasExtendedSection } from './deep-setup-sections/idea/BuyerPersonasExtendedSection';

// Existing sections
import { HealthDiagnosticSection } from './deep-setup-sections/existing/HealthDiagnosticSection';

// Shared sections
import { LocationIntelligenceSection } from './deep-setup-sections/LocationIntelligenceSection';
import { GenericSection } from './deep-setup-sections/GenericSection';

import { useTranslation } from 'react-i18next';
// Icons for generic sections
import {
  DollarSign,
  Beaker,
  Rocket,
  Users,
  TrendingUp,
  Target,
  Shield,
  Database,
  GitBranch,
  LineChart,
} from 'lucide-react';

type OnboardingType = 'generative' | 'idea' | 'existing';

interface DeepSetupSection {
  id: string;
  completed?: boolean;
  locked?: boolean;
  unlockRequirement?: number;
  [key: string]: unknown;
}

interface DeepSetupSectionRouterProps {
  projectId: string;
  sectionId: string;
  onboardingType: OnboardingType;
  currentProgress: number;
  sectionProgressValue: number;
}

export function DeepSetupSectionRouter({
  projectId,
  sectionId,
  onboardingType,
  currentProgress,
  sectionProgressValue,
}: DeepSetupSectionRouterProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [_saving, setSaving] = useState(false);

  const handleSectionComplete = async (data: Record<string, unknown>) => {
    setSaving(true);

    try {
      // Calculate new progress
      const newProgress = Math.min(currentProgress + sectionProgressValue, 100);

      // Get current project metadata
      const { data: project } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      const currentMetadata = project?.metadata || {};
      const completedSections = currentMetadata.completed_sections || [];
      const deepSetupSections = currentMetadata.deep_setup_sections || [];

      // Update completed sections
      const updatedCompletedSections = [...completedSections, sectionId];

      // Update deep setup sections status
      const updatedDeepSetupSections = (deepSetupSections as DeepSetupSection[]).map((section: DeepSetupSection) => {
        if (section.id === sectionId) {
          return { ...section, completed: true, locked: false };
        }
        // Unlock sections based on progress milestones
        if (newProgress >= 50 && section.unlockRequirement === 50) {
          return { ...section, locked: false };
        }
        if (newProgress >= 75 && section.unlockRequirement === 75) {
          return { ...section, locked: false };
        }
        return section;
      });

      // Save to database
      const { error } = await supabase
        .from('projects')
        .update({
          metadata: {
            ...currentMetadata,
            onboarding_progress: newProgress,
            completed_sections: updatedCompletedSections,
            deep_setup_sections: updatedDeepSetupSections,
            [`section_${sectionId}_data`]: data,
            [`section_${sectionId}_completed_at`]: new Date().toISOString(),
          }
        })
        .eq('id', projectId);

      if (error) throw error;

      // Show success
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      toast.success(t('onboarding.sectionCompleted'), {
        description: `Progress: ${newProgress}%. ${data.unlocked_tools?.join(', ')} unlocked!`
      });

      // Check if milestone reached
      if (newProgress === 50 || newProgress === 75) {
        toast.success(`🎉 Milestone reached: ${newProgress}%`, {
          description: t('onboarding.newSectionsUnlocked')
        });
      }

      if (newProgress === 100) {
        toast.success('🏆 Onboarding Complete!', {
          description: t('onboarding.allFeaturesAndTools')
        });
      }

      // Redirect back to Deep Setup page
      setTimeout(() => {
        navigate(`/proyecto/${projectId}/deep-setup`);
      }, 2000);

    } catch (_error) {
      toast.error(t('onboarding.failedToSaveSection'), {
        description: error instanceof Error ? error.message : t('onboarding.unknownError')
      });
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/proyecto/${projectId}/deep-setup`);
  };

  // Route to correct section component
  switch (sectionId) {
    // Generative sections
    case 'business-ideas':
      return (
        <BusinessIdeasSection
          projectId={projectId}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'founder-profile':
      return (
        <FounderProfileSection
          projectId={projectId}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'financial-planning':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="financial-planning"
          title={t('onboarding.financialPlanning')}
          description={t('onboarding.budgetRunwayAndFunding')}
          icon={DollarSign}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
          progressValue={12}
          unlockedTools={[t('onboarding.financialProjections'), t('onboarding.fundraisingRoadmap')]}
          fields={[
            { label: t('onboarding.initialBudget'), placeholder: t('onboarding.howMuchCapitalDo'), required: true },
            { label: t('onboarding.monthlyBurnRate'), placeholder: t('onboarding.estimatedMonthlyExpenses'), required: true },
            { label: t('onboarding.fundingStrategy'), placeholder: t('onboarding.bootstrapAngelVcOr'), required: false },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'validation-experiments':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="validation-experiments"
          title={t('onboarding.validationExperiments')}
          description={t('onboarding.designExperimentsToValidate')}
          icon={Beaker}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
          progressValue={15}
          unlockedTools={[t('onboarding.experimentDesigner'), t('onboarding.resultsTracker')]}
          fields={[
            { label: t('onboarding.hypothesis'), placeholder: t('onboarding.whatDoYouWant'), required: true },
            { label: t('onboarding.experimentDesign'), placeholder: t('onboarding.howWillYouTest'), required: true },
            { label: t('onboarding.successMetrics'), placeholder: t('onboarding.whatDefinesSuccess'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'go-to-market':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="go-to-market"
          title={t('onboarding.gotomarketStrategy')}
          description={t('onboarding.launchPlanChannelsAnd')}
          icon={Rocket}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          progressValue={20}
          unlockedTools={[t('onboarding.gtmPlanner'), t('onboarding.channelOptimizer'), t('onboarding.launchChecklist')]}
          fields={[
            { label: t('onboarding.targetLaunchDate'), placeholder: t('onboarding.whenDoYouPlan'), required: false },
            { label: t('onboarding.primaryChannels'), placeholder: t('onboarding.howWillYouReach'), required: true },
            { label: t('onboarding.launchStrategy'), placeholder: t('onboarding.softLaunchBetaBig'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    // Shared sections
    case 'location-intelligence':
      return (
        <LocationIntelligenceSection
          projectId={projectId}
          onboardingType={onboardingType}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    // Idea sections
    case 'business-model-deep':
      return (
        <BusinessModelDeepSection
          projectId={projectId}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'buyer-personas-extended':
      return (
        <BuyerPersonasExtendedSection
          projectId={projectId}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'competitive-analysis':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="competitive-analysis"
          title={t('onboarding.competitiveAnalysis')}
          description={t('onboarding.swotVsCompetitorsMarket')}
          icon={Target}
          gradientFrom="from-red-500"
          gradientTo="to-orange-600"
          progressValue={12}
          unlockedTools={[t('onboarding.competitorTracker'), t('onboarding.marketGapAnalyzer')]}
          fields={[
            { label: t('onboarding.mainCompetitors'), placeholder: t('onboarding.listYourTop35'), required: true },
            { label: t('onboarding.yourDifferentiation'), placeholder: t('onboarding.whatMakesYouDifferentbetter'), required: true },
            { label: t('onboarding.marketGaps'), placeholder: t('onboarding.opportunitiesCompetitorsAreMissing'), required: false },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'sales-playbook-advanced':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="sales-playbook-advanced"
          title={t('onboarding.advancedSalesPlaybook')}
          description={t('onboarding.salesProcessScriptsObjection')}
          icon={DollarSign}
          gradientFrom="from-green-500"
          gradientTo="to-teal-600"
          progressValue={12}
          unlockedTools={[t('onboarding.salesSimulator'), t('onboarding.scriptGenerator')]}
          fields={[
            { label: t('onboarding.salesProcessSteps'), placeholder: 'Describe your sales process (qualification → close)', required: true },
            { label: t('onboarding.keyObjections'), placeholder: t('onboarding.commonObjectionsAndHow'), required: true },
            { label: t('onboarding.pricingStrategy'), placeholder: t('onboarding.howDoYouPrice'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'mvp-roadmap':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="mvp-roadmap"
          title={t('onboarding.mvpRoadmap')}
          description={t('onboarding.featurePrioritizationAndDevelopment')}
          icon={GitBranch}
          gradientFrom="from-indigo-500"
          gradientTo="to-purple-600"
          progressValue={15}
          unlockedTools={[t('onboarding.featurePrioritizer'), t('onboarding.timelinePlanner')]}
          fields={[
            { label: t('onboarding.mvpCoreFeatures'), placeholder: 'Minimum features for launch (must-haves)', required: true },
            { label: t('onboarding.nicetohaveFeatures'), placeholder: 'Features for v1.1, v1.2', required: false },
            { label: t('onboarding.developmentTimeline'), placeholder: t('onboarding.estimatedTimelineAndMilestones'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'validation-plan':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="validation-plan"
          title={t('onboarding.validationPlan')}
          description={t('onboarding.leanExperimentsToValidate')}
          icon={Beaker}
          gradientFrom="from-cyan-500"
          gradientTo="to-blue-600"
          progressValue={15}
          unlockedTools={[t('onboarding.experimentDesigner'), t('onboarding.metricsDashboard')]}
          fields={[
            { label: t('onboarding.keyAssumptions'), placeholder: t('onboarding.whatAssumptionsNeedValidation'), required: true },
            { label: t('onboarding.validationExperiments'), placeholder: t('onboarding.howWillYouTest0'), required: true },
            { label: t('onboarding.successCriteria'), placeholder: t('onboarding.whatResultsProvedisproveAssumptions'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    // Existing sections
    case 'health-diagnostic':
      return (
        <HealthDiagnosticSection
          projectId={projectId}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'data-integration':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="data-integration"
          title={t('onboarding.dataIntegration')}
          description={t('onboarding.connectStripeGaMixpanel')}
          icon={Database}
          gradientFrom="from-blue-500"
          gradientTo="to-cyan-600"
          progressValue={8}
          unlockedTools={[t('onboarding.autosync'), t('onboarding.realtimeMetrics')]}
          fields={[
            { label: t('onboarding.dataSources'), placeholder: 'Which tools do you use? (Stripe, GA, etc.)', required: true },
            { label: t('onboarding.keyMetrics'), placeholder: t('onboarding.whatMetricsMatterMost'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'team-alignment':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="team-alignment"
          title={t('onboarding.teamCulture')}
          description={t('onboarding.teamStructureRolesAnd')}
          icon={Users}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
          progressValue={10}
          unlockedTools={[t('onboarding.teamBuilder'), t('onboarding.cultureTracker')]}
          fields={[
            { label: t('onboarding.teamStructure'), placeholder: t('onboarding.currentTeamCompositionAnd'), required: true },
            { label: t('onboarding.cultureValues'), placeholder: t('onboarding.coreValuesAndWorking'), required: true },
            { label: t('onboarding.alignmentChallenges'), placeholder: t('onboarding.whereIsTeamNot'), required: false },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'growth-bottlenecks':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="growth-bottlenecks"
          title={t('onboarding.growthBottlenecks')}
          description="Identify and prioritize what's blocking growth"
          icon={Target}
          gradientFrom="from-red-500"
          gradientTo="to-orange-600"
          progressValue={12}
          unlockedTools={[t('onboarding.bottleneckAnalyzer'), t('onboarding.actionPrioritizer')]}
          fields={[
            { label: t('onboarding.currentBottlenecks'), placeholder: t('onboarding.whatIsLimitingYour'), required: true },
            { label: t('onboarding.impactAssessment'), placeholder: t('onboarding.whichBottleneckHasBiggest'), required: true },
            { label: t('onboarding.actionPlan'), placeholder: t('onboarding.howWillYouAddress'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'unit-economics':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="unit-economics"
          title={t('onboarding.unitEconomics')}
          description={t('onboarding.cacLtvPaybackPeriod')}
          icon={LineChart}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
          progressValue={12}
          unlockedTools={[t('onboarding.economicsCalculator'), t('onboarding.cohortAnalysis')]}
          fields={[
            { label: 'CAC (Customer Acquisition Cost)', placeholder: t('onboarding.averageCostToAcquire'), required: true },
            { label: 'LTV (Lifetime Value)', placeholder: t('onboarding.averageRevenuePerCustomer'), required: true },
            { label: t('onboarding.paybackPeriod'), placeholder: 'Months to recover CAC', required: false },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'retention-optimization':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="retention-optimization"
          title={t('onboarding.retentionChurn')}
          description={t('onboarding.churnAnalysisAndRetention')}
          icon={TrendingUp}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          progressValue={12}
          unlockedTools={[t('onboarding.churnPredictor'), t('onboarding.retentionPlaybook')]}
          fields={[
            { label: t('onboarding.currentChurnRate'), placeholder: t('onboarding.monthlyChurnPercentage'), required: true },
            { label: t('onboarding.churnReasons'), placeholder: t('onboarding.whyAreCustomersLeaving'), required: true },
            { label: t('onboarding.retentionStrategies'), placeholder: t('onboarding.howWillYouImprove'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'scaling-roadmap':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="scaling-roadmap"
          title={t('onboarding.scalingRoadmap')}
          description="3 scenarios (status quo, fix, growth) with action plan"
          icon={Rocket}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
          progressValue={15}
          unlockedTools={[t('onboarding.scenarioPlanner'), t('onboarding.growthModel'), t('onboarding.okrTracker')]}
          fields={[
            { label: t('onboarding.statusQuoScenario'), placeholder: t('onboarding.whatHappensIfYou'), required: true },
            { label: t('onboarding.fixScenario'), placeholder: t('onboarding.whatIfYouFix'), required: true },
            { label: t('onboarding.growthScenario'), placeholder: t('onboarding.whatIfEverythingGoes'), required: true },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    case 'competitive-moat':
      return (
        <GenericSection
          projectId={projectId}
          sectionId="competitive-moat"
          title={t('onboarding.competitiveMoat')}
          description={t('onboarding.buildDefensibilityAndSustainable')}
          icon={Shield}
          gradientFrom="from-indigo-500"
          gradientTo="to-purple-600"
          progressValue={13}
          unlockedTools={[t('onboarding.moatBuilder'), t('onboarding.strategyCanvas')]}
          fields={[
            { label: t('onboarding.currentAdvantages'), placeholder: t('onboarding.whatCompetitiveAdvantagesDo'), required: true },
            { label: t('onboarding.moatStrategy'), placeholder: t('onboarding.howWillYouBuild'), required: true },
            { label: t('onboarding.threats'), placeholder: t('onboarding.whatCouldErodeYour'), required: false },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    default:
      return (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('onboarding.sectionNotFound')}</h2>
          <p className="text-gray-600 mb-4">{t('onboarding.thisSectionIsUnder')}</p>
          <button onClick={handleCancel} className="text-blue-600 hover:underline">{t('onboarding.backToDeepSetup')}</button>
        </div>
      );
  }
}
