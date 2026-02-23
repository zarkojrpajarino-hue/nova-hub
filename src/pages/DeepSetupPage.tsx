/**
 * 🎯 DEEP SETUP PAGE
 *
 * Optional onboarding sections that unlock advanced tools
 * Gamified experience with progress tracking, badges, and rewards
 *
 * ARCHITECTURE:
 * - Fast Start (25%) must be complete to access
 * - Each section = 5-15% progress
 * - Progressive unlocking at milestones (50%, 75%, 100%)
 * - Sections unlock advanced OPTIMUS-K tools
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeepSetupSectionRouter } from '@/components/onboarding/DeepSetupSectionRouter';
import {
  ArrowLeft,
  Sparkles,
  Lock,
  CheckCircle2,
  Star,
  Trophy,
  TrendingUp,
  Zap,
  Target,
  Users,
  DollarSign,
  BarChart3,
  Rocket,
  Award,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

type OnboardingType = 'generative' | 'idea' | 'existing';

interface DeepSetupSection {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  progressValue: number; // How much % this section adds
  locked: boolean;
  completed: boolean;
  unlockRequirement?: number; // Progress % needed to unlock
  unlocksTools?: string[]; // Tools unlocked upon completion
}

function DeepSetupList() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [_onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [currentProgress, setCurrentProgress] = useState(25); // Starts at 25% (Fast Start)
  const [sections, setSections] = useState<DeepSetupSection[]>([]);

  // Load project data and progress
  useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId) return;

      const { data: project, error } = await supabase
        .from('projects')
        .select('metadata, nombre')
        .eq('id', projectId)
        .single();

      if (error) {
        toast.error('Error loading project');
        return;
      }

      if (!project?.metadata?.fast_start_completed) {
        toast.error('Please complete Fast Start first');
        navigate(`/onboarding/${projectId}`);
        return;
      }

      const type = project.metadata.onboarding_type as OnboardingType;
      const progress = project.metadata.onboarding_progress || 25;

      setOnboardingType(type);
      setCurrentProgress(progress);
      setSections(getDeepSetupSections(type, progress, project.metadata.completed_sections || []));
      setLoading(false);
    };

    loadProjectData();
  }, [projectId, navigate]);

  // Get sections based on onboarding type
  const getDeepSetupSections = (
    type: OnboardingType,
    progress: number,
    completedSections: string[]
  ): DeepSetupSection[] => {
    const baseSections = {
      generative: [
        {
          id: 'business-ideas',
          name: 'Refine Business Ideas',
          description: 'Deep dive into your 3 AI-generated ideas with market analysis',
          icon: Sparkles,
          progressValue: 10,
          locked: false,
          unlocksTools: ['SWOT Matrix', 'Market Research'],
        },
        {
          id: 'location-intelligence',
          name: 'Location Intelligence',
          description: 'Local investors, accelerators, costs, grants, and events',
          icon: Target,
          progressValue: 8,
          locked: false,
          unlocksTools: ['Investor Map', 'Grant Finder'],
        },
        {
          id: 'founder-profile',
          name: 'Founder Profile',
          description: 'Build your founder profile with skills, experience, and vision',
          icon: Users,
          progressValue: 10,
          locked: false,
          unlocksTools: ['Team Builder', 'Co-founder Matcher'],
        },
        {
          id: 'financial-planning',
          name: 'Financial Planning',
          description: 'Budget, runway, and funding strategy',
          icon: DollarSign,
          progressValue: 12,
          locked: progress < 50,
          unlockRequirement: 50,
          unlocksTools: ['Financial Projections', 'Fundraising Roadmap'],
        },
        {
          id: 'validation-experiments',
          name: 'Validation Experiments',
          description: 'Design experiments to validate your chosen idea',
          icon: BarChart3,
          progressValue: 15,
          locked: progress < 50,
          unlockRequirement: 50,
          unlocksTools: ['Experiment Designer', 'Results Tracker'],
        },
        {
          id: 'go-to-market',
          name: 'Go-to-Market Strategy',
          description: 'Launch plan, channels, and early customer acquisition',
          icon: Rocket,
          progressValue: 20,
          locked: progress < 75,
          unlockRequirement: 75,
          unlocksTools: ['GTM Planner', 'Channel Optimizer', 'Launch Checklist'],
        },
      ],
      idea: [
        {
          id: 'business-model-deep',
          name: 'Deep Business Model',
          description: 'Complete Business Model Canvas with all 9 blocks in detail',
          icon: Sparkles,
          progressValue: 10,
          locked: false,
          unlocksTools: ['BMC Editor', 'Value Prop Designer'],
        },
        {
          id: 'buyer-personas-extended',
          name: 'Extended Buyer Personas',
          description: 'Create 3-5 detailed personas with jobs-to-be-done',
          icon: Users,
          progressValue: 10,
          locked: false,
          unlocksTools: ['Persona Builder', 'Journey Mapper'],
        },
        {
          id: 'competitive-analysis',
          name: 'Competitive Analysis',
          description: 'SWOT vs competitors + market gaps identification',
          icon: Target,
          progressValue: 12,
          locked: false,
          unlocksTools: ['Competitor Tracker', 'Market Gap Analyzer'],
        },
        {
          id: 'location-intelligence',
          name: 'Location Intelligence',
          description: 'Local market insights and opportunities',
          icon: Target,
          progressValue: 8,
          locked: false,
          unlocksTools: ['Local Market Data'],
        },
        {
          id: 'sales-playbook-advanced',
          name: 'Advanced Sales Playbook',
          description: 'Sales process, scripts, objection handling, and pricing',
          icon: DollarSign,
          progressValue: 12,
          locked: progress < 50,
          unlockRequirement: 50,
          unlocksTools: ['Sales Simulator', 'Script Generator'],
        },
        {
          id: 'mvp-roadmap',
          name: 'MVP Roadmap',
          description: 'Feature prioritization and development timeline',
          icon: Rocket,
          progressValue: 15,
          locked: progress < 50,
          unlockRequirement: 50,
          unlocksTools: ['Feature Prioritizer', 'Timeline Planner'],
        },
        {
          id: 'validation-plan',
          name: 'Validation Plan',
          description: 'Lean experiments to validate assumptions',
          icon: BarChart3,
          progressValue: 15,
          locked: progress < 75,
          unlockRequirement: 75,
          unlocksTools: ['Experiment Designer', 'Metrics Dashboard'],
        },
      ],
      existing: [
        {
          id: 'health-diagnostic',
          name: 'Business Health Diagnostic',
          description: 'Deep analysis of your current state with truth-o-meter',
          icon: BarChart3,
          progressValue: 10,
          locked: false,
          unlocksTools: ['Health Dashboard', 'Diagnostic Report'],
        },
        {
          id: 'data-integration',
          name: 'Data Integration',
          description: 'Connect Stripe, GA, Mixpanel for automated insights',
          icon: Sparkles,
          progressValue: 8,
          locked: false,
          unlocksTools: ['Auto-sync', 'Real-time Metrics'],
        },
        {
          id: 'team-alignment',
          name: 'Team & Culture',
          description: 'Team structure, roles, and culture assessment',
          icon: Users,
          progressValue: 10,
          locked: false,
          unlocksTools: ['Team Builder', 'Culture Tracker'],
        },
        {
          id: 'growth-bottlenecks',
          name: 'Growth Bottlenecks',
          description: 'Identify and prioritize what is blocking growth',
          icon: Target,
          progressValue: 12,
          locked: false,
          unlocksTools: ['Bottleneck Analyzer', 'Action Prioritizer'],
        },
        {
          id: 'unit-economics',
          name: 'Unit Economics',
          description: 'CAC, LTV, payback period, and profitability analysis',
          icon: DollarSign,
          progressValue: 12,
          locked: progress < 50,
          unlockRequirement: 50,
          unlocksTools: ['Economics Calculator', 'Cohort Analysis'],
        },
        {
          id: 'retention-optimization',
          name: 'Retention & Churn',
          description: 'Churn analysis and retention improvement strategies',
          icon: TrendingUp,
          progressValue: 12,
          locked: progress < 50,
          unlockRequirement: 50,
          unlocksTools: ['Churn Predictor', 'Retention Playbook'],
        },
        {
          id: 'scaling-roadmap',
          name: 'Scaling Roadmap',
          description: '3 scenarios (status quo, fix, growth) with action plan',
          icon: Rocket,
          progressValue: 15,
          locked: progress < 75,
          unlockRequirement: 75,
          unlocksTools: ['Scenario Planner', 'Growth Model', 'OKR Tracker'],
        },
        {
          id: 'competitive-moat',
          name: 'Competitive Moat',
          description: 'Build defensibility and sustainable competitive advantage',
          icon: Award,
          progressValue: 13,
          locked: progress < 75,
          unlockRequirement: 75,
          unlocksTools: ['Moat Builder', 'Strategy Canvas'],
        },
      ],
    };

    return baseSections[type].map(section => ({
      ...section,
      completed: completedSections.includes(section.id),
    }));
  };

  // Calculate milestone badges
  const getMilestoneBadges = () => {
    const badges = [];
    if (currentProgress >= 50) badges.push({ name: 'Intermediate', icon: Star, color: 'text-blue-600' });
    if (currentProgress >= 75) badges.push({ name: 'Advanced', icon: Zap, color: 'text-purple-600' });
    if (currentProgress >= 100) badges.push({ name: 'Master', icon: Trophy, color: 'text-yellow-600' });
    return badges;
  };

  const completedSections = sections.filter(s => s.completed).length;
  const totalSections = sections.length;
  const badges = getMilestoneBadges();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/proyecto/${projectId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Deep Setup</h1>
              <p className="text-gray-600">
                Complete sections to unlock advanced tools and features
              </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
              {badges.map((badge, idx) => (
                <Badge key={idx} className={`${badge.color} gap-1`}>
                  <badge.icon className="h-3 w-3" />
                  {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border-2 border-purple-200 bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Progress</h3>
                <p className="text-sm text-gray-600">
                  {completedSections} of {totalSections} sections complete
                </p>
              </div>
              <div className="text-4xl font-bold text-purple-600">
                {currentProgress}%
              </div>
            </div>
            <Progress value={currentProgress} className="h-3 mb-4" />
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Fast Start ✓</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>{completedSections} Deep Setup sections</span>
              </div>
              {currentProgress >= 100 && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span>All features unlocked!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className={`
                  transition-all cursor-pointer hover:shadow-lg
                  ${section.completed ? 'border-2 border-green-300 bg-green-50/50' : ''}
                  ${section.locked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02]'}
                `}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center
                        ${section.completed ? 'bg-green-500' : 'bg-purple-500'}
                        ${section.locked ? 'bg-gray-400' : ''}
                      `}>
                        {section.locked ? (
                          <Lock className="h-6 w-6 text-white" />
                        ) : section.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        ) : (
                          <Icon className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            +{section.progressValue}%
                          </Badge>
                          {section.completed && (
                            <Badge className="text-xs bg-green-600">Completed</Badge>
                          )}
                          {section.locked && (
                            <Badge className="text-xs bg-gray-500">
                              Unlock at {section.unlockRequirement}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {section.description}
                  </CardDescription>

                  {section.unlocksTools && section.unlocksTools.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Unlocks:</p>
                      <div className="flex flex-wrap gap-1">
                        {section.unlocksTools.map((tool, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full"
                    disabled={section.locked || section.completed}
                    onClick={() => {
                      if (!section.locked && !section.completed) {
                        navigate(`/proyecto/${projectId}/deep-setup/${section.id}`);
                      }
                    }}
                  >
                    {section.completed ? 'Completed' : section.locked ? 'Locked' : 'Start Section'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeepSetupSection() {
  const { projectId, sectionId } = useParams<{ projectId: string; sectionId: string }>();
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState<{ onboardingType: string; currentProgress: number } | null>(null);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      const { data: project } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (project) {
        setProjectData({
          onboardingType: project.metadata.onboarding_type,
          currentProgress: project.metadata.onboarding_progress || 25,
        });
      }
      setLoading(false);
    };

    loadProject();
  }, [projectId]);

  if (loading || !projectData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Find section progress value
  const sectionProgressValue = getSectionProgressValue(sectionId || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <DeepSetupSectionRouter
        projectId={projectId || ''}
        sectionId={sectionId || ''}
        onboardingType={projectData.onboardingType}
        currentProgress={projectData.currentProgress}
        sectionProgressValue={sectionProgressValue}
      />
    </div>
  );
}

// Helper to get section progress value
function getSectionProgressValue(sectionId: string): number {
  const progressMap: Record<string, number> = {
    // Generative
    'business-ideas': 10,
    'location-intelligence': 8,
    'founder-profile': 10,
    'financial-planning': 12,
    'validation-experiments': 15,
    'go-to-market': 20,
    // Idea
    'business-model-deep': 10,
    'buyer-personas-extended': 10,
    'competitive-analysis': 12,
    'sales-playbook-advanced': 12,
    'mvp-roadmap': 15,
    'validation-plan': 15,
    // Existing
    'health-diagnostic': 10,
    'data-integration': 8,
    'team-alignment': 10,
    'growth-bottlenecks': 12,
    'unit-economics': 12,
    'retention-optimization': 12,
    'scaling-roadmap': 15,
    'competitive-moat': 13,
  };
  return progressMap[sectionId] || 10;
}

export function DeepSetupPage() {
  return (
    <Routes>
      <Route index element={<DeepSetupList />} />
      <Route path=":sectionId" element={<DeepSetupSection />} />
    </Routes>
  );
}
