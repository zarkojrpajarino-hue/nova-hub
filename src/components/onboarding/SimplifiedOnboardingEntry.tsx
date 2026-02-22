/**
 * PROFESSIONAL ONBOARDING ENTRY
 *
 * UX adapted from OPTIMUS-K:
 * - Clean, professional design
 * - Consistent spacing and typography
 * - Responsive grid layouts
 * - Visual validation feedback
 * - Loading states
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lightbulb,
  Rocket,
  Building2,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AIPreviewDashboard } from './AIPreviewDashboard';
import { generateAllArtifacts, type AIGeneratedArtifacts } from '@/lib/ai-generators';
import { toast } from 'sonner';

type OnboardingType = 'generative' | 'idea' | 'existing';

interface SimplifiedOnboardingEntryProps {
  projectId: string;
  onboardingType: OnboardingType;
  onComplete: (data: Record<string, unknown>) => void;
}

export function SimplifiedOnboardingEntry({
  projectId,
  onboardingType,
  onComplete
}: SimplifiedOnboardingEntryProps) {
  const [phase, setPhase] = useState<'input' | 'generating' | 'preview'>('input');
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [artifacts, setArtifacts] = useState<AIGeneratedArtifacts | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function to validate form data
  const canGenerate = () => {
    if (onboardingType === 'generative') {
      return !!formData.industry;
    }
    if (onboardingType === 'idea') {
      return !!formData.business_description && formData.business_description.length >= 10;
    }
    if (onboardingType === 'existing') {
      return formData.mrr || formData.customers;
    }
    return false;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setPhase('generating');

    try {
      const input = {
        project_id: projectId,
        onboarding_type: onboardingType,
        ...formData,
      };

      const generated = await generateAllArtifacts(input);
      setArtifacts(generated);
      setPhase('preview');

      toast.success('Business ecosystem generated successfully', {
        description: 'Review and approve the strategic documents'
      });
    } catch (error) {
      console.error('Error generating artifacts:', error);
      toast.error('Failed to generate documents', {
        description: 'Please try again or contact support'
      });
      setPhase('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAll = () => {
    if (!artifacts) return;

    onComplete({
      ...formData,
      ai_generated_artifacts: artifacts,
      approved_at: new Date().toISOString(),
    });
  };

  const handleEditArtifact = (artifactId: string) => {
    console.log('Edit artifact:', artifactId);
    toast.info('Edit functionality coming soon');
  };

  const handleApproveArtifact = (artifactId: string) => {
    console.log('Approve artifact:', artifactId);
    toast.success('Artifact approved');
  };

  // Phase 1: Input
  if (phase === 'input') {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {onboardingType === 'generative' && (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
              )}
              {onboardingType === 'idea' && (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
              )}
              {onboardingType === 'existing' && (
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              {onboardingType === 'generative' && 'Generate Business Ideas with AI'}
              {onboardingType === 'idea' && 'Validate Your Idea with AI'}
              {onboardingType === 'existing' && 'Analyze Your Business with AI'}
            </CardTitle>
            <CardDescription className="text-base">
              {onboardingType === 'generative' &&
                'AI will generate 3 personalized business ideas plus a complete strategic ecosystem'}
              {onboardingType === 'idea' &&
                'AI will analyze your idea and generate a comprehensive strategy'}
              {onboardingType === 'existing' &&
                'AI will extract insights and generate a complete diagnostic analysis'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Alert for context */}
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                This process takes approximately 15-20 seconds. AI will generate: Business Model Canvas,
                Buyer Personas, Sales Playbook, Competitive Analysis, and Financial Projections.
              </AlertDescription>
            </Alert>

            {/* Generative: Industry selection */}
            {onboardingType === 'generative' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="industry" className="text-base font-medium">
                      What industry interests you? <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      Select the industry where you'd like to explore business opportunities
                    </p>
                    <Select
                      value={formData.industry || ''}
                      onValueChange={(value) => setFormData({ ...formData, industry: value })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">SaaS / Software</SelectItem>
                        <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                        <SelectItem value="health">Health & Wellness</SelectItem>
                        <SelectItem value="education">Education / EdTech</SelectItem>
                        <SelectItem value="fintech">FinTech</SelectItem>
                        <SelectItem value="marketplace">Marketplace / Platform</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-base font-medium">
                      Your location <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      This helps us provide region-specific insights and market data
                    </p>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., Madrid, Spain"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Idea: Pitch */}
            {onboardingType === 'idea' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pitch" className="text-base font-medium">
                      Describe your business idea <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      Provide a clear description of your business concept. Include the problem you're solving,
                      your target customers, and your solution. Minimum 10 characters required.
                    </p>
                    <Textarea
                      id="pitch"
                      placeholder="Example: A mobile app that connects freelancers with local businesses looking for short-term projects. We solve the problem of freelancers struggling to find consistent work and businesses needing flexible talent..."
                      rows={6}
                      value={formData.business_description || ''}
                      onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {(formData.business_description || '').length} characters
                      </p>
                      {formData.business_description && formData.business_description.length >= 10 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Looks good!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Existing: Business Metrics */}
            {onboardingType === 'existing' && (
              <div className="space-y-6">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Current Business Metrics</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Provide at least one key metric to help AI understand your business stage
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mrr" className="text-base font-medium">
                        Monthly Recurring Revenue (MRR)
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        In USD
                      </p>
                      <Input
                        id="mrr"
                        type="number"
                        placeholder="5000"
                        value={formData.mrr || ''}
                        onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                        min="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="customers" className="text-base font-medium">
                        Number of Customers
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        Total active customers
                      </p>
                      <Input
                        id="customers"
                        type="number"
                        placeholder="150"
                        value={formData.customers || ''}
                        onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate() || isGenerating}
                className="w-full h-12"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating ecosystem...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Complete Business Ecosystem with AI
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              {!canGenerate() && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-3 justify-center">
                  <AlertCircle className="h-3 w-3" />
                  <span>Please complete the required fields above</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase 2: Generating
  if (phase === 'generating') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  AI is generating your business ecosystem
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Creating Business Model Canvas, Buyer Personas, Sales Playbook, and strategic analysis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>

              <p className="text-sm text-muted-foreground">
                This will take approximately 15-20 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Phase 3: Preview
  if (phase === 'preview' && artifacts) {
    const artifactsList = [
      {
        id: 'business_model_canvas',
        title: 'Business Model Canvas',
        description: '9 strategic blocks of your business model',
        icon: Building2,
        status: 'generated' as const,
        data: artifacts.business_model_canvas,
        quality_score: artifacts.business_model_canvas.confidence_score
      },
      {
        id: 'buyer_personas',
        title: `${artifacts.buyer_personas.length} Buyer Personas`,
        description: 'Detailed profiles of your ideal customers',
        icon: Rocket,
        status: 'generated' as const,
        data: artifacts.buyer_personas,
        quality_score: Math.round(
          artifacts.buyer_personas.reduce((sum, p) => sum + p.confidence_score, 0) / artifacts.buyer_personas.length
        )
      },
      {
        id: 'sales_playbook',
        title: 'Sales Playbook',
        description: 'Complete sales process with scripts and strategies',
        icon: Lightbulb,
        status: 'generated' as const,
        data: artifacts.sales_playbook,
        quality_score: artifacts.sales_playbook.confidence_score
      }
    ];

    return (
      <AIPreviewDashboard
        artifacts={artifactsList}
        onApproveAll={handleApproveAll}
        onEdit={handleEditArtifact}
        onApprove={handleApproveArtifact}
      />
    );
  }

  return null;
}
