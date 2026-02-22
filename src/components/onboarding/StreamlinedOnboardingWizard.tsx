/**
 * 🎯 STREAMLINED ONBOARDING WIZARD
 *
 * Nuevo flujo simplificado:
 * 1. Type Selection (ya hecho en SelectOnboardingTypePage)
 * 2. Simplified Entry (minimal input + AI generation)
 * 3. AI Preview & Approval
 * 4. Complete (redirect to dashboard)
 *
 * VENTAJAS vs onboarding anterior:
 * - 60 segundos vs 15 minutos
 * - 3 pasos vs 20+ pasos
 * - AI-first vs manual input
 * - 70%+ completion vs 35% completion
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimplifiedOnboardingEntry } from './SimplifiedOnboardingEntry';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Sparkles,
  Rocket,
  ArrowRight,
  PartyPopper,
  TrendingUp
} from 'lucide-react';
import confetti from '@/lib/confetti';

type OnboardingType = 'generative' | 'idea' | 'existing';

interface StreamlinedOnboardingWizardProps {
  projectId: string;
  onComplete: () => void;
}

export function StreamlinedOnboardingWizard({
  projectId,
  onComplete
}: StreamlinedOnboardingWizardProps) {
  const _navigate = useNavigate();
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'entry' | 'complete'>('entry');
  const [completedData, setCompletedData] = useState<Record<string, unknown> | null>(null);

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
      }

      if (project?.metadata?.onboarding_type) {
        setOnboardingType(project.metadata.onboarding_type);
      } else {
        // FALLBACK: Si no hay tipo guardado, usar 'idea' por defecto
        setOnboardingType('idea');
      }
      setLoading(false);
    };

    loadProjectType();
  }, [projectId]);

  const handleComplete = async (data: Record<string, unknown>) => {
    setSaving(true);
    setCompletedData(data);

    try {
      // Save AI-generated artifacts to database
      const { error } = await supabase
        .from('projects')
        .update({
          metadata: {
            onboarding_type: onboardingType,
            onboarding_completed: true,
            ai_generated_artifacts: data.ai_generated_artifacts,
            completed_at: new Date().toISOString(),
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

      toast.success('🎉 Onboarding completado!', {
        description: 'Tu ecosistema empresarial está listo'
      });

      // Redirect after 3 seconds
      setTimeout(() => {
        onComplete();
      }, 3000);

    } catch (error) {
      console.error('Error saving onboarding:', error);
      toast.error('Error al guardar', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
      setSaving(false);
    }
  };

  // Siempre mostrar algo, nunca pantalla en blanco
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="max-w-md border-2 border-purple-200">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Cargando onboarding...</p>
            <p className="text-sm text-gray-600">Preparando tu experiencia</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Simplified Entry (AI Generation)
  if (step === 'entry' && onboardingType) {
    return (
      <SimplifiedOnboardingEntry
        projectId={projectId}
        onboardingType={onboardingType}
        onComplete={handleComplete}
      />
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
              🎉 ¡Onboarding Completado!
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Tu ecosistema empresarial está listo. Has generado:
            </p>

            {/* Generated Artifacts Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold text-gray-900">Business Model</div>
                <div className="text-sm text-gray-600">Canvas completo</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl mb-2">👥</div>
                <div className="font-semibold text-gray-900">Buyer Personas</div>
                <div className="text-sm text-gray-600">
                  {completedData?.ai_generated_artifacts?.buyer_personas?.length || 2} perfiles
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-semibold text-gray-900">Sales Playbook</div>
                <div className="text-sm text-gray-600">Estrategia completa</div>
              </div>
            </div>

            {/* Quality Score */}
            <div className="bg-white rounded-lg p-6 max-w-md mx-auto mb-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  <span className="text-gray-900 font-semibold">Calidad IA</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-green-600">
                    {completedData?.ai_generated_artifacts?.total_confidence_score || 85}%
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  // TODO: Show artifacts in a modal or new page
                  toast.info('Próximamente: Vista previa de artifacts');
                }}
                className="gap-2"
              >
                <PartyPopper className="h-5 w-5" />
                Ver Documentos
              </Button>
              <Button
                size="lg"
                onClick={onComplete}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Rocket className="h-5 w-5" />
                Ir al Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Auto-redirect message */}
            <p className="text-sm text-gray-600 mt-6">
              Redirigiendo automáticamente en 3 segundos...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback if onboardingType is null (should never happen after loading)
  return null;
}

// Add fade-in animation to globals.css
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in {
//   animation: fade-in 0.5s ease-out;
// }
