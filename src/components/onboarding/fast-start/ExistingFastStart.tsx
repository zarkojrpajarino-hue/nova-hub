/**
 * 🏢 EXISTING FAST START
 *
 * Para usuarios CON STARTUP EXISTENTE que quieren escalar
 * Metodología: Scaling Up + 4 Decisions Framework
 *
 * OBJETIVO: 5 minutos, 75-85% completion
 * INPUT: Métricas clave + Data Integration opcional
 * OUTPUT: Health Score + Growth diagnostic + 3 escenarios
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  DollarSign,
  Users,
  Database,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateAllArtifacts } from '@/lib/ai-generators';

interface ExistingFastStartProps {
  projectId: string;
  onComplete: (data: any) => void;
}

export function ExistingFastStart({ projectId, onComplete }: ExistingFastStartProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDataIntegration, setShowDataIntegration] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    business_description: '',
    mrr: '',
    customers: '',
    use_data_integration: false,
  });

  const canGenerate = () => {
    // Project name, description, and at least one metric (MRR or customers) are required
    return (
      formData.project_name.trim().length >= 3 &&
      formData.business_description.trim().length >= 30 &&
      (formData.mrr || formData.customers)
    );
  };

  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);

    try {
      // Generate AI artifacts from existing business data
      const input = {
        project_id: projectId,
        onboarding_type: 'existing',
        ...formData,
      };

      const artifacts = await generateAllArtifacts(input);

      // Complete Fast Start with generated data
      onComplete({
        ...formData,
        ai_generated_artifacts: artifacts,
        fast_start_type: 'existing',
        completed_at: new Date().toISOString(),
      });

      toast.success('Business analyzed!', {
        description: 'Your growth diagnostic is ready'
      });
    } catch (error) {
      console.error('Error analyzing business:', error);
      toast.error('Failed to analyze business', {
        description: 'Please try again or contact support'
      });
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  AI is analyzing your business
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Creating Health Score, Growth Diagnostic, Competitive Benchmarking, and 3 future scenarios
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>

              <p className="text-sm text-muted-foreground">
                This will take approximately 20-25 seconds
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                Analyze Your Business with AI
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Share your key metrics and get a complete growth diagnostic
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert for context */}
          <Alert className="bg-purple-50 border-purple-200">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <AlertDescription className="text-purple-900">
              <strong>Fast Start:</strong> We'll analyze your business in ~20 seconds. You can integrate your data sources later in Deep Setup (optional).
            </AlertDescription>
          </Alert>

          {/* Question 1: Company Name (REQUIRED) */}
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <Label htmlFor="project_name" className="text-base font-bold text-gray-900">
                1. Company name <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              What's the name of your company or startup?
            </p>
            <Input
              id="project_name"
              type="text"
              placeholder="e.g., Acme Inc, TechFlow, GrowthLabs"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="ml-7 bg-white"
            />
            {formData.project_name.trim().length >= 3 && (
              <div className="flex items-center gap-1 text-xs text-green-600 ml-7">
                <CheckCircle2 className="h-3 w-3" />
                <span>Looks good!</span>
              </div>
            )}
          </div>

          {/* Question 2: Business Description (REQUIRED) */}
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <Label htmlFor="description" className="text-base font-bold text-gray-900">
                2. What does your business do? <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              Brief description of your product/service and target market (Minimum 30 characters)
            </p>
            <Textarea
              id="description"
              placeholder="Example: B2B SaaS platform for project management targeting small marketing agencies. We help teams collaborate better with integrated workflows..."
              rows={4}
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              className="resize-none ml-7 bg-white"
            />
            <div className="flex items-center justify-between ml-7">
              <p className="text-xs text-gray-600">
                {formData.business_description.length} / 30 characters minimum
              </p>
              {formData.business_description.length >= 30 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Perfect!</span>
                </div>
              )}
            </div>
          </div>

          {/* Question 3: Key Metrics (AT LEAST ONE REQUIRED) */}
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <Label className="text-base font-bold text-gray-900">
                3. Key business metrics <span className="text-red-600">* (at least one)</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7 mb-4">
              Provide at least one metric to help AI understand your business stage
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
              <div className="space-y-2">
                <Label htmlFor="mrr" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Monthly Recurring Revenue (MRR)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="mrr"
                    type="number"
                    placeholder="5000"
                    value={formData.mrr}
                    onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
                    className="pl-7 bg-white"
                    min="0"
                  />
                </div>
                {formData.mrr && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    MRR provided
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customers" className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Number of Customers
                </Label>
                <Input
                  id="customers"
                  type="number"
                  placeholder="150"
                  value={formData.customers}
                  onChange={(e) => setFormData({ ...formData, customers: e.target.value })}
                  className="bg-white"
                  min="0"
                />
                {formData.customers && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Customer count provided
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Question 4: Data Integration (OPTIONAL) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-pink-600" />
              <Label className="text-base font-medium text-gray-900">
                4. Want to connect your data sources? <span className="text-gray-500 text-sm font-normal">(optional)</span>
              </Label>
            </div>
            <Alert className="bg-pink-50 border-pink-200">
              <Info className="h-4 w-4 text-pink-600" />
              <AlertDescription className="text-pink-900">
                <strong>Save 30-35 minutes:</strong> Data Integration can automatically import your metrics from Stripe, Google Analytics, Mixpanel, and more.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => setShowDataIntegration(!showDataIntegration)}
              className="w-full border-pink-300 hover:bg-pink-50"
            >
              {showDataIntegration ? 'Hide Data Integration Options' : 'Show Data Integration Options'}
            </Button>

            {showDataIntegration && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Data Integration will be available in Deep Setup. For now, continue with your manual input.
                </p>
                <p className="text-xs text-gray-500">
                  💡 After completing Fast Start, you can connect: Stripe, Google Analytics, Mixpanel, LinkedIn, Twitter, and more to auto-populate your data.
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate() || isGenerating}
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing business...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Analyze Business and Generate Diagnostic
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {!canGenerate() && (
              <div className="flex flex-col gap-2 text-sm mt-3">
                {formData.project_name.trim().length < 3 && (
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please enter a company name (minimum 3 characters)</span>
                  </div>
                )}
                {formData.business_description.trim().length < 30 && (
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please provide a brief description (minimum 30 characters)</span>
                  </div>
                )}
                {!formData.mrr && !formData.customers && (
                  <div className="flex items-center gap-2 text-purple-700 bg-purple-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please provide at least one metric (MRR or customer count)</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">
              ⚡ Fast Start takes ~5 minutes. You can complete Deep Setup later to unlock advanced tools and Data Integration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
