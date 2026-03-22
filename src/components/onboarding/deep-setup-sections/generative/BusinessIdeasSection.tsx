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

import { useTranslation } from 'react-i18next';
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
  projectId: _projectId,
  initialIdeas,
  onComplete,
  onCancel,
}: BusinessIdeasSectionProps) {
  const { t } = useTranslation();
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [refinedNotes, setRefinedNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mock ideas if none provided
  const ideas: BusinessIdea[] = initialIdeas || [
    {
      id: '1',
      title: t('onboarding.aipoweredLocalBusinessMarketing'),
      description: 'SaaS platform that helps local businesses automate their social media and email marketing using AI',
      problem: t('onboarding.smallBusinessesLackTime'),
      solution: t('onboarding.automatedContentGenerationScheduling'),
      target_market: 'Local restaurants, retail stores, service providers (10-50 employees)',
      revenue_model: t('onboarding.saasSubscription99299monthSetup'),
      fit_score: 87,
    },
    {
      id: '2',
      title: t('onboarding.sustainablePackagingMarketplace'),
      description: t('onboarding.b2bMarketplaceConnectingEcommerce'),
      problem: t('onboarding.ecommerceBrandsStruggleTo'),
      solution: t('onboarding.curatedSupplierNetworkCarbon'),
      target_market: 'E-commerce businesses ($500k-$10M revenue)',
      revenue_model: t('onboarding.transactionFee812Premium'),
      fit_score: 78,
    },
    {
      id: '3',
      title: t('onboarding.remoteTeamCultureBuilder'),
      description: t('onboarding.platformForRemoteCompanies'),
      problem: t('onboarding.remoteTeamsLackSpontaneous'),
      solution: t('onboarding.virtualCoffeeBreaksTeam'),
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
        unlocked_tools: [t('onboarding.swotMatrix'), t('onboarding.marketResearch')],
      });

      toast.success(t('onboarding.businessIdeaAnalyzed'), {
        description: t('onboarding.swotMatrixAndMarket')
      });
    } catch (_error) {
      toast.error(t('onboarding.analysisFailed'), {
        description: t('onboarding.pleaseTryAgain')
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
              <h3 className="text-2xl font-bold">{t('onboarding.analyzingYourChosenBusiness')}</h3>
              <p className="text-muted-foreground max-w-md">{t('onboarding.runningMarketResearchCompetitive')}</p>
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
              <CardTitle className="text-2xl">{t('onboarding.refineYourBusinessIdeas')}</CardTitle>
              <CardDescription className="text-base">{t('onboarding.reviewThe3Aigenerated')}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>What you'll get:</strong>Market research, competitive SWOT matrix, opportunity scores, and initial validation roadmap for your chosen idea.</AlertDescription>
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
                    <p className="font-semibold text-gray-700">{t('onboarding.problem')}</p>
                    <p className="text-gray-600">{idea.problem}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">{t('onboarding.solution')}</p>
                    <p className="text-gray-600">{idea.solution}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">{t('onboarding.market')}</p>
                    <p className="text-gray-600">{idea.target_market}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-700">{t('onboarding.revenue')}</p>
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
                {selectedIdea === idea.id ? 'Selected': t('onboarding.selectThisIdea')}
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
            <CardDescription>{t('onboarding.addAnySpecificDetails')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t('onboarding.exampleIHaveExisting')}
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
        <Button variant="outline" onClick={onCancel}>{t('onboarding.cancel')}</Button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('onboarding.sectionProgress')}</p>
            <p className="text-lg font-bold text-purple-600">+10%</p>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!selectedIdea || isAnalyzing}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            size="lg"
          >
            <TrendingUp className="h-4 w-4" />Analyze Selected Idea<ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
