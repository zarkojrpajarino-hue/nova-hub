/**
 * PMF ASSESSMENT STEP
 *
 * Product-Market Fit Assessment & PMF Score
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Target, Users, TrendingUp, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { PMFAssessment } from '@/types/ultra-onboarding';
import { cn } from '@/lib/utils';

interface PMFAssessmentStepProps {
  pmf: Partial<PMFAssessment>;
  onChange: (pmf: Partial<PMFAssessment>) => void;
}

export function PMFAssessmentStep({ pmf, onChange }: PMFAssessmentStepProps) {
  const updatePMF = <K extends keyof PMFAssessment>(
    key: K,
    value: PMFAssessment[K]
  ) => {
    onChange({ ...pmf, [key]: value });
  };

  // Calculate PMF Score
  const calculatePMFScore = () => {
    let score = 0;

    // Sean Ellis test (40 points)
    const disappointment = pmf.sean_ellis_score || 0;
    if (disappointment >= 40) score += 40;
    else score += disappointment;

    // Retention (20 points)
    if (pmf.retention_signal === 'high_retention') score += 20;
    else if (pmf.retention_signal === 'growing') score += 12;
    else if (pmf.retention_signal === 'stable') score += 6;

    // Growth (20 points)
    if (pmf.organic_growth === 'high_viral') score += 20;
    else if (pmf.organic_growth === 'some_organic') score += 12;
    else if (pmf.organic_growth === 'mostly_paid') score += 4;

    // User feedback (10 points)
    if (pmf.user_love_signal === 'evangelists') score += 10;
    else if (pmf.user_love_signal === 'positive') score += 6;
    else if (pmf.user_love_signal === 'neutral') score += 2;

    // Market pull (10 points)
    if (pmf.market_pull === 'strong_pull') score += 10;
    else if (pmf.market_pull === 'some_pull') score += 5;

    return Math.min(100, score);
  };

  const pmfScore = calculatePMFScore();

  const getPMFLevel = (score: number) => {
    if (score >= 70) return { level: 'Strong PMF', color: 'green', emoji: '🎯' };
    if (score >= 50) return { level: 'Early PMF', color: 'blue', emoji: '📊' };
    if (score >= 30) return { level: 'Pre-PMF', color: 'orange', emoji: '🔍' };
    return { level: 'No PMF Yet', color: 'red', emoji: '⚠️' };
  };

  const pmfLevel = getPMFLevel(pmfScore);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎯 Product-Market Fit Assessment</h2>
        <p className="text-gray-600">
          ¿Tienes PMF real o solo wishful thinking?
        </p>
      </div>

      {/* Sean Ellis Test */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-600" />
            Sean Ellis Test (The PMF Question)
          </CardTitle>
          <CardDescription>
            Si tienes usuarios, pregúntales: "How would you feel if you could no longer use this product?"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                % que responde "Very disappointed"
              </span>
              <span className={cn('text-2xl font-bold',
                (pmf.sean_ellis_score || 0) >= 40 ? 'text-green-600' : 'text-orange-600'
              )}>
                {pmf.sean_ellis_score || 0}%
              </span>
            </div>
            <Slider
              value={[pmf.sean_ellis_score || 0]}
              onValueChange={([value]) => updatePMF('sean_ellis_score', value)}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 mt-2">
              <div className="text-center">
                <div className="font-bold text-red-600">{'<20%'}</div>
                <div>No PMF</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-600">20-40%</div>
                <div>Getting there</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-green-600">40%+</div>
                <div>Strong PMF</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">60%+</div>
                <div>Exceptional</div>
              </div>
            </div>
          </div>

          {(pmf.sean_ellis_score || 0) >= 40 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <strong>✅ Strong PMF signal:</strong> 40%+ "very disappointed" indica PMF real.
                Ahora focus en growth y scaling.
              </div>
            </div>
          )}

          {(pmf.sean_ellis_score || 0) < 40 && pmf.sean_ellis_score !== undefined && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Pre-PMF:</strong> Menos de 40% indica que no has encontrado PMF todavía.
                No escales marketing - itera en producto primero.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retention Signal */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Retention Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={pmf.retention_signal}
            onValueChange={(value) => updatePMF('retention_signal', value as PMFAssessment['retention_signal'])}
          >
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="high_retention" id="high_ret" className="mt-1" />
              <Label htmlFor="high_ret" className="flex-1 cursor-pointer">
                <div className="font-semibold">🟢 High retention</div>
                <div className="text-sm text-gray-600">
                  Users vuelven consistentemente, churn {'<'}5%/mes
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="growing" id="growing_ret" className="mt-1" />
              <Label htmlFor="growing_ret" className="flex-1 cursor-pointer">
                <div className="font-semibold">📈 Growing</div>
                <div className="text-sm text-gray-600">
                  Retention mejorando cada mes
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="stable" id="stable_ret" className="mt-1" />
              <Label htmlFor="stable_ret" className="flex-1 cursor-pointer">
                <div className="font-semibold">➡️ Stable</div>
                <div className="text-sm text-gray-600">
                  Retention flat, no mejora ni empeora
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="declining" id="declining_ret" className="mt-1" />
              <Label htmlFor="declining_ret" className="flex-1 cursor-pointer">
                <div className="font-semibold">🔴 Declining</div>
                <div className="text-sm text-gray-600">
                  Retention empeorando, churn alto
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Organic Growth */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Organic Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={pmf.organic_growth}
            onValueChange={(value) => updatePMF('organic_growth', value as PMFAssessment['organic_growth'])}
          >
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="high_viral" id="high_viral" className="mt-1" />
              <Label htmlFor="high_viral" className="flex-1 cursor-pointer">
                <div className="font-semibold">🚀 High viral growth</div>
                <div className="text-sm text-gray-600">
                  Mayoría de growth es orgánico, K-factor {'>'} 1
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="some_organic" id="some_organic" className="mt-1" />
              <Label htmlFor="some_organic" className="flex-1 cursor-pointer">
                <div className="font-semibold">📊 Some organic growth</div>
                <div className="text-sm text-gray-600">
                  Mix de organic + paid, word-of-mouth funciona
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="mostly_paid" id="mostly_paid" className="mt-1" />
              <Label htmlFor="mostly_paid" className="flex-1 cursor-pointer">
                <div className="font-semibold">💰 Mostly paid growth</div>
                <div className="text-sm text-gray-600">
                  Casi todo growth viene de ads/marketing
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="no_organic" id="no_organic" className="mt-1" />
              <Label htmlFor="no_organic" className="flex-1 cursor-pointer">
                <div className="font-semibold">🔴 No organic growth</div>
                <div className="text-sm text-gray-600">
                  Cero word-of-mouth, dependo 100% de paid
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* User Love Signal */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle>💝 User Love Signal</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={pmf.user_love_signal}
            onValueChange={(value) => updatePMF('user_love_signal', value as PMFAssessment['user_love_signal'])}
          >
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="evangelists" id="evangelists" />
              <Label htmlFor="evangelists" className="cursor-pointer">
                Evangelists - Hablan de ti sin que pidas
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="positive" id="positive" />
              <Label htmlFor="positive" className="cursor-pointer">
                Positive feedback consistente
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="neutral" id="neutral" />
              <Label htmlFor="neutral" className="cursor-pointer">
                Neutral - Usan pero no aman
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="complaints" id="complaints" />
              <Label htmlFor="complaints" className="cursor-pointer">
                Many complaints - Frustración frecuente
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Market Pull */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Market Pull
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={pmf.market_pull}
            onValueChange={(value) => updatePMF('market_pull', value as PMFAssessment['market_pull'])}
          >
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="strong_pull" id="strong_pull" className="mt-1" />
              <Label htmlFor="strong_pull" className="flex-1 cursor-pointer">
                <div className="font-semibold">Strong pull</div>
                <div className="text-sm text-gray-600">
                  Clientes te buscan, inbound alto, waitlist
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="some_pull" id="some_pull" className="mt-1" />
              <Label htmlFor="some_pull" className="flex-1 cursor-pointer">
                <div className="font-semibold">Some pull</div>
                <div className="text-sm text-gray-600">
                  Algo de demand orgánico pero necesitas empujar
                </div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="push_only" id="push_only" className="mt-1" />
              <Label htmlFor="push_only" className="flex-1 cursor-pointer">
                <div className="font-semibold">Push only</div>
                <div className="text-sm text-gray-600">
                  Tienes que empujar fuerte para cada venta
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* What People Love */}
      <Card className="border-2 border-teal-200">
        <CardHeader>
          <CardTitle>✨ ¿Qué aman tus usuarios del producto?</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={pmf.what_users_love || ''}
            onChange={(e) => updatePMF('what_users_love', e.target.value)}
            placeholder="Ej: 'Aman que puedan crear reportes en 2 minutos vs 2 horas antes' o 'La UI es la única que entienden sin tutorial' o 'Ahorra $5K/mes comparado con alternativas'"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* PMF Score Summary */}
      <div className={`p-6 bg-gradient-to-r border-2 rounded-lg ${
        pmfScore >= 70
          ? 'from-green-50 to-emerald-50 border-green-200'
          : pmfScore >= 50
          ? 'from-blue-50 to-cyan-50 border-blue-200'
          : pmfScore >= 30
          ? 'from-orange-50 to-yellow-50 border-orange-200'
          : 'from-red-50 to-pink-50 border-red-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className="text-6xl">{pmfLevel.emoji}</div>
          <div className="flex-1">
            <div className="text-2xl font-bold mb-2">{pmfLevel.level}</div>
            <div className="text-lg font-semibold mb-3">PMF Score: {pmfScore}/100</div>
            <div className="text-sm">
              {pmfScore >= 70 && (
                <>
                  <strong>🎯 Strong PMF:</strong> Tienes product-market fit real. Focus en scaling,
                  optimizar CAC, y crecer canales de distribución. Considera fundraising si quieres acelerar.
                </>
              )}
              {pmfScore >= 50 && pmfScore < 70 && (
                <>
                  <strong>📊 Early PMF:</strong> Tienes señales de PMF pero aún débiles. Dobla down
                  en lo que funciona, mejora retention, y construye moat antes de escalar hard.
                </>
              )}
              {pmfScore >= 30 && pmfScore < 50 && (
                <>
                  <strong>🔍 Pre-PMF:</strong> Estás validando pero no tienes PMF todavía. No gastes
                  en ads, focus 100% en producto y hablar con usuarios. Itera rápido.
                </>
              )}
              {pmfScore < 30 && (
                <>
                  <strong>⚠️ No PMF:</strong> Aún no has encontrado PMF. Considera pivotar, cambiar
                  ICP, o mejorar producto dramáticamente. Escalar ahora sería tirar dinero.
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
