/**
 * 🎯 GENERATIVE FAST START
 *
 * Para usuarios SIN IDEA que quieren emprender
 * Metodología: Business Model Generation
 *
 * OBJETIVO: 3 minutos, 75-85% completion
 * INPUT: Mínimo necesario para generar 3 opciones de negocio con IA
 * OUTPUT: 3 business ideas + Business Model Canvas inicial
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Loader2,
  ArrowRight,
  AlertCircle,
  Sparkles,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { generateAllArtifacts } from '@/lib/ai-generators';

interface GenerativeFastStartProps {
  projectId: string;
  onComplete: (data: Record<string, unknown>) => void;
}

export function GenerativeFastStart({ projectId, onComplete }: GenerativeFastStartProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    industry: '',
    location: '',
    skills: '',
    investment_capacity: '',
    time_commitment: '',
  });

  const canGenerate = () => {
    // Only industry is required
    return !!formData.industry;
  };

  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);

    try {
      // Generate AI artifacts with minimal input
      const input = {
        project_id: projectId,
        onboarding_type: 'generative',
        ...formData,
      };

      const artifacts = await generateAllArtifacts(input);

      // Complete Fast Start with generated data
      onComplete({
        ...formData,
        project_name: `Proyecto ${formData.industry}`,
        business_description: `Proyecto generado con IA en industria ${formData.industry}`,
        ai_generated_artifacts: artifacts,
        fast_start_type: 'generative',
        completed_at: new Date().toISOString(),
      });

      toast.success('Business ideas generated!', {
        description: '3 personalized business options ready'
      });
    } catch (error) {
      console.error('Error generating ideas:', error);
      toast.error('Failed to generate ideas', {
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
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">
                  AI is generating 3 business ideas for you
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Creating personalized business options based on your industry interest, location, and profile
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-bounce" style={{ animationDelay: '300ms' }} />
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
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Lightbulb className="h-7 w-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl md:text-3xl">
                Generate Business Ideas with AI
              </CardTitle>
              <CardDescription className="text-base mt-1">
                Answer 5 quick questions and get 3 personalized business opportunities
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert for context */}
          <Alert className="bg-amber-50 border-amber-200">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong>Fast Start:</strong> We'll generate 3 business ideas in ~15 seconds. You can refine them later in Deep Setup (optional).
            </AlertDescription>
          </Alert>

          {/* Question 1: Industry (REQUIRED) */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <Label htmlFor="industry" className="text-base font-bold text-gray-900">
                1. What industry interests you? <span className="text-red-600">*</span>
              </Label>
            </div>
            <p className="text-sm text-gray-700 ml-7">
              Select the industry where you'd like to explore business opportunities
            </p>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saas">SaaS / Software</SelectItem>
                <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="education">Education / EdTech</SelectItem>
                <SelectItem value="fintech">FinTech</SelectItem>
                <SelectItem value="marketplace">Marketplace / Platform</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="services">Professional Services</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question 2: Location (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <Label htmlFor="location" className="text-base font-medium text-gray-900">
                2. Your location <span className="text-gray-500 text-sm font-normal">(optional)</span>
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              This helps us provide region-specific market insights and local opportunities
            </p>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Madrid, Spain"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="ml-7"
            />
          </div>

          {/* Question 3: Skills (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gray-500" />
              <Label htmlFor="skills" className="text-base font-medium text-gray-900">
                3. Your main skills or background <span className="text-gray-500 text-sm font-normal">(optional)</span>
              </Label>
            </div>
            <p className="text-sm text-gray-600 ml-7">
              e.g., "Marketing", "Engineering", "Sales", "Design"
            </p>
            <Input
              id="skills"
              type="text"
              placeholder="Your professional background"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="ml-7"
            />
          </div>

          {/* Question 4: Investment Capacity (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-500" />
              <Label htmlFor="investment" className="text-base font-medium text-gray-900">
                4. Initial investment capacity <span className="text-gray-500 text-sm font-normal">(optional)</span>
              </Label>
            </div>
            <Select
              value={formData.investment_capacity}
              onValueChange={(value) => setFormData({ ...formData, investment_capacity: value })}
            >
              <SelectTrigger className="w-full ml-7">
                <SelectValue placeholder="Select your investment range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-5k">$0 - $5,000 (Bootstrap)</SelectItem>
                <SelectItem value="5k-25k">$5,000 - $25,000</SelectItem>
                <SelectItem value="25k-100k">$25,000 - $100,000</SelectItem>
                <SelectItem value="100k+">$100,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question 5: Time Commitment (optional) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <Label htmlFor="time" className="text-base font-medium text-gray-900">
                5. Time you can dedicate <span className="text-gray-500 text-sm font-normal">(optional)</span>
              </Label>
            </div>
            <Select
              value={formData.time_commitment}
              onValueChange={(value) => setFormData({ ...formData, time_commitment: value })}
            >
              <SelectTrigger className="w-full ml-7">
                <SelectValue placeholder="Select your time availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="part-time">Part-time (10-20 hrs/week)</SelectItem>
                <SelectItem value="full-time">Full-time (40+ hrs/week)</SelectItem>
                <SelectItem value="side-project">Side project (5-10 hrs/week)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CTA Button */}
          <div className="pt-6 border-t">
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate() || isGenerating}
              className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate 3 Business Ideas with AI
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {!canGenerate() && (
              <div className="flex items-center gap-2 text-sm text-amber-700 mt-3 justify-center bg-amber-50 py-2 px-4 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Please select an industry to continue</span>
              </div>
            )}

            <p className="text-xs text-center text-gray-500 mt-4">
              ⚡ Fast Start takes ~3 minutes. You can complete Deep Setup later to unlock advanced tools.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
