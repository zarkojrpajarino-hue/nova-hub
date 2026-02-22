/**
 * CONSUMER APP SPECIFIC QUESTIONS
 *
 * Preguntas ultra-específicas para Consumer Apps (B2C)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Smartphone, Users, DollarSign, Repeat, AlertCircle, Zap } from 'lucide-react';
import type { ConsumerAppAnswers } from '@/types/ultra-onboarding';

interface ConsumerAppQuestionsProps {
  answers: Partial<ConsumerAppAnswers>;
  onChange: (answers: Partial<ConsumerAppAnswers>) => void;
}

export function ConsumerAppQuestions({ answers, onChange }: ConsumerAppQuestionsProps) {
  const updateAnswer = <K extends keyof ConsumerAppAnswers>(
    key: K,
    value: ConsumerAppAnswers[K]
  ) => {
    onChange({ ...answers, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📱 Consumer App - Preguntas Específicas</h2>
        <p className="text-gray-600">Detalles clave para tu app B2C</p>
      </div>

      {/* Platform */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-600" />
            Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="mb-2 block">¿Dónde vivirá tu app?</Label>
          <div className="space-y-3">
            {['ios', 'android', 'web', 'all'].map((platform) => (
              <div key={platform} className="flex items-center space-x-3">
                <Checkbox
                  id={platform}
                  checked={answers.platforms?.includes(platform as any)}
                  onCheckedChange={(checked) => {
                    const current = answers.platforms || [];
                    const updated = checked
                      ? [...current, platform as any]
                      : current.filter(p => p !== platform);
                    updateAnswer('platforms', updated);
                  }}
                />
                <Label htmlFor={platform} className="cursor-pointer capitalize">
                  {platform === 'all' ? 'Todas (iOS + Android + Web)' : platform.toUpperCase()}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monetization */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Estrategia de Monetización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers.monetization_model}
            onValueChange={(value) =>
              updateAnswer('monetization_model', value as ConsumerAppAnswers['monetization_model'])
            }
          >
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="freemium" id="freemium" className="mt-1" />
              <Label htmlFor="freemium" className="flex-1 cursor-pointer">
                <div className="font-semibold">Freemium</div>
                <div className="text-sm text-gray-600">Gratis + premium features</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="subscription" id="subscription" className="mt-1" />
              <Label htmlFor="subscription" className="flex-1 cursor-pointer">
                <div className="font-semibold">Subscription</div>
                <div className="text-sm text-gray-600">Monthly/yearly recurring</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="ads" id="ads" className="mt-1" />
              <Label htmlFor="ads" className="flex-1 cursor-pointer">
                <div className="font-semibold">Advertising</div>
                <div className="text-sm text-gray-600">Ads, impressions, sponsored content</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="in_app_purchases" id="iap" className="mt-1" />
              <Label htmlFor="iap" className="flex-1 cursor-pointer">
                <div className="font-semibold">In-App Purchases</div>
                <div className="text-sm text-gray-600">Coins, power-ups, unlocks</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="transaction_fee" id="transaction" className="mt-1" />
              <Label htmlFor="transaction" className="flex-1 cursor-pointer">
                <div className="font-semibold">Transaction Fee</div>
                <div className="text-sm text-gray-600">% de transacciones (marketplace/payments)</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="free_first" id="free_first" className="mt-1" />
              <Label htmlFor="free_first" className="flex-1 cursor-pointer">
                <div className="font-semibold">Free Primero (monetizar después)</div>
                <div className="text-sm text-gray-600">Grow users, figure out monetization later</div>
              </Label>
            </div>
          </RadioGroup>

          {answers.monetization_model === 'free_first' && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Risk:</strong> "Build first, monetize later" funciona solo con network effects
                masivos o viral growth. Valida willingness to pay EARLY.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Loop */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-blue-600" />
            Core Engagement Loop
          </CardTitle>
          <CardDescription>
            ¿Por qué usuarios volverán todos los días?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={answers.engagement_loop || ''}
            onChange={(e) => updateAnswer('engagement_loop', e.target.value)}
            placeholder="Ej: 'Usuario publica foto → recibe likes/comentarios → notificaciones → vuelve a ver engagement → publica de nuevo' (Instagram loop)"
            rows={5}
          />
          <p className="text-xs text-gray-700 mt-2">
            Tu hook/loop de retención. Apps exitosos tienen esto ultra-claro.
          </p>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle>📊 Retention Strategy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Principal driver de retention</Label>
            <RadioGroup
              value={answers.retention_driver}
              onValueChange={(value) =>
                updateAnswer('retention_driver', value as ConsumerAppAnswers['retention_driver'])
              }
            >
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="habit_building" id="habit" />
                <Label htmlFor="habit" className="cursor-pointer">
                  Habit building (uso diario, streaks)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="content" id="content" />
                <Label htmlFor="content" className="cursor-pointer">
                  Content infinito (feed, videos)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="social" id="social" />
                <Label htmlFor="social" className="cursor-pointer">
                  Red social (amigos en app)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="utility" id="utility" />
                <Label htmlFor="utility" className="cursor-pointer">
                  Utilidad (soluciona problema frecuente)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2">
                <RadioGroupItem value="progress" id="progress" />
                <Label htmlFor="progress" className="cursor-pointer">
                  Progreso/logros (gamification)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="target_dau_mau">Target DAU/MAU (%)</Label>
            <Input
              id="target_dau_mau"
              type="number"
              placeholder="20"
              value={answers.target_dau_mau || ''}
              onChange={(e) => updateAnswer('target_dau_mau', parseInt(e.target.value) || undefined)}
            />
            <p className="text-xs text-gray-700 mt-1">
              Daily Active Users / Monthly Active Users (20%+ es saludable)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Viral Growth */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Viral Growth Mechanics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">¿Cómo se esparcirá tu app?</Label>
            <RadioGroup
              value={answers.viral_mechanism}
              onValueChange={(value) =>
                updateAnswer('viral_mechanism', value as ConsumerAppAnswers['viral_mechanism'])
              }
            >
              <div className="flex items-start space-x-2 p-2">
                <RadioGroupItem value="word_of_mouth" id="wom" className="mt-1" />
                <Label htmlFor="wom" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Word of mouth orgánico</div>
                  <div className="text-sm text-gray-600">Usuarios invitan amigos naturalmente</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-2">
                <RadioGroupItem value="invite_system" id="invite" className="mt-1" />
                <Label htmlFor="invite" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Sistema de invites</div>
                  <div className="text-sm text-gray-600">Incentivos para invitar (referrals)</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-2">
                <RadioGroupItem value="content_sharing" id="sharing" className="mt-1" />
                <Label htmlFor="sharing" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Content sharing</div>
                  <div className="text-sm text-gray-600">Usuarios comparten contenido → tráfico</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-2">
                <RadioGroupItem value="network_effects" id="network" className="mt-1" />
                <Label htmlFor="network" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Network effects</div>
                  <div className="text-sm text-gray-600">Más users = más valor para todos</div>
                </Label>
              </div>
              <div className="flex items-start space-x-2 p-2">
                <RadioGroupItem value="no_viral" id="no_viral" className="mt-1" />
                <Label htmlFor="no_viral" className="flex-1 cursor-pointer">
                  <div className="font-semibold">No viral (paid acquisition)</div>
                  <div className="text-sm text-gray-600">Growth via ads/marketing</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="target_k_factor">Target K-Factor (viral coefficient)</Label>
            <Input
              id="target_k_factor"
              type="number"
              step="0.1"
              placeholder="1.2"
              value={answers.target_k_factor || ''}
              onChange={(e) => updateAnswer('target_k_factor', parseFloat(e.target.value) || undefined)}
            />
            <p className="text-xs text-gray-700 mt-1">
              Avg invites per user. K {'>'} 1 = organic growth exponencial
            </p>
          </div>

          {answers.target_k_factor && answers.target_k_factor < 1 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>💡 K {'<'} 1:</strong> Sin viral growth orgánico, necesitarás paid acquisition
                o content marketing para crecer. Presupuesta CAC.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Acquisition */}
      <Card className="border-2 border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            User Acquisition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="target_cpi">Target CPI - Cost Per Install (€)</Label>
            <Input
              id="target_cpi"
              type="number"
              step="0.1"
              placeholder="2.5"
              value={answers.target_cpi || ''}
              onChange={(e) => updateAnswer('target_cpi', parseFloat(e.target.value) || undefined)}
            />
          </div>

          <div>
            <Label htmlFor="arpu">Target ARPU - Average Revenue Per User (€/mes)</Label>
            <Input
              id="arpu"
              type="number"
              step="0.1"
              placeholder="5"
              value={answers.target_arpu || ''}
              onChange={(e) => updateAnswer('target_arpu', parseFloat(e.target.value) || undefined)}
            />
          </div>

          {answers.target_cpi && answers.target_arpu && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-sm text-purple-800">
                <strong>Payback period:</strong>{' '}
                {(answers.target_cpi / answers.target_arpu).toFixed(1)} meses
                {(answers.target_cpi / answers.target_arpu) <= 3 && (
                  <span className="text-green-700"> ✅ Excelente ({'<'}3 meses)</span>
                )}
                {(answers.target_cpi / answers.target_arpu) > 12 && (
                  <span className="text-orange-700"> ⚠️ Muy largo ({'>'} 1 año)</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
