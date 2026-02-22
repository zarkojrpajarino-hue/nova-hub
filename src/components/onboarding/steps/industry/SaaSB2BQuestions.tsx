/**
 * SAAS B2B SPECIFIC QUESTIONS
 *
 * Preguntas ultra-específicas para SaaS B2B
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Code, Users, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import type { SaaSB2BAnswers } from '@/types/ultra-onboarding';

interface SaaSB2BQuestionsProps {
  answers: Partial<SaaSB2BAnswers>;
  onChange: (answers: Partial<SaaSB2BAnswers>) => void;
}

export function SaaSB2BQuestions({ answers, onChange }: SaaSB2BQuestionsProps) {
  const updateAnswer = <K extends keyof SaaSB2BAnswers>(
    key: K,
    value: SaaSB2BAnswers[K]
  ) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">💼 SaaS B2B - Preguntas Específicas</h2>
        <p className="text-gray-600">
          Detalles clave para tu modelo de negocio SaaS
        </p>
      </div>

      {/* ICP */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Ideal Customer Profile (ICP)
          </CardTitle>
          <CardDescription>
            ¿Quién es tu cliente ideal? Sé ultra-específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="icp_description" className="mb-2 block">
              Descripción del ICP
            </Label>
            <Textarea
              id="icp_description"
              value={answers.icp_description || ''}
              onChange={(e) => updateAnswer('icp_description', e.target.value)}
              placeholder="Ej: 'CMOs de SaaS B2B entre $5M-$50M ARR, con 10-100 empleados, en US/EU, que usan HubSpot'"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_company_size">Tamaño de empresa objetivo</Label>
              <RadioGroup
                value={answers.target_company_size}
                onValueChange={(value) =>
                  updateAnswer('target_company_size', value as SaaSB2BAnswers['target_company_size'])
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="smb" id="smb" />
                  <Label htmlFor="smb" className="cursor-pointer">SMB (1-50 empleados)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mid_market" id="mid_market" />
                  <Label htmlFor="mid_market" className="cursor-pointer">Mid-Market (50-500)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enterprise" id="enterprise" />
                  <Label htmlFor="enterprise" className="cursor-pointer">Enterprise (500+)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="annual_contract_value">ACV objetivo (€)</Label>
              <Input
                id="annual_contract_value"
                type="number"
                placeholder="10000"
                value={answers.annual_contract_value || ''}
                onChange={(e) => updateAnswer('annual_contract_value', parseInt(e.target.value) || undefined)}
              />
              <p className="text-xs text-gray-700 mt-1">Annual Contract Value promedio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Model */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Modelo de Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Cómo cobras?</Label>
            <RadioGroup
              value={answers.pricing_model}
              onValueChange={(value) =>
                updateAnswer('pricing_model', value as SaaSB2BAnswers['pricing_model'])
              }
            >
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="per_seat" id="per_seat" className="mt-1" />
                <Label htmlFor="per_seat" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Per Seat</div>
                  <div className="text-sm text-gray-600">€X por usuario/mes</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="usage_based" id="usage_based" className="mt-1" />
                <Label htmlFor="usage_based" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Usage-Based</div>
                  <div className="text-sm text-gray-600">Pagas por lo que usas (API calls, storage, etc.)</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="tiered" id="tiered" className="mt-1" />
                <Label htmlFor="tiered" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Tiered / Plans</div>
                  <div className="text-sm text-gray-600">Starter, Pro, Enterprise</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="flat_fee" id="flat_fee" className="mt-1" />
                <Label htmlFor="flat_fee" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Flat Fee</div>
                  <div className="text-sm text-gray-600">Precio fijo mensual/anual</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center space-x-3">
            <Checkbox
              id="has_freemium"
              checked={answers.has_freemium}
              onCheckedChange={(checked) => updateAnswer('has_freemium', !!checked)}
            />
            <Label htmlFor="has_freemium" className="cursor-pointer">
              ¿Tienes plan freemium o free trial?
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* GTM Strategy */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Go-to-Market Strategy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Qué growth motion usarás?</Label>
            <RadioGroup
              value={answers.growth_motion}
              onValueChange={(value) =>
                updateAnswer('growth_motion', value as SaaSB2BAnswers['growth_motion'])
              }
            >
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="product_led" id="product_led" className="mt-1" />
                <Label htmlFor="product_led" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Product-Led Growth (PLG)</div>
                  <div className="text-sm text-gray-600">Self-serve, users prueban producto primero</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="sales_led" id="sales_led" className="mt-1" />
                <Label htmlFor="sales_led" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Sales-Led Growth</div>
                  <div className="text-sm text-gray-600">Sales team, demos, enterprise deals</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="hybrid" id="hybrid" className="mt-1" />
                <Label htmlFor="hybrid" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Hybrid</div>
                  <div className="text-sm text-gray-600">PLG para SMB, sales para enterprise</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {answers.growth_motion === 'sales_led' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>Sales-led:</strong> Necesitarás ACV alto ($10K+) para justificar CAC.
                Considera si puedes empezar PLG y agregar sales motion después.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Cycle */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle>⏱️ Sales Cycle</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Cuánto dura tu sales cycle típico?</Label>
          <RadioGroup
            value={answers.sales_cycle_length}
            onValueChange={(value) =>
              updateAnswer('sales_cycle_length', value as SaaSB2BAnswers['sales_cycle_length'])
            }
          >
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="instant" id="instant" />
              <Label htmlFor="instant" className="cursor-pointer">Instant (self-serve)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="days" id="days" />
              <Label htmlFor="days" className="cursor-pointer">1-7 días</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="weeks" id="weeks" />
              <Label htmlFor="weeks" className="cursor-pointer">2-4 semanas</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="months" id="months" />
              <Label htmlFor="months" className="cursor-pointer">1-3 meses</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="long" id="long" />
              <Label htmlFor="long" className="cursor-pointer">3+ meses (enterprise)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
