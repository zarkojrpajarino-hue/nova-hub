/**
 * 🚀 IDEA FAST START
 *
 * Para usuarios CON IDEA que quieren validarla
 * Metodología: Lean Startup
 *
 * OBJETIVO: 4 minutos, 75-85% completion
 * INPUT: Pitch + nombre del proyecto + AutoFill opcional
 * OUTPUT: Business Model Canvas + 2 Buyer Personas + Sales Playbook inicial
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Rocket,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateAllArtifacts } from '@/lib/ai-generators';

interface IdeaFastStartProps {
  projectId: string;
  onComplete: (data: any) => void;
}

export function IdeaFastStart({ projectId, onComplete }: IdeaFastStartProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAutoFill, setShowAutoFill] = useState(false);
  const [formData, setFormData] = useState({
    project_name: '',
    business_description: '',
    use_autofill: false,
  });

  const canGenerate = () => {
    // Project name and business description are required
    return (
      formData.project_name.trim().length >= 3 &&
      formData.business_description.trim().length >= 50
    );
  };

  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);

    try {
      // Generate AI artifacts from pitch
      const input = {
        project_id: projectId,
        onboarding_type: 'idea',
        ...formData,
      };

      const artifacts = await generateAllArtifacts(input);

      // Complete Fast Start with generated data
      onComplete({
        ...formData,
        ai_generated_artifacts: artifacts,
        fast_start_type: 'idea',
        completed_at: new Date().toISOString(),
      });

      toast.success('Idea validated!', {
        description: 'Your business strategy is ready'
      });
    } catch (error) {
      console.error('Error validating idea:', error);
      toast.error('Failed to validate idea', {
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
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  AI is analyzing and validating your idea
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Creating Business Model Canvas, Buyer Personas, Sales Playbook, and competitive analysis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
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

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Rocket className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                Validate Your Idea with AI
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Tell us about your business idea and get a complete strategic analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert for context */}
          <Alert className="bg-blue-50 border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Fast Start:</strong> We'll analyze your idea in ~15 seconds. You can add more details later in Deep Setup (optional).
            </AlertDescription>
          </Alert>

          {/* Question 1: Project Name (REQUIRED) */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <Label htmlFor="project_name" className="text-base font-bold text-gray-900">
                1. Project name <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              What's the name of your business or project?
            </p>
            <Input
              id="project_name"
              type="text"
              placeholder="e.g., TaskFlow, FitCoach, EcoDelivery"
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
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <Label htmlFor="pitch" className="text-base font-bold text-gray-900">
                2. Describe your business idea <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              What problem do you solve? Who are your customers? What's your solution? (Minimum 50 characters)
            </p>
            <Textarea
              id="pitch"
              placeholder="Example: A mobile app that connects freelance designers with small businesses. We solve the problem of businesses struggling to find affordable, quality design work. Our platform provides vetted designers, transparent pricing, and project management tools..."
              rows={6}
              value={formData.business_description}
              onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
              className="resize-none ml-7 bg-white"
            />
            <div className="flex items-center justify-between ml-7">
              <p className="text-xs text-gray-600">
                {formData.business_description.length} / 50 characters minimum
              </p>
              {formData.business_description.length >= 50 && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Great description!</span>
                </div>
              )}
            </div>
          </div>

          {/* Question 3: AutoFill (OPTIONAL) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <Label className="text-base font-medium text-gray-900">
                3. Want to save time with AutoFill? <span className="text-gray-500 text-sm font-normal">(optional)</span>
              </Label>
            </div>
            <Alert className="bg-purple-50 border-purple-200">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                <strong>Save 15 minutes:</strong> AutoFill can extract information from your website, social media, LinkedIn, or competitors to enrich your business profile automatically.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => setShowAutoFill(!showAutoFill)}
              className="w-full border-purple-300 hover:bg-purple-50"
            >
              {showAutoFill ? 'Hide AutoFill Options' : 'Show AutoFill Options'}
            </Button>

            {showAutoFill && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  AutoFill will be available in Deep Setup. For now, continue with your manual input.
                </p>
                <p className="text-xs text-gray-500">
                  💡 After completing Fast Start, you can use AutoFill to extract data from:
                  website, LinkedIn, social media, competitors, and more.
                </p>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate() || isGenerating}
              className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Validating idea...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Validate Idea and Generate Strategy
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {!canGenerate() && (
              <div className="flex flex-col gap-2 text-sm mt-3">
                {formData.project_name.trim().length < 3 && (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please enter a project name (minimum 3 characters)</span>
                  </div>
                )}
                {formData.business_description.trim().length < 50 && (
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 py-2 px-4 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please provide a detailed description (minimum 50 characters)</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">
              ⚡ Fast Start takes ~4 minutes. You can complete Deep Setup later to unlock advanced tools and AutoFill.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
