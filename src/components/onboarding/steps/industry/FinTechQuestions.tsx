/**
 * FINTECH SPECIFIC QUESTIONS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Shield, TrendingUp, AlertCircle } from 'lucide-react';
import type { FinTechAnswers } from '@/types/ultra-onboarding';

interface FinTechQuestionsProps {
  answers: Partial<FinTechAnswers>;
  onChange: (answers: Partial<FinTechAnswers>) => void;
}

export function FinTechQuestions({ answers, onChange }: FinTechQuestionsProps) {
  const updateAnswer = <K extends keyof FinTechAnswers>(key: K, value: FinTechAnswers[K]) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">💰 FinTech - Preguntas Específicas</h2>
      </div>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Categoría FinTech
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.fintech_category} onValueChange={(value) => updateAnswer('fintech_category', value as any)}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="payments" id="payments" />
              <Label htmlFor="payments" className="cursor-pointer">Payments / Transfers</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="banking" id="banking" />
              <Label htmlFor="banking" className="cursor-pointer">Digital banking / Neobank</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="lending" id="lending" />
              <Label htmlFor="lending" className="cursor-pointer">Lending / Credit</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="investing" id="investing" />
              <Label htmlFor="investing" className="cursor-pointer">Investing / Wealth management</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="insurance" id="insurance" />
              <Label htmlFor="insurance" className="cursor-pointer">Insurance (InsurTech)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="crypto" id="crypto" />
              <Label htmlFor="crypto" className="cursor-pointer">Crypto / Blockchain</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="accounting" id="accounting" />
              <Label htmlFor="accounting" className="cursor-pointer">Accounting / Financial management</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Regulación & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Necesitas licencia financiera?</Label>
            <RadioGroup value={answers.licensing_strategy} onValueChange={(value) => updateAnswer('licensing_strategy', value as any)}>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="partner_bank" id="partner" className="mt-1" />
                <Label htmlFor="partner" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Partnership con banco existente</div>
                  <div className="text-sm text-gray-600">Banking-as-a-Service (BaaS)</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="own_license" id="own_license" className="mt-1" />
                <Label htmlFor="own_license" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Obtener licencia propia</div>
                  <div className="text-sm text-gray-600">Proceso largo y costoso</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
                <RadioGroupItem value="no_license" id="no_license" className="mt-1" />
                <Label htmlFor="no_license" className="flex-1 cursor-pointer">
                  <div className="font-semibold">No requiere licencia</div>
                  <div className="text-sm text-gray-600">Software tool, no money movement</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {answers.licensing_strategy === 'own_license' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <strong>⚠️ Licensing propio:</strong> Puede tomar 12-24 meses y costar $500K-$2M+.
                Considera empezar con BaaS partner (Stripe Treasury, Synapse, Unit, etc.)
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Regulaciones aplicables (selecciona todas):</Label>
            {['PSD2', 'KYC_AML', 'SOC2', 'PCI_DSS', 'GDPR'].map((reg) => (
              <div key={reg} className="flex items-center space-x-3">
                <Checkbox
                  id={reg}
                  checked={answers.regulations?.includes(reg as any)}
                  onCheckedChange={(c) => {
                    const current = answers.regulations || [];
                    const updated = c ? [...current, reg as any] : current.filter(r => r !== reg);
                    updateAnswer('regulations', updated);
                  }}
                />
                <Label htmlFor={reg} className="cursor-pointer">{reg.replace('_', ' / ')}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Cómo generas revenue?</Label>
          <RadioGroup value={answers.revenue_model} onValueChange={(value) => updateAnswer('revenue_model', value as any)}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="transaction_fee" id="trans_fee" />
              <Label htmlFor="trans_fee" className="cursor-pointer">Transaction fees (% o flat fee)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="subscription" id="sub" />
              <Label htmlFor="sub" className="cursor-pointer">Subscription (monthly/yearly)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="interchange" id="interchange" />
              <Label htmlFor="interchange" className="cursor-pointer">Interchange fees (tarjetas)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="interest" id="interest" />
              <Label htmlFor="interest" className="cursor-pointer">Interest income (lending)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="aum_fee" id="aum" />
              <Label htmlFor="aum" className="cursor-pointer">AUM fee (% of assets under management)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle>🎯 Unit Economics</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={answers.unit_economics_explanation || ''}
            onChange={(e) => updateAnswer('unit_economics_explanation', e.target.value)}
            placeholder="Ej: 'Cobramos 2% por transacción. Avg transaction: $100. Avg user hace 10 trans/mes. Revenue por user: $20/mes. CAC: $50. Payback: 2.5 meses.'"
            rows={5}
          />
          <p className="text-xs text-gray-700 mt-2">
            En FinTech, unit economics claros son críticos para fundraising.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
