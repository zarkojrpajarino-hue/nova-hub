/**
 * GENERATIVE ONBOARDING VIEW
 *
 * Vista principal de creación de proyectos con IA.
 * Puede funcionar standalone o integrada en tabs de Proyectos.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { GenerativeOnboardingWizard } from '@/components/generative/GenerativeOnboardingWizard';
import { OnboardingTypeSelector, type OnboardingType } from '@/components/generative/OnboardingTypeSelector';
import { GenerativeOnboardingPreviewModal } from '@/components/preview/GenerativeOnboardingPreviewModal';
import { Sparkles, Rocket, Zap, Package, Globe, Target } from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { HowItWorks } from '@/components/ui/how-it-works';

export function GenerativeOnboardingView() {
  const { projectId: urlProjectId } = useParams();
  const navigate = useNavigate();
  const { currentProject } = useCurrentProject();
  const [searchParams] = useSearchParams();
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<OnboardingType | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Si se accede desde URL /proyecto/:id, usar ese ID
  // Si se accede desde tab en Proyectos, el wizard pedirá crear proyecto
  const projectId = urlProjectId || currentProject?.id || null;

  // Auto-open wizard if coming from create-first-project flow
  useEffect(() => {
    const autoOpen = searchParams.get('auto-open');
    const typeParam = searchParams.get('type');

    if (autoOpen === 'true' && typeParam) {
      const typeMapping: Record<string, OnboardingType> = {
        'generacion-ideas': 'sin_idea',
        'tengo-idea': 'tengo_idea',
        'startup-existente': 'startup_funcionando',
      };

      const mappedType = typeMapping[typeParam];
      if (mappedType) {
        setSelectedType(mappedType);
        setWizardOpen(true);
      }
    }
  }, [searchParams]);

  const handleSelectType = (type: OnboardingType) => {
    setSelectedType(type);
    setTypeSelectorOpen(false);
    setWizardOpen(true);
  };

  const handleWizardComplete = () => {
    // Después de completar, refrescar o navegar
    if (projectId) {
      navigate(`/proyecto/${projectId}`);
    }
    setWizardOpen(false);
    setSelectedType(null);
  };

  return (
    <FeatureGate
      projectId={currentProject?.id}
      feature="ai_role_generation"
      mode="demo"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Main CTA Card */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5">
        <CardHeader className="text-center pb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl mb-2">Generative Onboarding</CardTitle>
          <CardDescription className="text-base">
            De idea a negocio completo en menos de 10 minutos con IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card border border-primary/10 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Branding Completo</h4>
                  <p className="text-sm text-muted-foreground">
                    Logo con DALL-E, paleta de colores, tipografía y guías de marca
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-primary/10 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Productos & Pricing</h4>
                  <p className="text-sm text-muted-foreground">
                    5 productos/servicios con precios estratégicos y features
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-primary/10 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Website Deployado</h4>
                  <p className="text-sm text-muted-foreground">
                    Landing page automáticamente deployada en Vercel
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-primary/10 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Validación Lean</h4>
                  <p className="text-sm text-muted-foreground">
                    Experimentos de validación siguiendo metodología Lean Startup
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="pt-4 border-t">
            <HowItWorks
              title="Cómo funciona"
              description="Generative Onboarding crea tu startup completa con IA en minutos"
              whatIsIt="Dinos tus intereses o idea de negocio. IA genera: branding completo con logo (DALL-E), 5 productos con pricing estratégico, buyer personas, value propositions, website deployado en Vercel, y plan de validación Lean Startup. Todo listo para empezar a validar con clientes reales."
              onViewPreview={() => setShowPreviewModal(true)}
              premiumFeature="ai_role_generation"
              requiredPlan="starter"
              dataOutputs={[
                {
                  to: 'Proyectos',
                  items: [
                    'Proyecto creado con branding (logo, colores, tipografía)',
                    'Productos con pricing y features',
                    'Website deployado automáticamente',
                  ],
                },
                {
                  to: 'CRM Global',
                  items: [
                    'Buyer Personas (cliente ideal)',
                    'Value Propositions (por qué comprar)',
                    'Battle cards vs competidores',
                  ],
                },
                {
                  to: 'Validaciones',
                  items: [
                    'Experimentos Lean Startup sugeridos',
                    'Hipótesis a testear',
                    'Criterios de éxito',
                  ],
                },
              ]}
              nextStep={{
                action: 'Una vez completado el onboarding',
                destination: 'Ve a VALIDACIONES para testear tu idea con clientes reales',
              }}
              defaultExpanded={true}
            />
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button onClick={() => setTypeSelectorOpen(true)} size="lg" className="w-full">
              <Sparkles className="mr-2 h-5 w-5" />
              Comenzar Generative Onboarding
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Costo aproximado: $0.50-1.00 por generación completa • Tiempo: 2-3 minutos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
              <Zap className="h-6 w-6 text-green-500" />
            </div>
            <h4 className="font-semibold mb-1">Ultra Rápido</h4>
            <p className="text-xs text-muted-foreground">
              Lo que tomaría semanas hacerlo manual, con IA: 10 minutos
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-blue-500" />
            </div>
            <h4 className="font-semibold mb-1">Basado en Datos</h4>
            <p className="text-xs text-muted-foreground">
              IA analiza mercado real, competencia y mejores prácticas
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
              <Rocket className="h-6 w-6 text-purple-500" />
            </div>
            <h4 className="font-semibold mb-1">Listo para Validar</h4>
            <p className="text-xs text-muted-foreground">
              Recibe plan completo para validar con clientes reales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Type Selector Dialog */}
      <Dialog open={typeSelectorOpen} onOpenChange={setTypeSelectorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">Selecciona tu tipo de onboarding</DialogTitle>
            <DialogDescription className="sr-only">
              Elige la opción que mejor describa tu situación actual
            </DialogDescription>
          </DialogHeader>
          <OnboardingTypeSelector onSelectType={handleSelectType} />
        </DialogContent>
      </Dialog>

      {/* Wizard Modal */}
      <GenerativeOnboardingWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onComplete={handleWizardComplete}
        selectedType={selectedType}
      />

      {/* Preview Modal */}
      <GenerativeOnboardingPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
      </div>
    </FeatureGate>
  );
}
