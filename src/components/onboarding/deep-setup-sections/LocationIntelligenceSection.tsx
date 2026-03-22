/**
 * 🌍 LOCATION INTELLIGENCE SECTION
 *
 * Local context generation: investors, accelerators, costs, grants, regulations
 * Reusable across all onboarding types (Generative, Idea, Existing)
 *
 * UNLOCKS:
 * - Investor Map
 * - Grant Finder
 * - Local Market Data
 *
 * PROGRESS: +8%
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Loader2,
  ArrowRight,
  Building2,
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface LocationInvestor {
  name: string;
  type: string;
  stage: string;
  focus: string;
  website: string;
}

interface LocationAccelerator {
  name: string;
  duration: string;
  investment: string;
  website: string;
}

interface LocationGrant {
  name: string;
  amount: string;
  type: string;
  focus: string;
}

interface LocationData {
  location: string;
  investors: LocationInvestor[];
  accelerators: LocationAccelerator[];
  costs: Record<string, string>;
  grants: LocationGrant[];
  events: string[];
}

interface LocationCompleteData {
  section_id: string;
  location: string;
  location_data: LocationData;
  unlocked_tools: string[];
}

interface LocationIntelligenceSectionProps {
  projectId: string;
  onboardingType: 'generative' | 'idea' | 'existing';
  onComplete: (data: LocationCompleteData) => void;
  onCancel: () => void;
}

export function LocationIntelligenceSection({
  projectId: _projectId,
  onboardingType: _onboardingType,
  onComplete,
  onCancel,
}: LocationIntelligenceSectionProps) {
  const { t } = useTranslation();
  const [location, setLocation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const handleGenerate = async () => {
    if (!location.trim()) return;

    setIsGenerating(true);

    try {
      // Simulate AI generation (in real implementation, call AI service)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Mock location intelligence data
      const mockData = {
        location,
        investors: [
          {
            name: t('onboarding.seayaVentures'),
            type: 'VC',
            stage: 'Series A-B',
            focus: t('onboarding.saasMarketplace'),
            website: 'https://seaya.vc',
          },
          {
            name: t('onboarding.kFund'),
            type: 'VC',
            stage: 'Seed, Series A',
            focus: 'Deep Tech, B2B',
            website: 'https://kfund.vc',
          },
          {
            name: t('onboarding.jmeVentures'),
            type: 'VC',
            stage: t('onboarding.preseedSeed'),
            focus: t('onboarding.consumerMarketplace'),
            website: 'https://jmeventures.com',
          },
        ],
        accelerators: [
          {
            name: t('onboarding.lanzadera'),
            duration: '6 months',
            investment: '€50k for 7% equity',
            website: 'https://lanzadera.es',
          },
          {
            name: t('onboarding.startupValencia'),
            duration: '4 months',
            investment: t('onboarding.nonequity'),
            website: 'https://startupvalencia.com',
          },
        ],
        costs: {
          office_space: '€200-400/month per desk',
          living_cost: '€1,200-1,800/month',
          incorporation: '€300-600',
          accountant: '€100-200/month',
        },
        grants: [
          {
            name: 'CDTI NEOTEC',
            amount: '€250k-€300k',
            type: t('onboarding.loanGrant'),
            focus: t('onboarding.deepTechStartups'),
          },
          {
            name: t('onboarding.enisa'),
            amount: '€25k-€300k',
            type: t('onboarding.participativeLoan'),
            focus: t('onboarding.earlystageStartups'),
          },
        ],
        events: [
          'Valencia Digital Summit (Oct)',
          'South Summit (Jun)',
          'Startup Valencia Meetups (Monthly)',
        ],
      };

      setLocationData(mockData);

      toast.success(t('onboarding.locationIntelligenceGenerated'), {
        description: t('onboarding.investorMapAndGrant')
      });
    } catch (_error) {
      toast.error(t('onboarding.generationFailed'), {
        description: t('onboarding.pleaseTryAgain')
      });
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    onComplete({
      section_id: 'location-intelligence',
      location,
      location_data: locationData,
      unlocked_tools: [t('onboarding.investorMap'), t('onboarding.grantFinder'), t('onboarding.localMarketData')],
    });
  };

  if (isGenerating) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-12 pb-12">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">
                Analyzing local ecosystem for {location}
              </h3>
              <p className="text-muted-foreground max-w-md">{t('onboarding.gatheringDataOnInvestors')}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locationData) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{t('onboarding.locationIntelligenceComplete')}</CardTitle>
                <CardDescription className="text-base">
                  Local ecosystem data for {locationData.location}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Investors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />{t('onboarding.localInvestors')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationData.investors.map((inv: LocationInvestor, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{inv.name}</h4>
                  <p className="text-sm text-gray-600">
                    {inv.type} • {inv.stage}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Focus: {inv.focus}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Accelerators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />{t('onboarding.acceleratorsIncubators')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationData.accelerators.map((acc: LocationAccelerator, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{acc.name}</h4>
                  <p className="text-sm text-gray-600">{acc.duration}</p>
                  <p className="text-xs text-gray-500 mt-1">{acc.investment}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Costs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />{t('onboarding.localCosts')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Office Space:</span>
                <span className="font-semibold">{locationData.costs.office_space}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Living Cost:</span>
                <span className="font-semibold">{locationData.costs.living_cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Incorporation:</span>
                <span className="font-semibold">{locationData.costs.incorporation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accountant:</span>
                <span className="font-semibold">{locationData.costs.accountant}</span>
              </div>
            </CardContent>
          </Card>

          {/* Grants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />{t('onboarding.availableGrants')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationData.grants.map((grant: LocationGrant, idx: number) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{grant.name}</h4>
                  <p className="text-sm text-gray-600">
                    {grant.amount} • {grant.type}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{grant.focus}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-600" />{t('onboarding.startupEventsCommunity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {locationData.events.map((event: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{event}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={onCancel}>{t('onboarding.cancel')}</Button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">{t('onboarding.sectionProgress')}</p>
              <p className="text-lg font-bold text-green-600">+8%</p>
            </div>
            <Button
              onClick={handleComplete}
              className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              <CheckCircle2 className="h-4 w-4" />Complete Section<ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{t('onboarding.locationIntelligence')}</CardTitle>
              <CardDescription className="text-base">{t('onboarding.getLocalInsightsInvestors')}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>What you'll get:</strong>Local investor database, accelerator programs, cost estimates, available grants, regulatory info, and startup events.</AlertDescription>
      </Alert>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t('onboarding.enterYourLocation')}</CardTitle>
          <CardDescription>{t('onboarding.cityRegionOrCountry')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="location">{t('onboarding.location')}</Label>
            <Input
              id="location"
              type="text"
              placeholder={t('onboarding.egValenciaSpain')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Be specific for better results (e.g., t('onboarding.barcelona') instead of t('onboarding.spain'))
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>{t('onboarding.cancel')}</Button>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">{t('onboarding.sectionProgress')}</p>
            <p className="text-lg font-bold text-blue-600">+8%</p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!location.trim() || isGenerating}
            className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            size="lg"
          >
            <TrendingUp className="h-4 w-4" />Generate Location Intelligence<ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
