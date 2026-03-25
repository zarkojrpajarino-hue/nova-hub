/**
 * HOW IT WORKS COMPONENT
 *
 * Componente reutilizable para mostrar t('ui.cómoFunciona0') en cada sección
 * Explica: qué es, de dónde vienen datos, qué genera, próximo paso
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, BookOpen, Download, Upload, ArrowRight, Play, Sparkles, Lock, Zap } from 'lucide-react';
import { useFeatureAccess, type SubscriptionPlan } from '@/hooks/useSubscription';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { LockedFeatureOverlay } from '@/components/subscription/LockedFeatureOverlay';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

import { useTranslation } from 'react-i18next';
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

// Map premium features to user-friendly names (keys only — translated inside component)
const featureNameKeys: Record<string, string> = {
  advanced_analytics: 'ui.analyticsAvanzados',
  api_access: 'ui.accesoApi',
  ai_role_generation: 'ui.generaciónIaDeRoles',
  ai_task_generation: 'ui.generaciónIaDeTareas',
  custom_branding: 'ui.brandingPersonalizado',
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
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { currentProject } = useCurrentProject();
  const { canUseFeature, subscription } = useFeatureAccess(currentProject?.id);

  // Verificar si el usuario tiene acceso a la feature premium
  const hasAccess = premiumFeature ? canUseFeature(premiumFeature as keyof SubscriptionPlan) : true;

  // Obtener el nombre del plan actual
  const currentPlanName = subscription?.plan?.display_name || t('ui.free');

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
                  <Badge variant="secondary" className="text-xs">{t('ui.cómoFunciona')}</Badge>
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
                <Play className="w-5 h-5" />{t('ui.verSecciónEnAcción')}<Sparkles className="w-5 h-5" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">{t('ui.previewInteractivoConDatos')}</p>

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
                  <p className="text-xs text-center text-muted-foreground mt-2">{t('ui.actualizaTuPlanPara')}</p>
                </div>
              )}
            </div>
          )}

          {/* What is it */}
          <div>
            <h4 className="font-semibold text-sm mb-2 text-primary">{t('ui.quéEs')}</h4>
            <p className="text-sm text-muted-foreground">{whatIsIt}</p>
          </div>

          {/* Data inputs */}
          {dataInputs && dataInputs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Download className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-sm text-blue-500">{t('ui.deDóndeVienenLos')}</h4>
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
                <h4 className="font-semibold text-sm text-green-500">{t('ui.quéDatosGenera')}</h4>
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
                <h4 className="font-semibold text-sm text-amber-600">{t('ui.próximoPaso')}</h4>
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
              <DialogTitle>{t('ui.actualizarPlan')}</DialogTitle>
              <DialogDescription>
                Actualiza tu plan para desbloquear {t(featureNameKeys[premiumFeature] || '', premiumFeature) || title}
              </DialogDescription>
            </VisuallyHidden>
            <LockedFeatureOverlay
              featureName={t(featureNameKeys[premiumFeature] || '', premiumFeature) || title}
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
