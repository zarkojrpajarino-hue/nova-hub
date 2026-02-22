/**
 * YOUR EDGE STEP
 *
 * Founder-idea fit: unfair advantages, unique insights, edge sobre competencia
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, Briefcase, Code, Network, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';
import type { YourEdge } from '@/types/ultra-onboarding';

interface YourEdgeStepProps {
  yourEdge: Partial<YourEdge>;
  onChange: (edge: Partial<YourEdge>) => void;
}

export function YourEdgeStep({ yourEdge, onChange }: YourEdgeStepProps) {
  const updateEdge = <K extends keyof YourEdge>(
    key: K,
    value: YourEdge[K]
  ) => {
    onChange({ ...yourEdge, [key]: value });
  };

  const unfairAdvantages = [
    {
      id: 'domain_expertise',
      label: 'Expertise de Dominio',
      description: '10+ años en la industria, conocimiento profundo',
      icon: Briefcase,
      color: 'blue'
    },
    {
      id: 'network',
      label: 'Network Poderoso',
      description: 'Acceso a clientes, inversores, partners clave',
      icon: Network,
      color: 'purple'
    },
    {
      id: 'technical',
      label: 'Talento Técnico',
      description: 'Puedo construir el producto yo mismo/a',
      icon: Code,
      color: 'green'
    },
    {
      id: 'audience',
      label: 'Audiencia Existente',
      description: 'Seguidores, lista de email, comunidad',
      icon: Users,
      color: 'pink'
    },
    {
      id: 'insider_knowledge',
      label: 'Insider Knowledge',
      description: 'Información privilegiada del problema/mercado',
      icon: Sparkles,
      color: 'amber'
    },
    {
      id: 'unfair_access',
      label: 'Acceso Único',
      description: 'Conexiones exclusivas, deal flow, distribución',
      icon: Zap,
      color: 'orange'
    },
    {
      id: 'capital',
      label: 'Capital Disponible',
      description: 'Runway largo, puedo bootstrappear',
      icon: TrendingUp,
      color: 'cyan'
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'text-purple-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-600' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: 'text-pink-600' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'text-orange-600' },
      cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'text-cyan-600' },
    };
    return colors[color] || colors.blue;
  };

  const selectedAdvantages = yourEdge.unfair_advantages || [];
  const advantageCount = selectedAdvantages.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">⚡ Tu Ventaja Competitiva</h2>
        <p className="text-gray-600">
          ¿Qué tienes tú que otros founders NO tienen? Esto es tu moat personal.
        </p>
      </div>

      {/* Unfair Advantages Selection */}
      <Card className="border-2 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Tus Unfair Advantages
          </CardTitle>
          <CardDescription>
            Selecciona todas las que apliquen (las más importantes primero)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {unfairAdvantages.map((advantage) => {
            const Icon = advantage.icon;
            const colors = getColorClasses(advantage.color);
            const isSelected = selectedAdvantages.includes(advantage.id as any);

            return (
              <div
                key={advantage.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? `${colors.bg} ${colors.border} shadow-md`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  const current = selectedAdvantages;
                  const updated = isSelected
                    ? current.filter((id) => id !== advantage.id)
                    : [...current, advantage.id as any];
                  updateEdge('unfair_advantages', updated);
                }}
              >
                <div className={`mt-1 ${isSelected ? colors.icon : 'text-gray-600'}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Checkbox
                      id={advantage.id}
                      checked={isSelected}
                      onCheckedChange={() => {
                        const current = selectedAdvantages;
                        const updated = isSelected
                          ? current.filter((id) => id !== advantage.id)
                          : [...current, advantage.id as any];
                        updateEdge('unfair_advantages', updated);
                      }}
                    />
                    <Label htmlFor={advantage.id} className="font-semibold cursor-pointer">
                      {advantage.label}
                    </Label>
                  </div>
                  <div className={`text-sm ml-6 ${isSelected ? colors.text : 'text-gray-600'}`}>
                    {advantage.description}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Advantage Count Badge */}
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm font-medium text-gray-700">
              Ventajas seleccionadas:
            </span>
            <Badge
              variant={advantageCount >= 2 ? 'default' : 'secondary'}
              className={advantageCount >= 2 ? 'bg-green-600' : ''}
            >
              {advantageCount} {advantageCount >= 2 ? '✓' : '(mín. 2 recomendado)'}
            </Badge>
          </div>

          {/* Contextual feedback */}
          {advantageCount === 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Sin unfair advantages:</strong> Emprender sin ventajas competitivas es jugar en hard mode.
                Considera desarrollar expertise, audiencia, o network ANTES de lanzar.
              </div>
            </div>
          )}

          {advantageCount >= 3 && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>💪 Posición fuerte:</strong> Múltiples unfair advantages = moat defendible.
                Estos activos te dan head start masivo sobre competidores.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unique Insight */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Tu Unique Insight
          </CardTitle>
          <CardDescription>
            ¿Qué sabes del problema/mercado que casi nadie más sabe?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={yourEdge.unique_insight || ''}
            onChange={(e) => updateEdge('unique_insight', e.target.value)}
            placeholder="Ej: 'Todos atacan el mercado de freelancers pensando que quieren más clientes. Pero tras entrevistar a 50+ freelancers, descubrí que su REAL problema es cobrar a clientes existentes. El 60% tiene facturas pendientes de más de 60 días. Nadie está resolviendo esto.'"
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Tu insight único es lo que separa un "me too" producto de algo realmente diferenciado.
          </p>
        </CardContent>
      </Card>

      {/* Why You Can't NOT Do This */}
      <Card className="border-2 border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-pink-600" />
            ¿Por qué TÚ específicamente?
          </CardTitle>
          <CardDescription>
            ¿Por qué eres la persona perfecta para ejecutar esto?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={yourEdge.why_you_specifically || ''}
            onChange={(e) => updateEdge('why_you_specifically', e.target.value)}
            placeholder="Ej: 'Fui CFO de 3 startups, sé exactamente qué métricas importan. Tengo relación directa con 15 VCs que me dijeron que invertirían. Y ya construí un MVP similar que llegó a 10K usuarios antes de pivotear. Esta es mi segunda vuelta con conocimiento completo del espacio.'"
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Investors y early adopters apuestan a founders, no solo a ideas. ¿Por qué tú?
          </p>
        </CardContent>
      </Card>

      {/* Secret Weapon */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            Tu "Secret Weapon"
          </CardTitle>
          <CardDescription>
            ¿Tienes algún recurso, conexión, o ventaja secreta? (Opcional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={yourEdge.secret_weapon || ''}
            onChange={(e) => updateEdge('secret_weapon', e.target.value)}
            placeholder="Ej: 'Mi mejor amigo es VP of Sales en la empresa líder del espacio y me dijo que me pasará leads calificados cuando lance' o 'Tengo acceso a dataset propietario de 10M+ transacciones que nadie más tiene'"
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-700 mt-2">
            Si tienes un ace bajo la manga, cuéntanos. Esto puede cambiar completamente tu estrategia.
          </p>
        </CardContent>
      </Card>

      {/* Edge Summary */}
      {advantageCount >= 2 && yourEdge.unique_insight && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-yellow-900 mb-2">
                ⚡ Tu Edge está definido
              </div>
              <div className="text-sm text-yellow-800">
                Con {advantageCount} unfair advantage{advantageCount > 1 ? 's' : ''} y un insight único, tienes:
              </div>
              <ul className="text-sm text-yellow-800 mt-2 space-y-1 ml-4">
                <li>• <strong>Moat defendible:</strong> Competitors no pueden simplemente copiar</li>
                <li>• <strong>Fast execution:</strong> Tu expertise acelera tu time-to-market</li>
                <li>• <strong>Credibilidad:</strong> Investors y clientes confiarán en ti</li>
                <li>• <strong>Sustainable advantage:</strong> No depende solo de la idea</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {advantageCount === 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-900 mb-2">
                ⚠️ Red flag: Sin unfair advantages
              </div>
              <div className="text-sm text-red-800">
                Considera pausar y construir ventajas PRIMERO:
              </div>
              <ul className="text-sm text-red-800 mt-2 space-y-1 ml-4">
                <li>• Trabaja en la industria 1-2 años → Expertise + Network</li>
                <li>• Construye audiencia en Twitter/LinkedIn → Distribution</li>
                <li>• Haz consulting en el espacio → Insider knowledge + Capital</li>
                <li>• Aprende a codear → Technical advantage</li>
              </ul>
              <div className="mt-2 font-semibold">
                Sin edge, competirás solo en ejecución vs incumbents con ventajas masivas.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
