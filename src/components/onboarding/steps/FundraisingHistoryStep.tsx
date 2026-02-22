/**
 * FUNDRAISING HISTORY STEP
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DollarSign } from 'lucide-react';
import type { FundraisingHistory } from '@/types/ultra-onboarding';

interface FundraisingHistoryStepProps {
  history: Partial<FundraisingHistory>;
  onChange: (history: Partial<FundraisingHistory>) => void;
}

export function FundraisingHistoryStep({ history, onChange }: FundraisingHistoryStepProps) {
  const updateHistory = <K extends keyof FundraisingHistory>(key: K, value: FundraisingHistory[K]) => {
    onChange({ ...history, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">💰 Fundraising History</h2>
        <p className="text-gray-600">Capital levantado y runway</p>
      </div>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            ¿Has levantado funding?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={history.has_raised} onValueChange={(value) => updateHistory('has_raised', value as any)}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="cursor-pointer">No, bootstrapped 100%</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="friends_family" id="ff" />
              <Label htmlFor="ff" className="cursor-pointer">Sí, friends & family</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="angel" id="angel" />
              <Label htmlFor="angel" className="cursor-pointer">Sí, angel round</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="seed" id="seed" />
              <Label htmlFor="seed" className="cursor-pointer">Sí, seed round</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="series_a_plus" id="series_a" />
              <Label htmlFor="series_a" className="cursor-pointer">Sí, Series A+</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {history.has_raised && history.has_raised !== 'no' && (
        <>
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle>Capital Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="total_raised">Total capital raised (€)</Label>
                <Input
                  id="total_raised"
                  type="number"
                  placeholder="500000"
                  value={history.total_raised || ''}
                  onChange={(e) => updateHistory('total_raised', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div>
                <Label htmlFor="valuation">Last valuation (€)</Label>
                <Input
                  id="valuation"
                  type="number"
                  placeholder="5000000"
                  value={history.last_valuation || ''}
                  onChange={(e) => updateHistory('last_valuation', parseInt(e.target.value) || undefined)}
                />
              </div>

              <div>
                <Label htmlFor="investors">Key investors</Label>
                <Textarea
                  id="investors"
                  value={history.key_investors || ''}
                  onChange={(e) => updateHistory('key_investors', e.target.value)}
                  placeholder="Ej: 'Angel investor Juan Pérez, Seedcamp, K Fund'"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200">
            <CardHeader>
              <CardTitle>Current Runway</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="months_runway">Meses de runway restantes</Label>
                <Input
                  id="months_runway"
                  type="number"
                  placeholder="12"
                  value={history.months_runway || ''}
                  onChange={(e) => updateHistory('months_runway', parseInt(e.target.value) || undefined)}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
