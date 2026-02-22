/**
 * CURRENT TRACTION STEP
 *
 * Validation status & early traction signals
 * Determina en qué stage realmente está el proyecto
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, MessageSquare, CheckCircle2, AlertCircle, Rocket } from 'lucide-react';
import type { CurrentTraction } from '@/types/ultra-onboarding';

interface CurrentTractionStepProps {
  traction: Partial<CurrentTraction>;
  onChange: (traction: Partial<CurrentTraction>) => void;
}

export function CurrentTractionStep({ traction, onChange }: CurrentTractionStepProps) {
  const updateTraction = <K extends keyof CurrentTraction>(
    key: K,
    value: CurrentTraction[K]
  ) => {
    onChange({ ...traction, [key]: value });
  };

  const validationActivities = [
    {
      id: 'customer_interviews',
      label: 'Customer interviews (10+)',
      description: 'Hablé con usuarios potenciales',
      points: 15
    },
    {
      id: 'surveys',
      label: 'Encuestas/surveys',
      description: 'Recolecté datos de mercado',
      points: 10
    },
    {
      id: 'landing_page',
      label: 'Landing page + waitlist',
      description: 'Capturé emails de interesados',
      points: 20
    },
    {
      id: 'prototype',
      label: 'Prototipo/wireframes',
      description: 'Diseñé la solución',
      points: 15
    },
    {
      id: 'mvp',
      label: 'MVP funcional',
      description: 'Construí versión básica',
      points: 30
    },
    {
      id: 'beta_users',
      label: 'Usuarios beta',
      description: 'Gente usando el producto',
      points: 35
    },
    {
      id: 'paying_customers',
      label: 'Primeros clientes pagando',
      description: 'Revenue generado',
      points: 50
    },
    {
      id: 'press_coverage',
      label: 'Press/media coverage',
      description: 'Cobertura de medios',
      points: 20
    },
    {
      id: 'none',
      label: 'Ninguna todavía',
      description: 'Estoy en fase de idea',
      points: 0
    },
  ];

  const selectedActivities = traction.validation_completed || [];
  const validationScore = selectedActivities.reduce((sum, activityId) => {
    const activity = validationActivities.find(a => a.id === activityId);
    return sum + (activity?.points || 0);
  }, 0);

  const getValidationLevel = (score: number) => {
    if (score === 0) return { level: 'Idea', color: 'gray', emoji: '💡' };
    if (score < 30) return { level: 'Early Validation', color: 'blue', emoji: '🔍' };
    if (score < 60) return { level: 'Validated', color: 'green', emoji: '✅' };
    if (score < 100) return { level: 'Early Traction', color: 'purple', emoji: '🚀' };
    return { level: 'Strong Traction', color: 'pink', emoji: '🔥' };
  };

  const validationLevel = getValidationLevel(validationScore);

  const hasRevenue = traction.monthly_revenue !== undefined && traction.monthly_revenue > 0;
  const hasUsers = traction.total_users !== undefined && traction.total_users > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📊 Tracción Actual</h2>
        <p className="text-gray-600">
          ¿Dónde estás REALMENTE? Seamos honestos - esto determina tu roadmap.
        </p>
      </div>

      {/* Current Stage */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-blue-600" />
            ¿En qué stage estás?
          </CardTitle>
          <CardDescription>
            Sé brutalmente honesto/a - esto NO es malo, solo define tu starting point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={traction.current_stage}
            onValueChange={(value) =>
              updateTraction('current_stage', value as CurrentTraction['current_stage'])
            }
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="just_idea" id="just_idea" />
              <Label htmlFor="just_idea" className="flex-1 cursor-pointer">
                <div className="font-semibold">💡 Solo tengo la idea</div>
                <div className="text-sm text-gray-600">No he validado nada todavía</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="validating" id="validating" />
              <Label htmlFor="validating" className="flex-1 cursor-pointer">
                <div className="font-semibold">🔍 Validando la idea</div>
                <div className="text-sm text-gray-600">
                  Entrevistas, research, diseñando solución
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="building_mvp" id="building_mvp" />
              <Label htmlFor="building_mvp" className="flex-1 cursor-pointer">
                <div className="font-semibold">🛠️ Construyendo MVP</div>
                <div className="text-sm text-gray-600">Desarrollo en progreso</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="beta_testing" id="beta_testing" />
              <Label htmlFor="beta_testing" className="flex-1 cursor-pointer">
                <div className="font-semibold">🧪 Beta testing</div>
                <div className="text-sm text-gray-600">Primeros usuarios probando</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="launched" id="launched" />
              <Label htmlFor="launched" className="flex-1 cursor-pointer">
                <div className="font-semibold">🚀 Lanzado públicamente</div>
                <div className="text-sm text-gray-600">Producto live, buscando PMF</div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-blue-200 cursor-pointer">
              <RadioGroupItem value="growing" id="growing" />
              <Label htmlFor="growing" className="flex-1 cursor-pointer">
                <div className="font-semibold">📈 Growth stage</div>
                <div className="text-sm text-gray-600">PMF encontrado, escalando</div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Validation Activities */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-purple-600" />
            ¿Qué has hecho para validar?
          </CardTitle>
          <CardDescription>
            Selecciona todo lo que hayas completado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {validationActivities.map((activity) => {
              const isSelected = selectedActivities.includes(activity.id);
              const isNone = activity.id === 'none';

              return (
                <div
                  key={activity.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'bg-purple-50 border-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    id={activity.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      let updated: string[];
                      if (isNone && checked) {
                        // Si selecciona "none", deselecciona todo lo demás
                        updated = ['none'];
                      } else if (isNone && !checked) {
                        // Si deselecciona "none"
                        updated = [];
                      } else if (checked) {
                        // Si selecciona algo que no es "none", quita "none" si estaba
                        updated = [...selectedActivities.filter(id => id !== 'none'), activity.id];
                      } else {
                        // Deselecciona
                        updated = selectedActivities.filter(id => id !== activity.id);
                      }
                      updateTraction('validation_completed', updated);
                    }}
                  />
                  <Label htmlFor={activity.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{activity.label}</span>
                      {!isNone && (
                        <Badge variant="secondary" className="ml-2">
                          +{activity.points}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{activity.description}</div>
                  </Label>
                </div>
              );
            })}
          </div>

          {/* Validation Score */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Validation Score:</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{validationLevel.emoji}</span>
                <Badge className={`bg-${validationLevel.color}-600`}>
                  {validationScore} pts - {validationLevel.level}
                </Badge>
              </div>
            </div>

            {validationScore === 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <strong>💡 Empieza aquí:</strong> Tu primer paso es validar el problema.
                  Haz 10+ customer interviews antes de escribir código.
                </div>
              </div>
            )}

            {validationScore >= 50 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <strong>🔥 Strong validation:</strong> Has hecho el trabajo duro.
                  Tienes señales reales de product-market fit.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Traction Metrics */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Métricas de Tracción
          </CardTitle>
          <CardDescription>
            Si ya tienes producto, comparte tus números (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_users" className="text-sm font-medium mb-2 block">
                <Users className="h-4 w-4 inline mr-2" />
                Total usuarios/clientes
              </Label>
              <Input
                id="total_users"
                type="number"
                placeholder="0"
                value={traction.total_users || ''}
                onChange={(e) => updateTraction('total_users', parseInt(e.target.value) || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="active_users" className="text-sm font-medium mb-2 block">
                <Users className="h-4 w-4 inline mr-2" />
                Usuarios activos (últimos 30d)
              </Label>
              <Input
                id="active_users"
                type="number"
                placeholder="0"
                value={traction.active_users || ''}
                onChange={(e) => updateTraction('active_users', parseInt(e.target.value) || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="paying_customers" className="text-sm font-medium mb-2 block">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Clientes pagando
              </Label>
              <Input
                id="paying_customers"
                type="number"
                placeholder="0"
                value={traction.paying_customers || ''}
                onChange={(e) => updateTraction('paying_customers', parseInt(e.target.value) || undefined)}
              />
            </div>

            <div>
              <Label htmlFor="monthly_revenue" className="text-sm font-medium mb-2 block">
                <DollarSign className="h-4 w-4 inline mr-2" />
                Revenue mensual (€)
              </Label>
              <Input
                id="monthly_revenue"
                type="number"
                placeholder="0"
                value={traction.monthly_revenue || ''}
                onChange={(e) => updateTraction('monthly_revenue', parseInt(e.target.value) || undefined)}
              />
            </div>
          </div>

          {/* Waitlist */}
          <div>
            <Label htmlFor="waitlist_size" className="text-sm font-medium mb-2 block">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Tamaño de waitlist (si tienes)
            </Label>
            <Input
              id="waitlist_size"
              type="number"
              placeholder="0"
              value={traction.waitlist_size || ''}
              onChange={(e) => updateTraction('waitlist_size', parseInt(e.target.value) || undefined)}
            />
          </div>

          {/* Traction Insights */}
          {hasRevenue && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>💰 Revenue:</strong> Estás generando ingresos - esto es REAL validation.
                Ahora el focus es optimizar unit economics y escalar.
              </div>
            </div>
          )}

          {hasUsers && !hasRevenue && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>📊 Usuarios sin revenue:</strong> Tienes usage pero no monetización.
                Prioridad: experimentar con pricing y conversion funnels.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Rate */}
      {(hasUsers || hasRevenue) && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              ¿Cómo es tu growth?
            </CardTitle>
            <CardDescription>
              Trend de los últimos 3 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={traction.growth_trend}
              onValueChange={(value) =>
                updateTraction('growth_trend', value as CurrentTraction['growth_trend'])
              }
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
                <RadioGroupItem value="rapid_growth" id="rapid_growth" />
                <Label htmlFor="rapid_growth" className="flex-1 cursor-pointer">
                  <div className="font-semibold">🚀 Crecimiento rápido (20%+ MoM)</div>
                  <div className="text-sm text-gray-600">Hockey stick growth</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
                <RadioGroupItem value="steady_growth" id="steady_growth" />
                <Label htmlFor="steady_growth" className="flex-1 cursor-pointer">
                  <div className="font-semibold">📈 Crecimiento constante (5-20% MoM)</div>
                  <div className="text-sm text-gray-600">Growing consistently</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
                <RadioGroupItem value="flat" id="flat" />
                <Label htmlFor="flat" className="flex-1 cursor-pointer">
                  <div className="font-semibold">➡️ Flat/estancado</div>
                  <div className="text-sm text-gray-600">Sin cambio significativo</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-transparent hover:border-orange-200 cursor-pointer">
                <RadioGroupItem value="declining" id="declining" />
                <Label htmlFor="declining" className="flex-1 cursor-pointer">
                  <div className="font-semibold">📉 Decreciendo</div>
                  <div className="text-sm text-gray-600">Perdiendo usuarios/revenue</div>
                </Label>
              </div>
            </RadioGroup>

            {traction.growth_trend === 'declining' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <strong>⚠️ Red flag:</strong> Declining metrics indican problema serio.
                  Necesitas diagnosticar: ¿churn alto? ¿competencia? ¿PMF débil?
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
