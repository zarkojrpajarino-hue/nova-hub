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

      toast.success('Section completed!', {
        description: `Progress: ${newProgress}%. ${data.unlocked_tools?.join(', ')} unlocked!`
      });

      // Check if milestone reached
      if (newProgress === 50 || newProgress === 75) {
        toast.success(`🎉 Milestone reached: ${newProgress}%`, {
          description: 'New sections unlocked!'
        });
      }

      if (newProgress === 100) {
        toast.success('🏆 Onboarding Complete!', {
          description: 'All features and tools are now unlocked'
        });
      }

      // Redirect back to Deep Setup page
      setTimeout(() => {
        navigate(`/proyecto/${projectId}/deep-setup`);
      }, 2000);

    } catch (_error) {
      toast.error('Failed to save section', {
        description: error instanceof Error ? error.message : 'Unknown error'
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
          title="Financial Planning"
          description="Budget, runway, and funding strategy"
          icon={DollarSign}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
          progressValue={12}
          unlockedTools={['Financial Projections', 'Fundraising Roadmap']}
          fields={[
            { label: 'Initial Budget', placeholder: 'How much capital do you have/need to start?', required: true },
            { label: 'Monthly Burn Rate', placeholder: 'Estimated monthly expenses', required: true },
            { label: 'Funding Strategy', placeholder: 'Bootstrap, angel, VC, or other?', required: false },
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
          title="Validation Experiments"
          description="Design experiments to validate your chosen idea"
          icon={Beaker}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
          progressValue={15}
          unlockedTools={['Experiment Designer', 'Results Tracker']}
          fields={[
            { label: 'Hypothesis', placeholder: 'What do you want to validate?', required: true },
            { label: 'Experiment Design', placeholder: 'How will you test it?', required: true },
            { label: 'Success Metrics', placeholder: 'What defines success?', required: true },
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
          title="Go-to-Market Strategy"
          description="Launch plan, channels, and early customer acquisition"
          icon={Rocket}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          progressValue={20}
          unlockedTools={['GTM Planner', 'Channel Optimizer', 'Launch Checklist']}
          fields={[
            { label: 'Target Launch Date', placeholder: 'When do you plan to launch?', required: false },
            { label: 'Primary Channels', placeholder: 'How will you reach customers?', required: true },
            { label: 'Launch Strategy', placeholder: 'Soft launch, beta, big bang?', required: true },
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
          title="Competitive Analysis"
          description="SWOT vs competitors + market gaps identification"
          icon={Target}
          gradientFrom="from-red-500"
          gradientTo="to-orange-600"
          progressValue={12}
          unlockedTools={['Competitor Tracker', 'Market Gap Analyzer']}
          fields={[
            { label: 'Main Competitors', placeholder: 'List your top 3-5 competitors', required: true },
            { label: 'Your Differentiation', placeholder: 'What makes you different/better?', required: true },
            { label: 'Market Gaps', placeholder: 'Opportunities competitors are missing', required: false },
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
          title="Advanced Sales Playbook"
          description="Sales process, scripts, objection handling, and pricing"
          icon={DollarSign}
          gradientFrom="from-green-500"
          gradientTo="to-teal-600"
          progressValue={12}
          unlockedTools={['Sales Simulator', 'Script Generator']}
          fields={[
            { label: 'Sales Process Steps', placeholder: 'Describe your sales process (qualification → close)', required: true },
            { label: 'Key Objections', placeholder: 'Common objections and how to handle them', required: true },
            { label: 'Pricing Strategy', placeholder: 'How do you price and position your offer?', required: true },
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
          title="MVP Roadmap"
          description="Feature prioritization and development timeline"
          icon={GitBranch}
          gradientFrom="from-indigo-500"
          gradientTo="to-purple-600"
          progressValue={15}
          unlockedTools={['Feature Prioritizer', 'Timeline Planner']}
          fields={[
            { label: 'MVP Core Features', placeholder: 'Minimum features for launch (must-haves)', required: true },
            { label: 'Nice-to-Have Features', placeholder: 'Features for v1.1, v1.2', required: false },
            { label: 'Development Timeline', placeholder: 'Estimated timeline and milestones', required: true },
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
          title="Validation Plan"
          description="Lean experiments to validate assumptions"
          icon={Beaker}
          gradientFrom="from-cyan-500"
          gradientTo="to-blue-600"
          progressValue={15}
          unlockedTools={['Experiment Designer', 'Metrics Dashboard']}
          fields={[
            { label: 'Key Assumptions', placeholder: 'What assumptions need validation?', required: true },
            { label: 'Validation Experiments', placeholder: 'How will you test each assumption?', required: true },
            { label: 'Success Criteria', placeholder: 'What results prove/disprove assumptions?', required: true },
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
          title="Data Integration"
          description="Connect Stripe, GA, Mixpanel for automated insights"
          icon={Database}
          gradientFrom="from-blue-500"
          gradientTo="to-cyan-600"
          progressValue={8}
          unlockedTools={['Auto-sync', 'Real-time Metrics']}
          fields={[
            { label: 'Data Sources', placeholder: 'Which tools do you use? (Stripe, GA, etc.)', required: true },
            { label: 'Key Metrics', placeholder: 'What metrics matter most?', required: true },
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
          title="Team & Culture"
          description="Team structure, roles, and culture assessment"
          icon={Users}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
          progressValue={10}
          unlockedTools={['Team Builder', 'Culture Tracker']}
          fields={[
            { label: 'Team Structure', placeholder: 'Current team composition and roles', required: true },
            { label: 'Culture Values', placeholder: 'Core values and working principles', required: true },
            { label: 'Alignment Challenges', placeholder: 'Where is team not aligned?', required: false },
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
          title="Growth Bottlenecks"
          description="Identify and prioritize what's blocking growth"
          icon={Target}
          gradientFrom="from-red-500"
          gradientTo="to-orange-600"
          progressValue={12}
          unlockedTools={['Bottleneck Analyzer', 'Action Prioritizer']}
          fields={[
            { label: 'Current Bottlenecks', placeholder: 'What is limiting your growth right now?', required: true },
            { label: 'Impact Assessment', placeholder: 'Which bottleneck has biggest impact?', required: true },
            { label: 'Action Plan', placeholder: 'How will you address top bottlenecks?', required: true },
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
          title="Unit Economics"
          description="CAC, LTV, payback period, and profitability analysis"
          icon={LineChart}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-600"
          progressValue={12}
          unlockedTools={['Economics Calculator', 'Cohort Analysis']}
          fields={[
            { label: 'CAC (Customer Acquisition Cost)', placeholder: 'Average cost to acquire a customer', required: true },
            { label: 'LTV (Lifetime Value)', placeholder: 'Average revenue per customer', required: true },
            { label: 'Payback Period', placeholder: 'Months to recover CAC', required: false },
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
          title="Retention & Churn"
          description="Churn analysis and retention improvement strategies"
          icon={TrendingUp}
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          progressValue={12}
          unlockedTools={['Churn Predictor', 'Retention Playbook']}
          fields={[
            { label: 'Current Churn Rate', placeholder: 'Monthly churn percentage', required: true },
            { label: 'Churn Reasons', placeholder: 'Why are customers leaving?', required: true },
            { label: 'Retention Strategies', placeholder: 'How will you improve retention?', required: true },
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
          title="Scaling Roadmap"
          description="3 scenarios (status quo, fix, growth) with action plan"
          icon={Rocket}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-600"
          progressValue={15}
          unlockedTools={['Scenario Planner', 'Growth Model', 'OKR Tracker']}
          fields={[
            { label: 'Status Quo Scenario', placeholder: 'What happens if you change nothing?', required: true },
            { label: 'Fix Scenario', placeholder: 'What if you fix current issues?', required: true },
            { label: 'Growth Scenario', placeholder: 'What if everything goes right?', required: true },
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
          title="Competitive Moat"
          description="Build defensibility and sustainable competitive advantage"
          icon={Shield}
          gradientFrom="from-indigo-500"
          gradientTo="to-purple-600"
          progressValue={13}
          unlockedTools={['Moat Builder', 'Strategy Canvas']}
          fields={[
            { label: 'Current Advantages', placeholder: 'What competitive advantages do you have?', required: true },
            { label: 'Moat Strategy', placeholder: 'How will you build defensibility?', required: true },
            { label: 'Threats', placeholder: 'What could erode your advantages?', required: false },
          ]}
          onComplete={handleSectionComplete}
          onCancel={handleCancel}
        />
      );

    default:
      return (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Section Not Found</h2>
          <p className="text-gray-600 mb-4">This section is under development.</p>
          <button onClick={handleCancel} className="text-blue-600 hover:underline">
            Back to Deep Setup
          </button>
        </div>
      );
  }
}
