/**
 * PROFESSIONAL SERVICES SPECIFIC QUESTIONS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Briefcase, DollarSign, Users, TrendingUp } from 'lucide-react';
import type { ProfessionalServicesAnswers } from '@/types/ultra-onboarding';

interface ProfessionalServicesQuestionsProps {
  answers: Partial<ProfessionalServicesAnswers>;
  onChange: (answers: Partial<ProfessionalServicesAnswers>) => void;
}

export function ProfessionalServicesQuestions({ answers, onChange }: ProfessionalServicesQuestionsProps) {
  const updateAnswer = <K extends keyof ProfessionalServicesAnswers>(key: K, value: ProfessionalServicesAnswers[K]) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">💼 Professional Services - Preguntas Específicas</h2>
      </div>

      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-600" />
            Tipo de Servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.service_type} onValueChange={(value) => updateAnswer('service_type', value as ProfessionalServicesAnswers['service_type'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="consulting" id="consulting" />
              <Label htmlFor="consulting" className="cursor-pointer">Consulting / Advisory</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="agency" id="agency" />
              <Label htmlFor="agency" className="cursor-pointer">Agency (marketing, design, dev)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="fractional" id="fractional" />
              <Label htmlFor="fractional" className="cursor-pointer">Fractional services (CFO, CMO, CTO)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="freelance_marketplace" id="marketplace" />
              <Label htmlFor="marketplace" className="cursor-pointer">Freelance marketplace</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="training" id="training" />
              <Label htmlFor="training" className="cursor-pointer">Training / Coaching</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="legal_accounting" id="legal" />
              <Label htmlFor="legal" className="cursor-pointer">Legal / Accounting services</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Target Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.target_client} onValueChange={(value) => updateAnswer('target_client', value as ProfessionalServicesAnswers['target_client'])}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="startups" id="startups" className="mt-1" />
              <Label htmlFor="startups" className="flex-1 cursor-pointer">
                <div className="font-semibold">Startups / Scale-ups</div>
                <div className="text-sm text-gray-600">Early stage companies</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="smbs" id="smbs" className="mt-1" />
              <Label htmlFor="smbs" className="flex-1 cursor-pointer">
                <div className="font-semibold">SMBs (1-50 empleados)</div>
                <div className="text-sm text-gray-600">Small/medium businesses</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="mid_market" id="mid_market" className="mt-1" />
              <Label htmlFor="mid_market" className="flex-1 cursor-pointer">
                <div className="font-semibold">Mid-Market (50-500)</div>
                <div className="text-sm text-gray-600">Established companies</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
              <Label htmlFor="enterprise" className="flex-1 cursor-pointer">
                <div className="font-semibold">Enterprise (500+)</div>
                <div className="text-sm text-gray-600">Large corporations</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Pricing Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Cómo cobras?</Label>
            <div className="space-y-2">
              {['hourly', 'project_based', 'retainer', 'value_based', 'commission'].map((model) => (
                <div key={model} className="flex items-center space-x-3">
                  <Checkbox
                    id={model}
                    checked={answers.pricing_models?.includes(model as ProfessionalServicesAnswers['pricing_models'][number])}
                    onCheckedChange={(c) => {
                      const current = answers.pricing_models || [];
                      const updated = c ? [...current, model as ProfessionalServicesAnswers['pricing_models'][number]] : current.filter(m => m !== model);
                      updateAnswer('pricing_models', updated);
                    }}
                  />
                  <Label htmlFor={model} className="cursor-pointer capitalize">
                    {model.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourly_rate">Hourly rate (€) (si aplica)</Label>
              <Input
                id="hourly_rate"
                type="number"
                placeholder="150"
                value={answers.hourly_rate || ''}
                onChange={(e) => updateAnswer('hourly_rate', parseInt(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="avg_project_value">Avg project value (€)</Label>
              <Input
                id="avg_project_value"
                type="number"
                placeholder="10000"
                value={answers.average_project_value || ''}
                onChange={(e) => updateAnswer('average_project_value', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Sales Motion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Cómo consigues clientes?</Label>
          <RadioGroup value={answers.sales_motion} onValueChange={(value) => updateAnswer('sales_motion', value as ProfessionalServicesAnswers['sales_motion'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="inbound" id="inbound" />
              <Label htmlFor="inbound" className="cursor-pointer">Inbound (content, SEO, referrals)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="outbound" id="outbound" />
              <Label htmlFor="outbound" className="cursor-pointer">Outbound (cold email, LinkedIn, calls)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="referrals_only" id="referrals" />
              <Label htmlFor="referrals" className="cursor-pointer">100% referrals / word of mouth</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="partnerships" id="partnerships" />
              <Label htmlFor="partnerships" className="cursor-pointer">Partnerships / Channel sales</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="platform_marketplace" id="platform" />
              <Label htmlFor="platform" className="cursor-pointer">Platform/marketplace (Upwork, Fiverr, etc.)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle>📊 Capacity & Scalability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Tu modelo es scalable o requiere más people?</Label>
            <RadioGroup value={answers.scalability} onValueChange={(value) => updateAnswer('scalability', value as ProfessionalServicesAnswers['scalability'])}>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="productized" id="productized" className="mt-1" />
                <Label htmlFor="productized" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Productized services</div>
                  <div className="text-sm text-gray-600">Paquetes estandarizados, procesos repetibles</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="custom_scaling" id="custom" className="mt-1" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Custom work que escala con team</div>
                  <div className="text-sm text-gray-600">Más clientes = más headcount</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="software_enabled" id="software" className="mt-1" />
                <Label htmlFor="software" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Software-enabled services</div>
                  <div className="text-sm text-gray-600">Tech aumenta output per person</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="marketplace_model" id="marketplace_model" className="mt-1" />
                <Label htmlFor="marketplace_model" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Marketplace de freelancers</div>
                  <div className="text-sm text-gray-600">Supply externo, no headcount interno</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="differentiation">¿Qué te diferencia de competidores?</Label>
            <Textarea
              id="differentiation"
              value={answers.differentiation || ''}
              onChange={(e) => updateAnswer('differentiation', e.target.value)}
              placeholder="Ej: 'Solo trabajamos con SaaS B2B, expertise ultra-específico' o 'Garantizamos 3x ROI o devolvemos dinero' o 'AI-powered, entregamos en 1/3 del tiempo'"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
