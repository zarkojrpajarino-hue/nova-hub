/**
 * 🎯 BUSINESS IDEAS REFINEMENT SECTION
 *
 * Deep dive into 3 AI-generated business ideas
 * User selects their favorite and we analyze it deeply
 *
 * UNLOCKS:
 * - SWOT Matrix
 * - Market Research Dashboard
 *
 * PROGRESS: +10%
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  CheckCircle2,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  target_market: string;
  revenue_model: string;
  fit_score: number;
}

interface BusinessIdeasSectionProps {
  projectId: string;
  initialIdeas?: BusinessIdea[];
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function BusinessIdeasSection({
  projectId,
  initialIdeas,
  onComplete,
  onCancel,
}: BusinessIdeasSectionProps) {
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [refinedNotes, setRefinedNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock ideas if none provided
  const ideas: BusinessIdea[] = initialIdeas || [
    {
      id: '1',
      title: 'AI-Powered Local Business Marketing Platform',
      description: 'SaaS platform that helps local businesses automate their social media and email marketing using AI',
      problem: 'Small businesses lack time and expertise for digital marketing',
      solution: 'Automated content generation, scheduling, and analytics tailored for local businesses',
      target_market: 'Local restaurants, retail stores, service providers (10-50 employees)',
      revenue_model: 'SaaS subscription ($99-299/month) + setup fee',
      fit_score: 87,
    },
    {
      id: '2',
      title: 'Sustainable Packaging Marketplace',
      description: 'B2B marketplace connecting e-commerce businesses with sustainable packaging suppliers',
      problem: 'E-commerce brands struggle to find eco-friendly packaging options at scale',
      solution: 'Curated supplier network + carbon footprint calculator + bulk ordering',
      target_market: 'E-commerce businesses ($500k-$10M revenue)',
      revenue_model: 'Transaction fee (8-12%) + premium listings for suppliers',
      fit_score: 78,
    },
    {
      id: '3',
      title: 'Remote Team Culture Builder',
      description: 'Platform for remote companies to build culture through virtual events and team rituals',
      problem: 'Remote teams lack spontaneous interactions and culture-building moments',
      solution: 'Virtual coffee breaks, team rituals, culture analytics, and event planning tools',
      target_market: 'Remote-first companies (20-200 employees)',
      revenue_model: 'Per-seat subscription ($10-15/user/month)',
      fit_score: 82,
    },
  ];

  const handleAnalyze = async () => {
    if (!selectedIdea) return;

    setIsAnalyzing(true);

    try {
      // Simulate AI analysis (in real implementation, call AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Complete section with data
      const selectedIdeaData = ideas.find(i => i.id === selectedIdea);
      onComplete({
        section_id: 'business-ideas',
        selected_idea: selectedIdeaData,
        refined_notes: refinedNotes,
        analysis_completed: true,
        unlocked_tools: ['SWOT Matrix', 'Market Research'],
      });

      toast.success('Business idea analyzed!', {
        description: 'SWOT Matrix and Market Research tools unlocked'
      });
    } catch (error) {
      console.error('Error analyzing idea:', error);
      toast.error('Analysis failed', {
        description: 'Please try again'
      });
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                Analyzing your chosen business idea
              </h3>
              <p className="text-muted-foreground max-w-md">
                Running market research, competitive analysis, SWOT matrix, and opportunity assessment
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Refine Your Business Ideas</CardTitle>
              <CardDescription className="text-base">
                Review the 3 AI-generated ideas and select your favorite for deep analysis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>What you'll get:</strong> Market research, competitive SWOT matrix, opportunity scores, and initial validation roadmap for your chosen idea.
        </AlertDescription>
      </Alert>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ideas.map((idea) => (
          <Card
            key={idea.id}
            className={`
              cursor-pointer transition-all hover:shadow-lg
              ${selectedIdea === idea.id ? 'border-2 border-purple-500 bg-purple-50/50' : 'hover:border-purple-300'}
            `}
            onClick={() => setSelectedIdea(idea.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge
                  variant={idea.fit_score >= 85 ? 'default' : 'secondary'}
                  className="gap-1"
                >
                  <Target className="h-3 w-3" />
                  {idea.fit_score}% Fit
                </Badge>
                {selectedIdea === idea.id && (
                  <CheckCircle2 className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{idea.title}</CardTitle>
              <CardDescription className="text-sm">
                {idea.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">Problem</p>
                    <p className="text-gray-600">{idea.problem}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">Solution</p>
                    <p className="text-gray-600">{idea.solution}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">Market</p>
                    <p className="text-gray-600">{idea.target_market}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">Revenue</p>
                    <p className="text-gray-600">{idea.revenue_model}</p>
                  </div>
                </div>
              </div>

              <Button
                variant={selectedIdea === idea.id ? 'default' : 'outline'}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIdea(idea.id);
                }}
              >
                {selectedIdea === idea.id ? 'Selected' : 'Select This Idea'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refinement Notes */}
      {selectedIdea && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Additional Context (Optional)</CardTitle>
            <CardDescription>
              Add any specific details, constraints, or preferences for this idea
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Example: I have existing contacts in this industry, I want to focus on Spanish-speaking markets first, I prefer B2B over B2C, etc."
              rows={4}
              value={refinedNotes}
              onChange={(e) => setRefinedNotes(e.target.value)}
              className="resize-none"
            />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">Section Progress</p>
            <p className="text-lg font-bold text-purple-600">+10%</p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!selectedIdea || isAnalyzing}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            <TrendingUp className="h-4 w-4" />
            Analyze Selected Idea
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
