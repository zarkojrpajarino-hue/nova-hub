/**
 * HEALTH & WELLNESS SPECIFIC QUESTIONS
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Heart, Shield, Users, AlertCircle } from 'lucide-react';
import type { HealthWellnessAnswers } from '@/types/ultra-onboarding';

interface HealthWellnessQuestionsProps {
  answers: Partial<HealthWellnessAnswers>;
  onChange: (answers: Partial<HealthWellnessAnswers>) => void;
}

export function HealthWellnessQuestions({ answers, onChange }: HealthWellnessQuestionsProps) {
  const updateAnswer = <K extends keyof HealthWellnessAnswers>(key: K, value: HealthWellnessAnswers[K]) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">❤️ Health & Wellness - Preguntas Específicas</h2>
      </div>

      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Categoría de Health/Wellness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.health_category} onValueChange={(value) => updateAnswer('health_category', value as HealthWellnessAnswers['health_category'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="mental_health" id="mental" />
              <Label htmlFor="mental" className="cursor-pointer">Mental health (therapy, meditation, mindfulness)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="fitness" id="fitness" />
              <Label htmlFor="fitness" className="cursor-pointer">Fitness / Exercise</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="nutrition" id="nutrition" />
              <Label htmlFor="nutrition" className="cursor-pointer">Nutrition / Diet</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="telemedicine" id="telemedicine" />
              <Label htmlFor="telemedicine" className="cursor-pointer">Telemedicine / Healthcare services</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="sleep" id="sleep" />
              <Label htmlFor="sleep" className="cursor-pointer">Sleep tracking / improvement</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Compliance & Regulación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox id="hipaa" checked={answers.requires_hipaa} onCheckedChange={(c) => updateAnswer('requires_hipaa', !!c)} />
              <Label htmlFor="hipaa" className="cursor-pointer">¿Requiere HIPAA compliance? (US)</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="gdpr" checked={answers.requires_gdpr} onCheckedChange={(c) => updateAnswer('requires_gdpr', !!c)} />
              <Label htmlFor="gdpr" className="cursor-pointer">¿Requiere GDPR compliance? (EU)</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox id="medical_cert" checked={answers.needs_medical_certification} onCheckedChange={(c) => updateAnswer('needs_medical_certification', !!c)} />
              <Label htmlFor="medical_cert" className="cursor-pointer">¿Necesitas certificación médica?</Label>
            </div>
          </div>

          {(answers.requires_hipaa || answers.needs_medical_certification) && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Regulatory burden:</strong> HIPAA y certificaciones médicas añaden complejidad,
                costo y time-to-market significativo. Considera si puedes empezar wellness (no-medical) primero.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Canal de Distribución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={answers.distribution_channel} onValueChange={(value) => updateAnswer('distribution_channel', value as HealthWellnessAnswers['distribution_channel'])}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="b2c_direct" id="b2c" className="mt-1" />
              <Label htmlFor="b2c" className="flex-1 cursor-pointer">
                <div className="font-semibold">B2C Direct</div>
                <div className="text-sm text-gray-600">Venta directa a consumidores</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="b2b2c_employers" id="b2b2c_emp" className="mt-1" />
              <Label htmlFor="b2b2c_emp" className="flex-1 cursor-pointer">
                <div className="font-semibold">B2B2C - Employers</div>
                <div className="text-sm text-gray-600">Empresas compran para empleados (wellness programs)</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="b2b2c_insurance" id="b2b2c_ins" className="mt-1" />
              <Label htmlFor="b2b2c_ins" className="flex-1 cursor-pointer">
                <div className="font-semibold">B2B2C - Insurance</div>
                <div className="text-sm text-gray-600">Aseguradoras cubren tu servicio</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="healthcare_providers" id="providers" className="mt-1" />
              <Label htmlFor="providers" className="flex-1 cursor-pointer">
                <div className="font-semibold">Healthcare Providers</div>
                <div className="text-sm text-gray-600">Hospitales/clínicas usan tu tech</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle>🎯 Clinical Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Tienes o planeas tener evidencia clínica de efectividad?</Label>
          <Textarea
            value={answers.clinical_evidence || ''}
            onChange={(e) => updateAnswer('clinical_evidence', e.target.value)}
            placeholder="Ej: 'Planificamos estudio piloto con 100 usuarios en 3 meses, luego peer-reviewed research' o 'Ya tenemos partnership con universidad para clinical trial'"
            rows={4}
          />
          <p className="text-xs text-gray-700 mt-2">
            Clinical evidence es CRÍTICO para B2B2C (employers/insurance) y mejora conversion B2C.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
