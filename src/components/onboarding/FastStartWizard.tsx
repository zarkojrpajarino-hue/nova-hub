/**
 * 🚀 FAST START WIZARD
 *
 * New onboarding orchestrator for hybrid Fast Start + Deep Setup architecture
 *
 * FLOWS:
 * - Generative: 3 min (5 preguntas mínimas)
 * - Idea: 4 min (3 preguntas + AutoFill opcional)
 * - Existing: 5 min (4 preguntas + Data Integration opcional)
 *
 * GOALS:
 * - 75-85% completion rate (vs 20% anterior)
 * - Minimal friction
 * - Immediate value
 * - Progressive disclosure
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Sparkles, Rocket, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from '@/lib/confetti';

// Import Fast Start components (to be created)
import { GenerativeFastStart } from './fast-start/GenerativeFastStart';
import { IdeaFastStart } from './fast-start/IdeaFastStart';
import { ExistingFastStart } from './fast-start/ExistingFastStart';

type OnboardingType = 'generative' | 'idea' | 'existing';

interface FastStartWizardProps {
  projectId: string;
  onComplete: () => void;
}

export function FastStartWizard({ projectId, onComplete }: FastStartWizardProps) {
  const navigate = useNavigate();
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'fast-start' | 'complete'>('fast-start');
  const [completedData, setCompletedData] = useState<any>(null);

  // Load onboarding type from project metadata
  useEffect(() => {
    const loadProjectType = async () => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('Error loading project type:', error);
        toast.error('Error loading project', {
          description: 'Please try again or contact support'
        });
      }

      if (project?.metadata?.onboarding_type) {
        setOnboardingType(project.metadata.onboarding_type);
      } else {
        // Fallback to 'idea' if no type saved
        console.warn('No onboarding_type found, defaulting to idea');
        setOnboardingType('idea');
      }
      setLoading(false);
    };

    loadProjectType();
  }, [projectId]);

  const handleFastStartComplete = async (data: any) => {
    setSaving(true);
    setCompletedData(data);

    try {
      // Calculate initial progress (Fast Start = 25% of total onboarding)
      const initialProgress = 25;

      // Save Fast Start data and initialize progress system
      const { error } = await supabase
        .from('projects')
        .update({
          nombre: data.project_name || 'Mi Proyecto',
          descripcion: data.business_description || 'Proyecto en configuración',
          metadata: {
            onboarding_type: onboardingType,
            fast_start_completed: true,
            fast_start_data: data,
            fast_start_completed_at: new Date().toISOString(),
            onboarding_progress: initialProgress,
            deep_setup_unlocked: false,
            ai_generated_artifacts: data.ai_generated_artifacts || null,
          }
        })
        .eq('id', projectId);

      if (error) throw error;

      // Show success step
      setStep('complete');

      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success('Fast Start completed!', {
        description: 'Your project is ready to start'
      });

      // Redirect after 3 seconds to dashboard with progress banner
      setTimeout(() => {
        onComplete();
      }, 3000);

    } catch (error: any) {
      console.error('Error saving Fast Start:', error);
      toast.error('Error saving progress', {
        description: error.message
      });
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md border-2 border-blue-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Loading onboarding...</p>
            <p className="text-sm text-gray-600">Preparing your experience</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Fast Start (type-specific)
  if (step === 'fast-start' && onboardingType) {
    return (
      <>
        {onboardingType === 'generative' && (
          <GenerativeFastStart
            projectId={projectId}
            onComplete={handleFastStartComplete}
          />
        )}
        {onboardingType === 'idea' && (
          <IdeaFastStart
            projectId={projectId}
            onComplete={handleFastStartComplete}
          />
        )}
        {onboardingType === 'existing' && (
          <ExistingFastStart
            projectId={projectId}
            onComplete={handleFastStartComplete}
          />
        )}
      </>
    );
  }

  // Step 2: Completion Celebration
  if (step === 'complete') {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-12 pb-12 text-center">
            {/* Success Icon */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
              <div className="relative bg-green-500 rounded-full p-6">
                <CheckCircle2 className="h-16 w-16 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Fast Start Completed!
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Your project is ready. You've completed the essential setup in just a few minutes!
            </p>

            {/* What You've Accomplished */}
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <span className="text-gray-900 font-semibold">Initial Setup Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-green-600">25%</div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500" style={{ width: '25%' }} />
              </div>
            </div>

            {/* Next Steps Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-xl mx-auto mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-3">What's Next?</h3>
              <ul className="text-left space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Access your project dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Complete Deep Setup sections to unlock advanced tools (optional)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Rocket className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Start using AI-powered features immediately</span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              size="lg"
              onClick={onComplete}
              disabled={saving}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Rocket className="h-5 w-5" />
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Button>

            {/* Auto-redirect message */}
            <p className="text-sm text-gray-600 mt-6">
              Redirecting automatically in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback
  return null;
}
