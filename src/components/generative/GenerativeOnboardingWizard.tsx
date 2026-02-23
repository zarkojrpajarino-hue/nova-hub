/**
 * GENERATIVE ONBOARDING WIZARD
 *
 * Flujo adaptativo según user_stage:
 * - sin_idea: Genera 5-10 ideas con IA → Usuario elige → Genera negocio completo
 * - idea_generada/idea_propia: Genera negocio completo directamente
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGenerativeBusiness } from '@/hooks/useGenerativeBusiness';
import { supabase } from '@/integrations/supabase/client';
import { BrandingPreviewSelector } from './BrandingPreviewSelector';
import { OnboardingStepGuide } from './OnboardingStepGuide';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Lightbulb,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Target,
  Clock,
  Euro,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerativeOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  selectedType?: 'sin_idea' | 'tengo_idea' | 'startup_funcionando' | null;
}

interface CompetitorEntry {
  name: string;
  description: string;
  logo?: string;
  keyFeatures?: string[];
}

interface CompetitorAnalysisResult {
  competitors: CompetitorEntry[];
  gaps?: string[];
  summary?: string;
}

interface MonetizationValidationResult {
  viable: boolean;
  analysis: string;
  challenges: string[];
}

interface SavedProgressData {
  type: string;
  step: string;
  timestamp: number;
  data: Record<string, unknown>;
}

interface BusinessIdeaEntry {
  id: string;
  idea_name: string;
  description: string;
  problem: string;
  solution: string;
  target_customer: string;
  fit_score?: number;
  market_size_score?: number;
  validation_ease_score?: number;
  estimated_timeline?: string;
  budget_needed?: string;
  first_steps?: string[];
  why_viable?: string;
}

type WizardStep =
  // Onboarding 1: Sin Idea
  | 'sin-idea-situation'
  | 'sin-idea-frustrations'
  | 'sin-idea-time'
  | 'sin-idea-capital'
  | 'sin-idea-type'
  // Onboarding 2: Tengo Idea
  | 'tengo-idea-sentence'
  | 'tengo-idea-target'
  | 'tengo-idea-monetization'
  | 'tengo-idea-built'
  | 'tengo-idea-competitors'
  | 'tengo-idea-resources'
  // Onboarding 3: Startup Funcionando
  | 'startup-web'
  | 'startup-social'
  | 'startup-tools'
  | 'startup-metrics'
  | 'startup-challenge'
  // Common steps
  | 'ideas-list'
  | 'generating-business'
  | 'preview-ready';

export function GenerativeOnboardingWizard({
  open,
  onOpenChange,
  onComplete,
  selectedType,
}: GenerativeOnboardingWizardProps) {
  const { projectId } = useParams();
  const [step, setStep] = useState<WizardStep>('interests');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [_userStage, setUserStage] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [brandingPreviewOpen, setBrandingPreviewOpen] = useState(false);

  // ONBOARDING 1: "Sin Idea" - 5 preguntas estratégicas
  const [currentSituation, setCurrentSituation] = useState('');
  const [frustrations, setFrustrations] = useState<string[]>([]);
  const [frustrationInput, setFrustrationInput] = useState('');
  const [availableTime, setAvailableTime] = useState('');
  const [initialCapital, setInitialCapital] = useState('');
  const [businessType, setBusinessType] = useState<string[]>([]);

  // ONBOARDING 2: "Tengo Idea" - 6 preguntas
  const [ideaOneSentence, setIdeaOneSentence] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [monetizationModel, setMonetizationModel] = useState('');
  const [hasWebsite, setHasWebsite] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [hasSocialMedia, setHasSocialMedia] = useState(false);
  const [socialMediaUrls, setSocialMediaUrls] = useState('');
  const [hasPrototype, setHasPrototype] = useState(false);
  const [prototypeDescription, setPrototypeDescription] = useState('');
  const [competitorsKnown, setCompetitorsKnown] = useState(false);
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [budget, setBudget] = useState(50);
  const [weeklyHours, setWeeklyHours] = useState(20);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // ONBOARDING 3: "Startup Funcionando" - 5 preguntas + métricas
  const [startupWebUrl, setStartupWebUrl] = useState('');
  const [startupSocialUrls, setStartupSocialUrls] = useState('');
  const [usesTools, setUsesTools] = useState<string[]>([]);
  const [mrr, setMrr] = useState('');
  const [activeCustomers, setActiveCustomers] = useState('');
  const [cac, setCac] = useState('');
  const [churnRate, setChurnRate] = useState('');
  const [mainChallenge, setMainChallenge] = useState('');
  const [isExtractingWebData, setIsExtractingWebData] = useState(false);

  // IA Enhancement States
  const [buyerPersonaSuggestions, setBuyerPersonaSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysisResult | null>(null);
  const [isAnalyzingCompetitors, setIsAnalyzingCompetitors] = useState(false);
  const [monetizationValidation, setMonetizationValidation] = useState<MonetizationValidationResult | null>(null);
  const [detectedIndustry, setDetectedIndustry] = useState<string | null>(null);
  const [savedProgress, setSavedProgress] = useState<SavedProgressData | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  const {
    generateIdeas,
    isGeneratingIdeas,
    generateBusiness,
    isGeneratingBusiness,
    selectIdea,
    isSelectingIdea,
    businessIdeas,
    loadingIdeas,
    refetchIdeas,
    pendingPreviews,
    refetchPreviews,
  } = useGenerativeBusiness(projectId);

  // Initialize step based on selectedType
  useEffect(() => {
    if (!open) return;

    switch (selectedType) {
      case 'sin_idea':
        setStep('sin-idea-situation');
        break;
      case 'tengo_idea':
        setStep('tengo-idea-sentence');
        break;
      case 'startup_funcionando':
        setStep('startup-web');
        break;
      default:
        setStep('sin-idea-situation');
    }
  }, [selectedType, open]);

  // Load project user_stage
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('user_stage')
        .eq('id', projectId)
        .single();

      if (data) {
        setUserStage(data.user_stage);
      }
    };

    loadProject();
  }, [projectId]);

  // Check if there are pending previews
  useEffect(() => {
    if (pendingPreviews && pendingPreviews.length > 0) {
      setStep('preview-ready');
    }
  }, [pendingPreviews]);

  // Load saved progress from localStorage
  useEffect(() => {
    if (!open) return;

    const savedData = localStorage.getItem('onboarding-progress');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Only show restore if it's the same type and less than 24 hours old
        const ageInHours = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        if (parsed.type === selectedType && ageInHours < 24) {
          setSavedProgress(parsed);
          setShowRestorePrompt(true);
        }
      } catch (_error) {
        // ignore malformed saved progress
      }
    }
  }, [open, selectedType]);

  // Auto-save progress to localStorage
  useEffect(() => {
    if (!open) return;

    const progressData = {
      type: selectedType,
      step,
      timestamp: Date.now(),
      data: {
        // Onboarding 1
        currentSituation,
        frustrations,
        availableTime,
        initialCapital,
        businessType,
        // Onboarding 2
        ideaOneSentence,
        targetCustomer,
        monetizationModel,
        hasWebsite,
        websiteUrl,
        hasSocialMedia,
        socialMediaUrls,
        hasPrototype,
        prototypeDescription,
        competitorsKnown,
        competitorUrls,
        budget,
        weeklyHours,
        technicalSkills,
        // Onboarding 3
        startupWebUrl,
        startupSocialUrls,
        usesTools,
        mrr,
        activeCustomers,
        cac,
        churnRate,
        mainChallenge,
      },
    };

    localStorage.setItem('onboarding-progress', JSON.stringify(progressData));
  }, [
    open, selectedType, step, currentSituation, frustrations, availableTime,
    initialCapital, businessType, ideaOneSentence, targetCustomer, monetizationModel,
    hasWebsite, websiteUrl, hasSocialMedia, socialMediaUrls, hasPrototype,
    prototypeDescription, competitorsKnown, competitorUrls, budget, weeklyHours,
    technicalSkills, startupWebUrl, startupSocialUrls, usesTools, mrr,
    activeCustomers, cac, churnRate, mainChallenge,
  ]);

  // Handlers for "Sin Idea" onboarding
  const handleAddFrustration = () => {
    if (frustrationInput.trim() && frustrations.length < 5) {
      setFrustrations([...frustrations, frustrationInput.trim()]);
      setFrustrationInput('');
    }
  };

  const handleRemoveFrustration = (index: number) => {
    setFrustrations(frustrations.filter((_, i) => i !== index));
  };

  const toggleBusinessType = (type: string) => {
    if (businessType.includes(type)) {
      setBusinessType(businessType.filter(t => t !== type));
    } else {
      setBusinessType([...businessType, type]);
    }
  };

  // Handlers for "Tengo Idea" onboarding
  const handleAddSkill = () => {
    if (skillInput.trim() && !technicalSkills.includes(skillInput.trim())) {
      setTechnicalSkills([...technicalSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setTechnicalSkills(technicalSkills.filter(s => s !== skill));
  };

  const handleExtractWebData = async () => {
    if (!websiteUrl.trim()) return;

    setIsExtractingWebData(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-business-info', {
        body: { url: websiteUrl }
      });

      if (error) throw error;

      // Auto-fill fields with extracted data
      if (data?.targetCustomer) setTargetCustomer(data.targetCustomer);
      if (data?.monetizationModel) setMonetizationModel(data.monetizationModel);

      toast.success('Información extraída automáticamente');
    } catch (error) {
      toast.error('No se pudo extraer información de la web');
    } finally {
      setIsExtractingWebData(false);
    }
  };

  // Handlers for "Startup Funcionando" onboarding
  const handleExtractStartupData = async () => {
    if (!startupWebUrl.trim()) return;

    setIsExtractingWebData(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-business-info', {
        body: { url: startupWebUrl }
      });

      if (error) throw error;

      // Detect industry from extracted data
      if (data?.description) {
        const industry = detectIndustry(data.description);
        setDetectedIndustry(industry);
      }

      toast.success('Información de startup extraída automáticamente');

      // Auto-analyze competitors after extraction
      setIsAnalyzingCompetitors(true);
      const { data: competitorData, error: competitorError } = await supabase.functions.invoke('analyze-competitors', {
        body: {
          startupUrl: startupWebUrl,
          industry: detectedIndustry || data?.industry
        }
      });

      if (!competitorError && competitorData) {
        setCompetitorAnalysis(competitorData);
        toast.success('Análisis de competencia completado automáticamente', { duration: 3000 });
      }

      setIsAnalyzingCompetitors(false);
    } catch (error) {
      toast.error('No se pudo extraer información de la startup');
      setIsExtractingWebData(false);
      setIsAnalyzingCompetitors(false);
    } finally {
      setIsExtractingWebData(false);
    }
  };

  const toggleTool = (tool: string) => {
    if (usesTools.includes(tool)) {
      setUsesTools(usesTools.filter(t => t !== tool));
    } else {
      setUsesTools([...usesTools, tool]);
    }
  };

  // ============================================
  // IA ENHANCEMENT FUNCTIONS
  // ============================================

  const handleGenerateBuyerPersona = async () => {
    if (!ideaOneSentence.trim()) {
      toast.error('Primero describe tu idea en el paso anterior');
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-buyer-persona', {
        body: { idea: ideaOneSentence }
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setBuyerPersonaSuggestions(data.suggestions);
        toast.success('Sugerencias generadas por IA');
      }
    } catch (error) {
      toast.error('No se pudo generar sugerencias. Inténtalo de nuevo.');
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const handleSelectPersonaSuggestion = (suggestion: string) => {
    setTargetCustomer(suggestion);
    toast.success('Sugerencia aplicada');
  };

  const handleValidateMonetization = async () => {
    if (!monetizationModel || !ideaOneSentence) return;

    try {
      const { data, error } = await supabase.functions.invoke('validate-monetization', {
        body: {
          model: monetizationModel,
          idea: ideaOneSentence,
          targetCustomer
        }
      });

      if (error) throw error;

      setMonetizationValidation(data);
    } catch (_error) {
      // validation is non-critical, skip silently
    }
  };

  const handleAutoAnalyzeCompetitors = async () => {
    if (!startupWebUrl.trim()) return;

    setIsAnalyzingCompetitors(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-competitors', {
        body: {
          startupUrl: startupWebUrl,
          industry: detectedIndustry
        }
      });

      if (error) throw error;

      setCompetitorAnalysis(data);
      toast.success('Análisis de competencia completado');
    } catch (error) {
      toast.error('No se pudo analizar la competencia');
    } finally {
      setIsAnalyzingCompetitors(false);
    }
  };

  const handleAnalyzeCompetitorUrls = async (urls: string) => {
    if (!urls.trim()) return;

    setIsAnalyzingCompetitors(true);
    try {
      const urlList = urls.split('\n').filter(u => u.trim());
      const { data, error } = await supabase.functions.invoke('analyze-competitor-urls', {
        body: { urls: urlList, myIdea: ideaOneSentence }
      });

      if (error) throw error;

      setCompetitorAnalysis(data);
      toast.success('Análisis visual de competidores completado');
    } catch (error) {
      toast.error('No se pudo analizar competidores');
    } finally {
      setIsAnalyzingCompetitors(false);
    }
  };

  const handleRestoreProgress = () => {
    if (!savedProgress) return;

    const data = savedProgress.data;

    // Restore Onboarding 1
    if (data.currentSituation) setCurrentSituation(data.currentSituation);
    if (data.frustrations) setFrustrations(data.frustrations);
    if (data.availableTime) setAvailableTime(data.availableTime);
    if (data.initialCapital) setInitialCapital(data.initialCapital);
    if (data.businessType) setBusinessType(data.businessType);

    // Restore Onboarding 2
    if (data.ideaOneSentence) setIdeaOneSentence(data.ideaOneSentence);
    if (data.targetCustomer) setTargetCustomer(data.targetCustomer);
    if (data.monetizationModel) setMonetizationModel(data.monetizationModel);
    if (data.hasWebsite !== undefined) setHasWebsite(data.hasWebsite);
    if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
    if (data.hasSocialMedia !== undefined) setHasSocialMedia(data.hasSocialMedia);
    if (data.socialMediaUrls) setSocialMediaUrls(data.socialMediaUrls);
    if (data.hasPrototype !== undefined) setHasPrototype(data.hasPrototype);
    if (data.prototypeDescription) setPrototypeDescription(data.prototypeDescription);
    if (data.competitorsKnown !== undefined) setCompetitorsKnown(data.competitorsKnown);
    if (data.competitorUrls) setCompetitorUrls(data.competitorUrls);
    if (data.budget !== undefined) setBudget(data.budget);
    if (data.weeklyHours !== undefined) setWeeklyHours(data.weeklyHours);
    if (data.technicalSkills) setTechnicalSkills(data.technicalSkills);

    // Restore Onboarding 3
    if (data.startupWebUrl) setStartupWebUrl(data.startupWebUrl);
    if (data.startupSocialUrls) setStartupSocialUrls(data.startupSocialUrls);
    if (data.usesTools) setUsesTools(data.usesTools);
    if (data.mrr) setMrr(data.mrr);
    if (data.activeCustomers) setActiveCustomers(data.activeCustomers);
    if (data.cac) setCac(data.cac);
    if (data.churnRate) setChurnRate(data.churnRate);
    if (data.mainChallenge) setMainChallenge(data.mainChallenge);

    setStep(savedProgress.step as WizardStep);
    setShowRestorePrompt(false);
    toast.success('Progreso restaurado');
  };

  const handleStartFresh = () => {
    localStorage.removeItem('onboarding-progress');
    setShowRestorePrompt(false);
    setSavedProgress(null);
    toast.info('Comenzando desde cero');
  };

  const detectIndustry = (text: string): string => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('saas') || lowerText.includes('software') || lowerText.includes('app')) {
      return 'SaaS';
    }
    if (lowerText.includes('e-commerce') || lowerText.includes('tienda') || lowerText.includes('vender')) {
      return 'E-commerce';
    }
    if (lowerText.includes('curso') || lowerText.includes('educación') || lowerText.includes('contenido')) {
      return 'Content/Education';
    }
    if (lowerText.includes('marketplace') || lowerText.includes('plataforma')) {
      return 'Marketplace';
    }
    if (lowerText.includes('consultoría') || lowerText.includes('servicio') || lowerText.includes('agencia')) {
      return 'Services';
    }

    return 'Other';
  };

  // Detect industry when idea changes
  useEffect(() => {
    if (ideaOneSentence) {
      const industry = detectIndustry(ideaOneSentence);
      setDetectedIndustry(industry);
    }
  }, [ideaOneSentence]);

  const handleGenerateIdeas = () => {
    if (frustrations.length < 3) {
      toast.error('Por favor añade al menos 3 frustraciones');
      return;
    }

    if (!currentSituation || !availableTime || !initialCapital || businessType.length === 0) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // Build enriched context for IA
    const enrichedData = {
      currentSituation,
      frustrations,
      availableTime,
      initialCapital,
      businessType,
    };

    generateIdeas(
      enrichedData,
      {
        onSuccess: () => {
          setStep('ideas-list');
          refetchIdeas();
        },
      }
    );
  };

  const handleGenerateFromIdea = () => {
    if (!ideaOneSentence || !targetCustomer || !monetizationModel) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    // Feedback loop: warn if missing optional but valuable data
    const missingData: string[] = [];
    if (!hasWebsite && !hasSocialMedia && !hasPrototype) {
      missingData.push('nada construido aún');
    }
    if (!competitorsKnown) {
      missingData.push('análisis de competencia');
    }
    if (technicalSkills.length === 0) {
      missingData.push('skills técnicos');
    }

    if (missingData.length > 0) {
      toast.warning(
        `La IA estimará: ${missingData.join(', ')}. Recomendamos completar estos datos para un plan más preciso.`,
        { duration: 5000 }
      );
    }

    const ideaData = {
      ideaOneSentence,
      targetCustomer,
      monetizationModel,
      websiteUrl: hasWebsite ? websiteUrl : null,
      socialMediaUrls: hasSocialMedia ? socialMediaUrls : null,
      prototypeDescription: hasPrototype ? prototypeDescription : null,
      competitorUrls: competitorsKnown ? competitorUrls : null,
      budget,
      weeklyHours,
      technicalSkills,
      industry: detectedIndustry,
    };

    setStep('generating-business');
    generateBusiness(
      ideaData,
      {
        onSuccess: () => {
          setStep('preview-ready');
          refetchPreviews();
          localStorage.removeItem('onboarding-progress'); // Clear saved progress on completion
        },
      }
    );
  };

  const handleGenerateFromStartup = async () => {
    if (!startupWebUrl) {
      toast.error('Por favor proporciona la URL de tu web');
      return;
    }

    // Feedback loop: warn if missing critical metrics
    const missingMetrics: string[] = [];
    if (!mrr && !activeCustomers) {
      missingMetrics.push('métricas de revenue/clientes');
    }
    if (!cac) {
      missingMetrics.push('CAC');
    }
    if (!churnRate) {
      missingMetrics.push('churn rate');
    }
    if (!mainChallenge) {
      missingMetrics.push('desafío principal');
    }

    if (missingMetrics.length > 0) {
      toast.warning(
        `La IA estimará: ${missingMetrics.join(', ')}. El análisis será más preciso con datos reales.`,
        { duration: 5000 }
      );
    }

    // Auto-analyze competitors before generating
    if (!competitorAnalysis) {
      await handleAutoAnalyzeCompetitors();
    }

    const startupData = {
      webUrl: startupWebUrl,
      socialUrls: startupSocialUrls || null,
      usesTools,
      mrr: mrr || null,
      activeCustomers: activeCustomers || null,
      cac: cac || null,
      churnRate: churnRate || null,
      mainChallenge,
      competitorAnalysis,
      industry: detectedIndustry,
    };

    setStep('generating-business');
    generateBusiness(
      startupData,
      {
        onSuccess: () => {
          setStep('preview-ready');
          refetchPreviews();
          localStorage.removeItem('onboarding-progress'); // Clear saved progress on completion
        },
      }
    );
  };

  const handleSelectIdea = (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    selectIdea(
      { ideaId },
      {
        onSuccess: () => {
          // Auto-generate business after selecting idea
          handleGenerateBusiness(ideaId);
        },
      }
    );
  };

  const handleGenerateBusiness = (ideaId: string) => {
    setStep('generating-business');
    generateBusiness(
      { ideaId },
      {
        onSuccess: () => {
          setStep('preview-ready');
          refetchPreviews();
        },
      }
    );
  };

  const _handleClose = () => {
    onOpenChange(false);
    if (onComplete) onComplete();
  };

  const renderStepContent = () => {
    switch (step) {
      // ============================================
      // ONBOARDING 1: "SIN IDEA" - 5 PASOS
      // ============================================

      case 'sin-idea-situation':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 1: ¿Qué haces actualmente?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cuéntanos tu situación actual. Esto nos ayuda a entender tus skills y recursos.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentSituation">Tu situación actual *</Label>
              <Textarea
                id="currentSituation"
                placeholder="Ej: Trabajo como diseñador gráfico freelance, tengo experiencia en branding y marketing digital..."
                value={currentSituation}
                onChange={(e) => setCurrentSituation(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={() => advanceToStep('sin-idea-frustrations')}
              disabled={!currentSituation.trim()}
              className="w-full"
              size="lg"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'sin-idea-frustrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 2: ¿Qué te frustra?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Añade 3-5 frustraciones de tu día a día. La IA las convertirá en oportunidades de negocio.
              </p>
            </div>

            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Ej: Es difícil encontrar diseñadores freelance confiables"
                value={frustrationInput}
                onChange={(e) => setFrustrationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFrustration();
                  }
                }}
              />
              <Button onClick={handleAddFrustration} disabled={frustrations.length >= 5} size="icon">
                <Plus size={16} />
              </Button>
            </div>

            {frustrations.length > 0 && (
              <div className="space-y-2">
                {frustrations.map((frustration, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                    <span className="text-lg">😤</span>
                    <p className="flex-1 text-sm">{frustration}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveFrustration(index)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {frustrations.length}/5 frustraciones (mínimo 3)
            </p>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('sin-idea-situation')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('sin-idea-time')}
                disabled={frustrations.length < 3}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'sin-idea-time':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 3: ¿Cuánto tiempo tienes?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esto determina qué tipo de negocio es viable para ti.
              </p>
            </div>

            <RadioGroup value={availableTime} onValueChange={setAvailableTime}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="full-time" id="full-time" />
                <Label htmlFor="full-time" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Full-time (40+ horas/semana)</div>
                  <p className="text-xs text-muted-foreground">Puedo dedicarme 100% al negocio</p>
                </Label>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="part-time" id="part-time" />
                <Label htmlFor="part-time" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Part-time (15-25 horas/semana)</div>
                  <p className="text-xs text-muted-foreground">Tengo trabajo pero puedo dedicar tardes/noches</p>
                </Label>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="weekends" id="weekends" />
                <Label htmlFor="weekends" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Solo fines de semana (&lt; 15 horas/semana)</div>
                  <p className="text-xs text-muted-foreground">Empiezo como side project</p>
                </Label>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </RadioGroup>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('sin-idea-frustrations')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('sin-idea-capital')}
                disabled={!availableTime}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'sin-idea-capital':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 4: ¿Cuánto capital inicial tienes?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La IA filtrará ideas según tu presupuesto disponible.
              </p>
            </div>

            <RadioGroup value={initialCapital} onValueChange={setInitialCapital}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="0" id="cap-0" />
                <Label htmlFor="cap-0" className="flex-1 cursor-pointer">
                  <div className="font-semibold">0€ - Bootstrapping puro</div>
                  <p className="text-xs text-muted-foreground">Solo tiempo y skills</p>
                </Label>
                <Euro className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="<1k" id="cap-1k" />
                <Label htmlFor="cap-1k" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Menos de 1,000€</div>
                  <p className="text-xs text-muted-foreground">Para herramientas básicas y validación</p>
                </Label>
                <Euro className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="1-5k" id="cap-5k" />
                <Label htmlFor="cap-5k" className="flex-1 cursor-pointer">
                  <div className="font-semibold">1,000€ - 5,000€</div>
                  <p className="text-xs text-muted-foreground">Para MVP y primeras campañas</p>
                </Label>
                <Euro className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="5k+" id="cap-5k-plus" />
                <Label htmlFor="cap-5k-plus" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Más de 5,000€</div>
                  <p className="text-xs text-muted-foreground">Capital para escalar rápido</p>
                </Label>
                <Euro className="h-5 w-5 text-muted-foreground" />
              </div>
            </RadioGroup>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('sin-idea-time')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('sin-idea-type')}
                disabled={!initialCapital}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'sin-idea-type':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 5: ¿Qué tipo de negocio prefieres?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona uno o varios. La IA priorizará ideas según tus preferencias.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  businessType.includes('producto-fisico')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleBusinessType('producto-fisico')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={businessType.includes('producto-fisico')}
                    onCheckedChange={() => toggleBusinessType('producto-fisico')}
                  />
                  <span className="font-semibold">Producto Físico</span>
                </div>
                <p className="text-xs text-muted-foreground">Vender objetos tangibles (e-commerce, dropshipping, etc.)</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  businessType.includes('servicio')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleBusinessType('servicio')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={businessType.includes('servicio')}
                    onCheckedChange={() => toggleBusinessType('servicio')}
                  />
                  <span className="font-semibold">Servicio</span>
                </div>
                <p className="text-xs text-muted-foreground">Ofrecer tu tiempo/expertise (consultoría, freelance, agencia)</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  businessType.includes('app-software')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleBusinessType('app-software')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={businessType.includes('app-software')}
                    onCheckedChange={() => toggleBusinessType('app-software')}
                  />
                  <span className="font-semibold">App / Software</span>
                </div>
                <p className="text-xs text-muted-foreground">Crear herramientas digitales (SaaS, mobile app, web app)</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  businessType.includes('contenido-educacion')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleBusinessType('contenido-educacion')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={businessType.includes('contenido-educacion')}
                    onCheckedChange={() => toggleBusinessType('contenido-educacion')}
                  />
                  <span className="font-semibold">Contenido / Educación</span>
                </div>
                <p className="text-xs text-muted-foreground">Crear y monetizar conocimiento (cursos, membership, coaching)</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('sin-idea-capital')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={handleGenerateIdeas}
                disabled={businessType.length === 0 || isGeneratingIdeas}
                className="w-full"
              >
                {isGeneratingIdeas ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando ideas con IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar ideas de negocio
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      // ============================================
      // ONBOARDING 2: "TENGO IDEA" - 6 PASOS
      // ============================================

      case 'tengo-idea-sentence':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 1: Explica tu idea en 1 frase</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sé conciso. La IA extraerá automáticamente: producto/servicio, target, monetización.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ideaOneSentence">Tu idea en 1 frase *</Label>
              <Textarea
                id="ideaOneSentence"
                placeholder="Ej: Una app móvil para que profesionales encuentren espacios de coworking por horas cerca de ellos"
                value={ideaOneSentence}
                onChange={(e) => setIdeaOneSentence(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Intenta incluir: qué haces, para quién, y qué problema resuelves
              </p>
            </div>

            <Button
              onClick={() => advanceToStep('tengo-idea-target')}
              disabled={!ideaOneSentence.trim()}
              className="w-full"
              size="lg"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'tengo-idea-target':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 2: ¿Para quién es esto?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Define tu cliente objetivo. La IA construirá un buyer persona preliminar.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="targetCustomer">Cliente objetivo *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateBuyerPersona}
                  disabled={!ideaOneSentence || isGeneratingSuggestions}
                >
                  {isGeneratingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-3 w-3" />
                      Sugerir con IA
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="targetCustomer"
                placeholder="Ej: Freelancers y nómadas digitales de 25-40 años que trabajan remotamente y necesitan flexibilidad"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Incluye: edad, profesión, pain points, comportamientos
              </p>
            </div>

            {/* IA Suggestions */}
            {buyerPersonaSuggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">✨ Sugerencias de IA (click para usar):</Label>
                <div className="flex flex-wrap gap-2">
                  {buyerPersonaSuggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5"
                      onClick={() => handleSelectPersonaSuggestion(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {detectedIndustry && (
              <div className="p-3 rounded-lg bg-blue-500/10 text-sm">
                🎯 Industria detectada: <strong>{detectedIndustry}</strong>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('tengo-idea-sentence')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('tengo-idea-monetization')}
                disabled={!targetCustomer.trim()}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'tengo-idea-monetization': {
        // Smart defaults based on detected industry
        const getRecommendedModel = () => {
          if (!detectedIndustry) return null;
          switch (detectedIndustry) {
            case 'SaaS':
              return 'subscription';
            case 'E-commerce':
              return 'one-time';
            case 'Content/Education':
              return 'freemium';
            case 'Marketplace':
              return 'marketplace';
            default:
              return null;
          }
        };

        const recommendedModel = getRecommendedModel();

        // Auto-select recommended model if not set
        if (recommendedModel && !monetizationModel) {
          setMonetizationModel(recommendedModel);
        }

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 3: ¿Cómo ganarás dinero?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona tu modelo de monetización. La IA validará su viabilidad.
              </p>
            </div>

            {detectedIndustry && recommendedModel && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                💡 <strong>Recomendado para {detectedIndustry}:</strong> {
                  recommendedModel === 'subscription' ? 'Suscripción (MRR)' :
                  recommendedModel === 'one-time' ? 'Pago único' :
                  recommendedModel === 'freemium' ? 'Freemium' :
                  recommendedModel === 'marketplace' ? 'Marketplace / Comisión' : ''
                }
              </div>
            )}

            <RadioGroup
              value={monetizationModel}
              onValueChange={(value) => {
                setMonetizationModel(value);
                handleValidateMonetization();
              }}
            >
              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="subscription" id="subscription" />
                <Label htmlFor="subscription" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Suscripción (MRR)</div>
                  <p className="text-xs text-muted-foreground">Cobro mensual/anual recurrente</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="one-time" id="one-time" />
                <Label htmlFor="one-time" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Pago único</div>
                  <p className="text-xs text-muted-foreground">Venta one-time de producto/servicio</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="freemium" id="freemium" />
                <Label htmlFor="freemium" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Freemium</div>
                  <p className="text-xs text-muted-foreground">Gratis con upgrade a premium</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="marketplace" id="marketplace" />
                <Label htmlFor="marketplace" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Marketplace / Comisión</div>
                  <p className="text-xs text-muted-foreground">% por transacción facilitada</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="ads" id="ads" />
                <Label htmlFor="ads" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Publicidad</div>
                  <p className="text-xs text-muted-foreground">Revenue por ads/sponsored content</p>
                </Label>
              </div>
            </RadioGroup>

            {/* Monetization Validation */}
            {monetizationValidation && (
              <div className={cn(
                "p-4 rounded-lg border",
                monetizationValidation.viable
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-yellow-500/10 border-yellow-500/20"
              )}>
                <div className="flex items-start gap-2 mb-2">
                  {monetizationValidation.viable ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Target className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {monetizationValidation.viable ? 'Modelo viable ✓' : 'Desafíos a considerar'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monetizationValidation.analysis}
                    </p>
                    {monetizationValidation.challenges && monetizationValidation.challenges.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {monetizationValidation.challenges.map((challenge: string, idx: number) => (
                          <li key={idx} className="text-xs flex items-start gap-1">
                            <span className="text-yellow-500">⚠️</span>
                            <span>{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('tengo-idea-target')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('tengo-idea-built')}
                disabled={!monetizationModel}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      }

      case 'tengo-idea-built':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 4: ¿Tienes algo ya construido?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pega URLs si existen. La IA extraerá información automáticamente.
              </p>
            </div>

            <div className="space-y-4">
              {/* Website */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasWebsite"
                    checked={hasWebsite}
                    onCheckedChange={(checked) => setHasWebsite(checked as boolean)}
                  />
                  <Label htmlFor="hasWebsite" className="font-semibold cursor-pointer">
                    Web / Landing page
                  </Label>
                </div>
                {hasWebsite && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://tu-web.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleExtractWebData}
                      disabled={!websiteUrl.trim() || isExtractingWebData}
                    >
                      {isExtractingWebData ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Social Media */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasSocialMedia"
                    checked={hasSocialMedia}
                    onCheckedChange={(checked) => setHasSocialMedia(checked as boolean)}
                  />
                  <Label htmlFor="hasSocialMedia" className="font-semibold cursor-pointer">
                    Redes sociales
                  </Label>
                </div>
                {hasSocialMedia && (
                  <Textarea
                    placeholder="Pega URLs de redes sociales (Instagram, LinkedIn, Twitter, etc.)"
                    value={socialMediaUrls}
                    onChange={(e) => setSocialMediaUrls(e.target.value)}
                    rows={2}
                  />
                )}
              </div>

              {/* Prototype */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPrototype"
                    checked={hasPrototype}
                    onCheckedChange={(checked) => setHasPrototype(checked as boolean)}
                  />
                  <Label htmlFor="hasPrototype" className="font-semibold cursor-pointer">
                    Prototipo / MVP
                  </Label>
                </div>
                {hasPrototype && (
                  <Textarea
                    placeholder="Describe tu prototipo o MVP actual"
                    value={prototypeDescription}
                    onChange={(e) => setPrototypeDescription(e.target.value)}
                    rows={2}
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('tengo-idea-monetization')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('tengo-idea-competitors')}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'tengo-idea-competitors':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 5: ¿Conoces competidores?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pega URLs de competidores o deja vacío para que la IA busque automáticamente.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="competitorsKnown"
                  checked={competitorsKnown}
                  onCheckedChange={(checked) => setCompetitorsKnown(checked as boolean)}
                />
                <Label htmlFor="competitorsKnown" className="font-semibold cursor-pointer">
                  Conozco competidores directos
                </Label>
              </div>

              {competitorsKnown && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Pega URLs de competidores (uno por línea)&#10;Ej:&#10;https://competitor1.com&#10;https://competitor2.com"
                      value={competitorUrls}
                      onChange={(e) => setCompetitorUrls(e.target.value)}
                      rows={4}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleAnalyzeCompetitorUrls(competitorUrls)}
                      disabled={!competitorUrls.trim() || isAnalyzingCompetitors}
                    >
                      {isAnalyzingCompetitors ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Click en ✨ para análisis visual automático
                  </p>
                </div>
              )}

              {!competitorsKnown && (
                <div className="p-4 rounded-lg bg-muted text-sm text-muted-foreground">
                  ✨ La IA buscará competidores automáticamente basándose en tu idea
                </div>
              )}
            </div>

            {/* Competitor Analysis Visual */}
            {competitorAnalysis && competitorAnalysis.competitors && (
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Análisis de Competencia:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {competitorAnalysis.competitors.slice(0, 4).map((comp: CompetitorEntry, idx: number) => (
                    <Card key={idx} className="p-3">
                      <div className="flex items-start gap-3">
                        {comp.logo && (
                          <img
                            src={comp.logo}
                            alt={comp.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{comp.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">{comp.description}</p>
                          {comp.keyFeatures && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {comp.keyFeatures.slice(0, 3).map((feature: string, fidx: number) => (
                                <Badge key={fidx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {competitorAnalysis.gaps && competitorAnalysis.gaps.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                      🎯 Oportunidades detectadas:
                    </p>
                    <ul className="space-y-1">
                      {competitorAnalysis.gaps.map((gap: string, idx: number) => (
                        <li key={idx} className="text-xs flex items-start gap-1">
                          <span className="text-green-500">✓</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('tengo-idea-built')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('tengo-idea-resources')}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'tengo-idea-resources':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 6: ¿Qué recursos tienes?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La IA ajustará el plan de validación según tus recursos disponibles.
              </p>
            </div>

            <div className="space-y-6">
              {/* Budget Slider */}
              <div className="space-y-3">
                <Label className="font-semibold">Presupuesto disponible: €{budget * 10}</Label>
                <Slider
                  value={[budget]}
                  onValueChange={(value) => setBudget(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>€0 - Bootstrapping</span>
                  <span>€1,000+</span>
                </div>
              </div>

              {/* Time Slider */}
              <div className="space-y-3">
                <Label className="font-semibold">Tiempo semanal: {weeklyHours} horas/semana</Label>
                <Slider
                  value={[weeklyHours]}
                  onValueChange={(value) => setWeeklyHours(value[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 hrs - Side project</span>
                  <span>60 hrs - Full-time</span>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="space-y-3">
                <Label className="font-semibold">Skills técnicos (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej: Diseño, Marketing, Programación..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button onClick={handleAddSkill} size="icon" variant="outline">
                    <Plus size={16} />
                  </Button>
                </div>

                {technicalSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {technicalSkills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {skill}
                        <X
                          size={12}
                          className="cursor-pointer hover:text-destructive"
                          onClick={() => handleRemoveSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('tengo-idea-competitors')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={handleGenerateFromIdea}
                disabled={isGeneratingBusiness}
                className="w-full"
              >
                {isGeneratingBusiness ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando negocio...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar negocio completo
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      // ============================================
      // ONBOARDING 3: "STARTUP FUNCIONANDO" - 5 PASOS
      // ============================================

      case 'startup-web':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 1: Web de tu startup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pega la URL de tu web. La IA extraerá automáticamente toda la información disponible.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startupWebUrl">URL de tu web *</Label>
              <div className="flex gap-2">
                <Input
                  id="startupWebUrl"
                  placeholder="https://tu-startup.com"
                  value={startupWebUrl}
                  onChange={(e) => setStartupWebUrl(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExtractStartupData}
                  disabled={!startupWebUrl.trim() || isExtractingWebData}
                >
                  {isExtractingWebData ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <LinkIcon className="h-3 w-3" />
                La IA extraerá: producto, target, monetización, features, etc.
              </p>
            </div>

            <Button
              onClick={() => advanceToStep('startup-social')}
              disabled={!startupWebUrl.trim()}
              className="w-full"
              size="lg"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );

      case 'startup-social':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 2: Redes sociales (opcional)</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Añade tus perfiles sociales para que la IA analice engagement, audiencia, contenido...
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startupSocialUrls">URLs de redes sociales</Label>
              <Textarea
                id="startupSocialUrls"
                placeholder="Pega URLs de tus perfiles (uno por línea)&#10;Ej:&#10;https://instagram.com/tu-startup&#10;https://linkedin.com/company/tu-startup&#10;https://twitter.com/tu-startup"
                value={startupSocialUrls}
                onChange={(e) => setStartupSocialUrls(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                La IA analizará: seguidores, engagement rate, tipo de contenido, frecuencia de posts
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('startup-web')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('startup-tools')}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'startup-tools':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 3: ¿Qué herramientas usas?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona las herramientas que ya tienes. Podremos conectarlas para obtener datos reales.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  usesTools.includes('google-analytics')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleTool('google-analytics')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={usesTools.includes('google-analytics')}
                    onCheckedChange={() => toggleTool('google-analytics')}
                  />
                  <span className="font-semibold">Google Analytics</span>
                </div>
                <p className="text-xs text-muted-foreground">Tráfico, conversiones, bounce rate</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  usesTools.includes('stripe')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleTool('stripe')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={usesTools.includes('stripe')}
                    onCheckedChange={() => toggleTool('stripe')}
                  />
                  <span className="font-semibold">Stripe / Pagos</span>
                </div>
                <p className="text-xs text-muted-foreground">MRR, churn, LTV automáticos</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  usesTools.includes('crm')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleTool('crm')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={usesTools.includes('crm')}
                    onCheckedChange={() => toggleTool('crm')}
                  />
                  <span className="font-semibold">CRM (HubSpot, Pipedrive...)</span>
                </div>
                <p className="text-xs text-muted-foreground">Pipeline, leads, conversion rate</p>
              </div>

              <div
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  usesTools.includes('email-marketing')
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => toggleTool('email-marketing')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={usesTools.includes('email-marketing')}
                    onCheckedChange={() => toggleTool('email-marketing')}
                  />
                  <span className="font-semibold">Email Marketing</span>
                </div>
                <p className="text-xs text-muted-foreground">Open rate, click rate, subscribers</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 text-sm text-blue-700 dark:text-blue-400">
              💡 Podrás conectar estas herramientas después para obtener métricas reales automáticamente
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('startup-social')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('startup-metrics')}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'startup-metrics':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 4: Métricas actuales</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Proporciona tus métricas clave. Si no las sabes exactamente, estimaciones sirven.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrr">MRR (Monthly Recurring Revenue)</Label>
                <Input
                  id="mrr"
                  placeholder="Ej: 5000"
                  value={mrr}
                  onChange={(e) => setMrr(e.target.value)}
                  type="number"
                />
                <p className="text-xs text-muted-foreground">En euros/mes</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activeCustomers">Clientes activos</Label>
                <Input
                  id="activeCustomers"
                  placeholder="Ej: 120"
                  value={activeCustomers}
                  onChange={(e) => setActiveCustomers(e.target.value)}
                  type="number"
                />
                <p className="text-xs text-muted-foreground">Usuarios/clientes que pagan</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cac">CAC (Customer Acquisition Cost)</Label>
                <Input
                  id="cac"
                  placeholder="Ej: 50"
                  value={cac}
                  onChange={(e) => setCac(e.target.value)}
                  type="number"
                />
                <p className="text-xs text-muted-foreground">Costo por adquirir un cliente (€)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="churnRate">Churn Rate</Label>
                <Input
                  id="churnRate"
                  placeholder="Ej: 5"
                  value={churnRate}
                  onChange={(e) => setChurnRate(e.target.value)}
                  type="number"
                />
                <p className="text-xs text-muted-foreground">% de clientes que cancelan/mes</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground">
              💡 Si no tienes alguna métrica, déjala vacía. La IA la estimará o te sugerirá cómo medirla.
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('startup-tools')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={() => advanceToStep('startup-challenge')}
                className="w-full"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'startup-challenge':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Paso 5: ¿Cuál es tu mayor desafío?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                La IA priorizará un plan de growth personalizado según tu desafío principal.
              </p>
            </div>

            <RadioGroup value={mainChallenge} onValueChange={setMainChallenge}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="acquisition" id="challenge-acquisition" />
                <Label htmlFor="challenge-acquisition" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Adquisición</div>
                  <p className="text-xs text-muted-foreground">No llegan suficientes usuarios/clientes</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="retention" id="challenge-retention" />
                <Label htmlFor="challenge-retention" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Retención</div>
                  <p className="text-xs text-muted-foreground">Churn alto, usuarios se van rápido</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="pmf" id="challenge-pmf" />
                <Label htmlFor="challenge-pmf" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Product-Market Fit</div>
                  <p className="text-xs text-muted-foreground">No está claro si el producto encaja con el mercado</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="ops" id="challenge-ops" />
                <Label htmlFor="challenge-ops" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Operaciones</div>
                  <p className="text-xs text-muted-foreground">Procesos caóticos, difícil escalar</p>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary">
                <RadioGroupItem value="cash" id="challenge-cash" />
                <Label htmlFor="challenge-cash" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Cash Flow</div>
                  <p className="text-xs text-muted-foreground">Problemas de liquidez, burn rate alto</p>
                </Label>
              </div>
            </RadioGroup>

            {/* Auto-analyzed Competitors */}
            {competitorAnalysis && competitorAnalysis.competitors && competitorAnalysis.competitors.length > 0 && (
              <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <Label className="text-sm font-semibold">Análisis de competencia completado automáticamente</Label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {competitorAnalysis.competitors.slice(0, 4).map((comp: CompetitorEntry, idx: number) => (
                    <div key={idx} className="p-2 rounded bg-background/50 border">
                      <p className="font-semibold truncate">{comp.name}</p>
                      <p className="text-muted-foreground line-clamp-1">{comp.description}</p>
                    </div>
                  ))}
                </div>
                {competitorAnalysis.summary && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Resumen:</strong> {competitorAnalysis.summary}
                  </p>
                )}
              </div>
            )}

            {/* Loading state for competitor analysis */}
            {isAnalyzingCompetitors && (
              <div className="p-3 rounded-lg bg-primary/10 flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analizando competencia automáticamente...</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('startup-metrics')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button
                onClick={handleGenerateFromStartup}
                disabled={!mainChallenge || isGeneratingBusiness}
                className="w-full"
              >
                {isGeneratingBusiness ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analizando startup...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analizar y optimizar
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      // ============================================
      // COMMON STEPS
      // ============================================

      case 'ideas-list':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ideas generadas por IA</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecciona la idea que más te guste. La IA generará el negocio completo: branding,
                productos, pricing, website...
              </p>
            </div>

            {loadingIdeas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : businessIdeas && businessIdeas.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {businessIdeas.map((idea: BusinessIdeaEntry) => (
                  <Card
                    key={idea.id}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary',
                      selectedIdeaId === idea.id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => handleSelectIdea(idea.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{idea.idea_name}</CardTitle>
                        {selectedIdeaId === idea.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <CardDescription className="text-sm">{idea.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="space-y-3 text-xs">
                        <div>
                          <strong>Problema:</strong> {idea.problem}
                        </div>
                        <div>
                          <strong>Solución:</strong> {idea.solution}
                        </div>
                        <div>
                          <strong>Cliente objetivo:</strong> {idea.target_customer}
                        </div>

                        {/* Viability Scores */}
                        {(idea.fit_score || idea.market_size_score || idea.validation_ease_score) && (
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                            {idea.fit_score && (
                              <div className="text-center p-2 rounded bg-primary/10">
                                <p className="font-bold text-primary">{idea.fit_score}%</p>
                                <p className="text-[10px] text-muted-foreground">Fit con perfil</p>
                              </div>
                            )}
                            {idea.market_size_score && (
                              <div className="text-center p-2 rounded bg-blue-500/10">
                                <p className="font-bold text-blue-600">{idea.market_size_score}%</p>
                                <p className="text-[10px] text-muted-foreground">Tamaño mercado</p>
                              </div>
                            )}
                            {idea.validation_ease_score && (
                              <div className="text-center p-2 rounded bg-green-500/10">
                                <p className="font-bold text-green-600">{idea.validation_ease_score}%</p>
                                <p className="text-[10px] text-muted-foreground">Fácil validar</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timeline & Budget */}
                        {(idea.estimated_timeline || idea.budget_needed) && (
                          <div className="flex gap-2 text-[11px]">
                            {idea.estimated_timeline && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
                                <Clock className="h-3 w-3" />
                                <span>{idea.estimated_timeline}</span>
                              </div>
                            )}
                            {idea.budget_needed && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
                                <Euro className="h-3 w-3" />
                                <span>{idea.budget_needed}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* First Steps */}
                        {idea.first_steps && idea.first_steps.length > 0 && (
                          <div className="pt-2 border-t">
                            <strong>Primeros 3 pasos:</strong>
                            <ol className="mt-1 space-y-1 ml-4 list-decimal">
                              {idea.first_steps.slice(0, 3).map((step: string, idx: number) => (
                                <li key={idx} className="text-muted-foreground">{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <strong className="text-primary">Por qué es viable:</strong>{' '}
                          {idea.why_viable}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No hay ideas generadas aún. Vuelve al paso anterior.
                </p>
              </div>
            )}

            {isSelectingIdea || isGeneratingBusiness ? (
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div>
                    <p className="font-semibold text-sm">
                      {isSelectingIdea
                        ? 'Seleccionando idea...'
                        : 'Generando negocio completo con IA...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Esto puede tomar 30-60 segundos. Estamos generando branding, productos,
                      pricing, logos...
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'generating-business':
        return (
          <div className="space-y-6 py-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-purple-500 animate-ping opacity-20" />
              </div>

              <h3 className="text-xl font-bold mb-2">Generando tu negocio...</h3>
              <p className="text-sm text-muted-foreground mb-6">
                La IA está creando todo lo necesario para tu negocio
              </p>

              <div className="w-full max-w-md space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Analizando mercado y competencia</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Generando branding (3 opciones)</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Creando logos con DALL-E</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Definiendo productos y pricing</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Construyendo website</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            </div>
          </div>
        );

      case 'preview-ready': {
        const latestPreview = pendingPreviews && pendingPreviews.length > 0 ? pendingPreviews[0] : null;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">¡Negocio generado!</h3>
              <p className="text-sm text-muted-foreground">
                Revisa las 3 opciones de branding y selecciona tu favorita
              </p>
            </div>

            {latestPreview && (
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-semibold">Generado para:</p>
                <p className="text-lg font-bold">{latestPreview.company_name || 'Tu negocio'}</p>
                <Badge variant="secondary">3 opciones de branding listas</Badge>
              </div>
            )}

            <Button
              onClick={() => setBrandingPreviewOpen(true)}
              className="w-full"
              size="lg"
              disabled={!latestPreview}
            >
              <Rocket className="mr-2 h-4 w-4" />
              Ver y elegir branding
            </Button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const getProgressValue = () => {
    // Onboarding 1: Sin Idea (5 steps + ideas-list + generating + preview = 8 total)
    if (step === 'sin-idea-situation') return 12;
    if (step === 'sin-idea-frustrations') return 25;
    if (step === 'sin-idea-time') return 37;
    if (step === 'sin-idea-capital') return 50;
    if (step === 'sin-idea-type') return 62;

    // Onboarding 2: Tengo Idea (6 steps + generating + preview = 8 total)
    if (step === 'tengo-idea-sentence') return 12;
    if (step === 'tengo-idea-target') return 25;
    if (step === 'tengo-idea-monetization') return 37;
    if (step === 'tengo-idea-built') return 50;
    if (step === 'tengo-idea-competitors') return 62;
    if (step === 'tengo-idea-resources') return 75;

    // Onboarding 3: Startup Funcionando (5 steps + generating + preview = 7 total)
    if (step === 'startup-web') return 14;
    if (step === 'startup-social') return 28;
    if (step === 'startup-tools') return 42;
    if (step === 'startup-metrics') return 57;
    if (step === 'startup-challenge') return 71;

    // Common steps
    if (step === 'ideas-list') return 75;
    if (step === 'generating-business') return 87;
    if (step === 'preview-ready') return 100;

    return 0;
  };

  const getStepLabel = () => {
    // Onboarding 1: Sin Idea
    if (step === 'sin-idea-situation') return 'Paso 1/5: Situación actual';
    if (step === 'sin-idea-frustrations') return 'Paso 2/5: Frustraciones';
    if (step === 'sin-idea-time') return 'Paso 3/5: Tiempo disponible';
    if (step === 'sin-idea-capital') return 'Paso 4/5: Capital inicial';
    if (step === 'sin-idea-type') return 'Paso 5/5: Tipo de negocio';

    // Onboarding 2: Tengo Idea
    if (step === 'tengo-idea-sentence') return 'Paso 1/6: Tu idea';
    if (step === 'tengo-idea-target') return 'Paso 2/6: Cliente objetivo';
    if (step === 'tengo-idea-monetization') return 'Paso 3/6: Monetización';
    if (step === 'tengo-idea-built') return 'Paso 4/6: ¿Qué tienes?';
    if (step === 'tengo-idea-competitors') return 'Paso 5/6: Competidores';
    if (step === 'tengo-idea-resources') return 'Paso 6/6: Recursos';

    // Onboarding 3: Startup Funcionando
    if (step === 'startup-web') return 'Paso 1/5: Web';
    if (step === 'startup-social') return 'Paso 2/5: Redes sociales';
    if (step === 'startup-tools') return 'Paso 3/5: Herramientas';
    if (step === 'startup-metrics') return 'Paso 4/5: Métricas';
    if (step === 'startup-challenge') return 'Paso 5/5: Desafío principal';

    // Common steps
    if (step === 'ideas-list') return 'Seleccionar idea';
    if (step === 'generating-business') return 'Generando negocio...';
    if (step === 'preview-ready') return 'Listo para revisar';

    return 'Onboarding';
  };

  // Helper to advance to next step and mark current as completed
  const advanceToStep = (nextStep: WizardStep) => {
    if (step && !completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
    setStep(nextStep);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full max-h-[90vh]">
          {/* Sidebar with step guide */}
          {selectedType && (
            <OnboardingStepGuide
              type={selectedType}
              currentStep={step}
              completedSteps={completedSteps}
              className="hidden md:flex flex-col overflow-y-auto"
            />
          )}

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <DialogTitle className="text-2xl">Generative Onboarding</DialogTitle>
                  <DialogDescription>De idea a negocio completo en 10 minutos</DialogDescription>
                </div>
              </div>
            </DialogHeader>

        {/* Restore Progress Banner */}
        {showRestorePrompt && savedProgress && (
          <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">Tienes un onboarding sin terminar</p>
                <p className="text-xs text-muted-foreground">
                  Guardado hace {Math.round((Date.now() - savedProgress.timestamp) / (1000 * 60))} minutos
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleStartFresh}>
                  Empezar de nuevo
                </Button>
                <Button size="sm" onClick={handleRestoreProgress}>
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="space-y-2 mb-6">
          <Progress value={getProgressValue()} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{getStepLabel()}</span>
            <span>{getProgressValue()}%</span>
          </div>
        </div>

        {/* Content */}
        {renderStepContent()}
          </div>
        </div>
      </DialogContent>

      {/* Branding Preview Selector - shown when user clicks "Ver y elegir branding" */}
      {pendingPreviews && pendingPreviews.length > 0 && (
        <BrandingPreviewSelector
          open={brandingPreviewOpen}
          onOpenChange={setBrandingPreviewOpen}
          previewId={pendingPreviews[0].id}
          options={pendingPreviews[0].branding_options || []}
          onApprove={(websiteUrl) => {
            setBrandingPreviewOpen(false);
            onOpenChange(false);
            if (onComplete) onComplete();
            if (websiteUrl) {
              window.open(websiteUrl, '_blank');
            }
          }}
        />
      )}
    </Dialog>
  );
}
