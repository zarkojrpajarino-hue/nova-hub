/**
 * REAL ESTATE / PROPTECH SPECIFIC QUESTIONS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Home, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { RealEstatePropTechAnswers } from '@/types/ultra-onboarding';

interface RealEstatePropTechQuestionsProps {
  answers: Partial<RealEstatePropTechAnswers>;
  onChange: (answers: Partial<RealEstatePropTechAnswers>) => void;
}

export function RealEstatePropTechQuestions({ answers, onChange }: RealEstatePropTechQuestionsProps) {
  const updateAnswer = <K extends keyof RealEstatePropTechAnswers>(key: K, value: RealEstatePropTechAnswers[K]) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🏠 Real Estate / PropTech - Preguntas Específicas</h2>
      </div>

      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-indigo-600" />
            Categoría de PropTech
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.proptech_category} onValueChange={(value) => updateAnswer('proptech_category', value as RealEstatePropTechAnswers['proptech_category'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="marketplace" id="marketplace" />
              <Label htmlFor="marketplace" className="cursor-pointer">Marketplace (Zillow-like)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="property_management" id="prop_mgmt" />
              <Label htmlFor="prop_mgmt" className="cursor-pointer">Property management software</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="ibuyer" id="ibuyer" />
              <Label htmlFor="ibuyer" className="cursor-pointer">iBuyer (compramos y vendemos casas)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="rentals" id="rentals" />
              <Label htmlFor="rentals" className="cursor-pointer">Rental platform</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="construction_tech" id="construction" />
              <Label htmlFor="construction" className="cursor-pointer">Construction tech</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="agent_tools" id="agent_tools" />
              <Label htmlFor="agent_tools" className="cursor-pointer">Tools for real estate agents</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Target Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.target_market} onValueChange={(value) => updateAnswer('target_market', value as RealEstatePropTechAnswers['target_market'])}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="residential_buyers" id="res_buyers" className="mt-1" />
              <Label htmlFor="res_buyers" className="flex-1 cursor-pointer">
                <div className="font-semibold">Residential buyers/sellers</div>
                <div className="text-sm text-gray-600">Consumidores finales</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="investors" id="investors" className="mt-1" />
              <Label htmlFor="investors" className="flex-1 cursor-pointer">
                <div className="font-semibold">Real estate investors</div>
                <div className="text-sm text-gray-600">Flip, rentals, portfolio</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="agents" id="agents" className="mt-1" />
              <Label htmlFor="agents" className="flex-1 cursor-pointer">
                <div className="font-semibold">Real estate agents/brokers</div>
                <div className="text-sm text-gray-600">B2B tools</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="landlords" id="landlords" className="mt-1" />
              <Label htmlFor="landlords" className="flex-1 cursor-pointer">
                <div className="font-semibold">Landlords / Property managers</div>
                <div className="text-sm text-gray-600">Gestión de rentas</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="developers" id="developers" className="mt-1" />
              <Label htmlFor="developers" className="flex-1 cursor-pointer">
                <div className="font-semibold">Developers / Constructoras</div>
                <div className="text-sm text-gray-600">Construction/project mgmt</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Revenue Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.revenue_model} onValueChange={(value) => updateAnswer('revenue_model', value as RealEstatePropTechAnswers['revenue_model'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="commission" id="commission" />
              <Label htmlFor="commission" className="cursor-pointer">Commission (% de venta/renta)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="subscription" id="subscription" />
              <Label htmlFor="subscription" className="cursor-pointer">Subscription (SaaS para agents/landlords)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="lead_gen" id="lead_gen" />
              <Label htmlFor="lead_gen" className="cursor-pointer">Lead generation fees</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="transaction_fee" id="trans_fee" />
              <Label htmlFor="trans_fee" className="cursor-pointer">Transaction fees</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="spread" id="spread" />
              <Label htmlFor="spread" className="cursor-pointer">Spread (buy/sell arbitrage) - iBuyer</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Competitive Advantage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Qué te diferencia de incumbents (Zillow, Redfin, etc.)?</Label>
          <Textarea
            value={answers.competitive_advantage || ''}
            onChange={(e) => updateAnswer('competitive_advantage', e.target.value)}
            placeholder="Ej: 'Solo enfocados en luxury properties $5M+' o 'AI que predice valor de casa 10x mejor' o 'Compramos casas en 7 días vs 60' o 'Solo mercado latinoamericano donde nadie más opera'"
            rows={5}
          />
          <p className="text-xs text-gray-700 mt-2">
            Real estate está ultra-competido. Sin differentiation clara, imposible ganar.
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle>🗺️ Geographic Focus</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿En qué mercados geográficos operas?</Label>
          <Textarea
            value={answers.geographic_focus || ''}
            onChange={(e) => updateAnswer('geographic_focus', e.target.value)}
            placeholder="Ej: 'Solo Madrid y Barcelona' o 'Mercados secundarios en US (Boise, Austin, etc.)' o 'Emerging markets (LATAM, Southeast Asia)'"
            rows={3}
          />
          <p className="text-xs text-gray-700 mt-2">
            Real estate es LOCAL. Dominar 1-2 ciudades {'>'} estar en 20 sin depth.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
