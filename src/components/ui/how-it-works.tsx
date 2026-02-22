/**
 * HOW IT WORKS COMPONENT
 *
 * Componente reutilizable para mostrar "Cómo funciona" en cada sección
 * Explica: qué es, de dónde vienen datos, qué genera, próximo paso
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, Download, Upload, ArrowRight, Play, Sparkles, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { LockedFeatureOverlay } from '@/components/subscription/LockedFeatureOverlay';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface DataFlow {
  from: string;
  items: string[];
}

interface DataOutput {
  to: string;
  items: string[];
}

interface HowItWorksProps {
  title: string;
  description: string;
  whatIsIt: string;
  dataInputs?: DataFlow[];
  dataOutputs?: DataOutput[];
  nextStep?: {
    action: string;
    destination: string;
  };
  defaultExpanded?: boolean;
  onViewPreview?: () => void; // Callback para abrir el modal de preview
  premiumFeature?: 'advanced_analytics' | 'api_access' | 'ai_role_generation' | 'ai_task_generation' | 'custom_branding'; // Feature premium que se requiere
  requiredPlan?: 'pro' | 'advanced' | 'enterprise'; // Plan mínimo requerido
}

// Map premium features to user-friendly names
const featureNames: Record<string, string> = {
  advanced_analytics: 'Analytics Avanzados',
  api_access: 'Acceso API',
  ai_role_generation: 'Generación IA de Roles',
  ai_task_generation: 'Generación IA de Tareas',
  custom_branding: 'Branding Personalizado',
};

// Benefits for each feature
const featureBenefits: Record<string, string[]> = {
  advanced_analytics: [
    'Comparativas de socios y proyectos',
    'Predicciones con IA',
    'Reportes exportables',
    'Dashboards personalizados',
  ],
  api_access: [
    'Integración con herramientas externas',
    'Webhooks personalizados',
    'Documentación completa',
    'Rate limits ampliados',
  ],
  ai_role_generation: [
    'Generación automática de roles',
    'Competencias personalizadas',
    'Templates enterprise-level',
  ],
  ai_task_generation: [
    'Generación automática de tareas',
    'Priorización inteligente',
    'Estimaciones de tiempo',
  ],
  custom_branding: [
    'Logo personalizado',
    'Colores de marca',
    'White label',
  ],
};

export function HowItWorks({
  title,
  description,
  whatIsIt,
  dataInputs,
  dataOutputs,
  nextStep,
  defaultExpanded = false,
  onViewPreview,
  premiumFeature,
  requiredPlan,
}: HowItWorksProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { currentProject } = useCurrentProject();
  const { canUseFeature, subscription } = useFeatureAccess(currentProject?.id);

  // Verificar si el usuario tiene acceso a la feature premium
  const hasAccess = premiumFeature ? canUseFeature(premiumFeature as any) : true;

  // Obtener el nombre del plan actual
  const currentPlanName = subscription?.plan?.display_name || 'Free';

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {title}
                {!isExpanded && (
                  <Badge variant="secondary" className="text-xs">
                    Cómo funciona
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <button className="p-1 hover:bg-primary/10 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Preview Button - DESTACADO ARRIBA */}
          {onViewPreview && (
            <div className="pb-4 border-b space-y-3">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewPreview();
                }}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 gap-2 shadow-lg"
              >
                <Play className="w-5 h-5" />
                Ver Sección en Acción
                <Sparkles className="w-5 h-5" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Preview interactivo con datos de ejemplo enterprise-level
              </p>

              {/* Upgrade Button - Si no tiene acceso */}
              {!hasAccess && premiumFeature && requiredPlan && (
                <div className="pt-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUpgradeModal(true);
                    }}
                    size="lg"
                    variant="outline"
                    className="w-full border-2 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 gap-2 font-semibold"
                  >
                    <Lock className="w-5 h-5" />
                    Desbloquear con Plan {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
                    <Zap className="w-5 h-5" />
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Actualiza tu plan para usar esta funcionalidad con tus datos reales
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What is it */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">¿Qué es?</h4>
            <p className="text-sm text-muted-foreground">{whatIsIt}</p>
          </div>

          {/* Data inputs */}
          {dataInputs && dataInputs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-sm text-blue-500">De dónde vienen los datos</h4>
              </div>
              <div className="space-y-3">
                {dataInputs.map((input, index) => (
                  <div key={index} className="pl-4 border-l-2 border-blue-500/30">
                    <p className="font-semibold text-xs text-blue-600 mb-1">← {input.from}</p>
                    <ul className="space-y-1">
                      {input.items.map((item, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data outputs */}
          {dataOutputs && dataOutputs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4 text-green-500" />
                <h4 className="font-semibold text-sm text-green-500">Qué datos genera</h4>
              </div>
              <div className="space-y-3">
                {dataOutputs.map((output, index) => (
                  <div key={index} className="pl-4 border-l-2 border-green-500/30">
                    <p className="font-semibold text-xs text-green-600 mb-1">→ {output.to}</p>
                    <ul className="space-y-1">
                      {output.items.map((item, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next step */}
          {nextStep && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-4 w-4 text-amber-500" />
                <h4 className="font-semibold text-sm text-amber-600">Próximo paso</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {nextStep.action} →{' '}
                <span className="font-semibold text-foreground">{nextStep.destination}</span>
              </p>
            </div>
          )}
        </CardContent>
      )}

      {/* Upgrade Modal */}
      {premiumFeature && requiredPlan && (
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="max-w-2xl p-0 border-0 bg-transparent shadow-none">
            <VisuallyHidden>
              <DialogTitle>Actualizar Plan</DialogTitle>
              <DialogDescription>
                Actualiza tu plan para desbloquear {featureNames[premiumFeature] || title}
              </DialogDescription>
            </VisuallyHidden>
            <LockedFeatureOverlay
              featureName={featureNames[premiumFeature] || title}
              requiredPlan={requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
              description={description}
              currentPlan={currentPlanName}
              projectId={currentProject?.id}
              variant="card"
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
