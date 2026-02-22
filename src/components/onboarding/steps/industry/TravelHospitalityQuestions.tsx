/**
 * TRAVEL & HOSPITALITY SPECIFIC QUESTIONS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plane, MapPin, DollarSign, Users } from 'lucide-react';
import type { TravelHospitalityAnswers } from '@/types/ultra-onboarding';

interface TravelHospitalityQuestionsProps {
  answers: Partial<TravelHospitalityAnswers>;
  onChange: (answers: Partial<TravelHospitalityAnswers>) => void;
}

export function TravelHospitalityQuestions({ answers, onChange }: TravelHospitalityQuestionsProps) {
  const updateAnswer = <K extends keyof TravelHospitalityAnswers>(key: K, value: TravelHospitalityAnswers[K]) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">✈️ Travel & Hospitality - Preguntas Específicas</h2>
      </div>

      <Card className="border-2 border-sky-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-sky-600" />
            Categoría de Travel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.travel_category} onValueChange={(value) => updateAnswer('travel_category', value as TravelHospitalityAnswers['travel_category'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="accommodations" id="accom" />
              <Label htmlFor="accom" className="cursor-pointer">Accommodations (hoteles, airbnbs)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="flights" id="flights" />
              <Label htmlFor="flights" className="cursor-pointer">Flights / Transportation</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="experiences" id="experiences" />
              <Label htmlFor="experiences" className="cursor-pointer">Experiences / Tours / Activities</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="full_package" id="package" />
              <Label htmlFor="package" className="cursor-pointer">Full travel packages</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="travel_tech" id="tech" />
              <Label htmlFor="tech" className="cursor-pointer">Travel tech/tools (itinerary, booking, etc.)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Business Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.business_model} onValueChange={(value) => updateAnswer('business_model', value as TravelHospitalityAnswers['business_model'])}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="aggregator" id="aggregator" className="mt-1" />
              <Label htmlFor="aggregator" className="flex-1 cursor-pointer">
                <div className="font-semibold">Aggregator / Metasearch</div>
                <div className="text-sm text-gray-600">Comparas opciones de múltiples proveedores</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="own_inventory" id="own_inv" className="mt-1" />
              <Label htmlFor="own_inv" className="flex-1 cursor-pointer">
                <div className="font-semibold">Own Inventory</div>
                <div className="text-sm text-gray-600">Propiedades/experiencias propias</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="marketplace" id="marketplace" className="mt-1" />
              <Label htmlFor="marketplace" className="flex-1 cursor-pointer">
                <div className="font-semibold">Marketplace</div>
                <div className="text-sm text-gray-600">Conectas supply (hosts) con demand (travelers)</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="saas_b2b" id="saas" className="mt-1" />
              <Label htmlFor="saas" className="flex-1 cursor-pointer">
                <div className="font-semibold">SaaS for travel businesses</div>
                <div className="text-sm text-gray-600">Software para hoteles, tours, etc.</div>
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
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Cómo monetizas?</Label>
            <RadioGroup value={answers.revenue_model} onValueChange={(value) => updateAnswer('revenue_model', value as TravelHospitalityAnswers['revenue_model'])}>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="commission" id="commission" />
                <Label htmlFor="commission" className="cursor-pointer">Commission (% de booking)</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="booking_fee" id="booking_fee" />
                <Label htmlFor="booking_fee" className="cursor-pointer">Booking fee (flat fee)</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="subscription" id="subscription" />
                <Label htmlFor="subscription" className="cursor-pointer">Subscription (B2B SaaS)</Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="markup" id="markup" />
                <Label htmlFor="markup" className="cursor-pointer">Markup on inventory</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="avg_commission">Avg commission rate (%)</Label>
            <Input
              id="avg_commission"
              type="number"
              placeholder="15"
              value={answers.average_commission_rate || ''}
              onChange={(e) => updateAnswer('average_commission_rate', parseInt(e.target.value) || undefined)}
            />
          </div>

          <div>
            <Label htmlFor="avg_booking_value">Average booking value (€)</Label>
            <Input
              id="avg_booking_value"
              type="number"
              placeholder="500"
              value={answers.average_booking_value || ''}
              onChange={(e) => updateAnswer('average_booking_value', parseInt(e.target.value) || undefined)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Supply Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Cómo consigues supply (inventory)?</Label>
          <Textarea
            value={answers.supply_strategy || ''}
            onChange={(e) => updateAnswer('supply_strategy', e.target.value)}
            placeholder="Ej: 'Partnership con hoteles locales en Bali' o 'API integration con Booking.com' o 'Onboarding manual de tour guides' o 'Own properties'"
            rows={4}
          />
          <p className="text-xs text-gray-700 mt-2">
            En travel, chicken-egg problem es real. Supply es tu moat o tu bottleneck.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
