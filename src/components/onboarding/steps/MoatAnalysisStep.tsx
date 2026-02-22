/**
 * MOAT ANALYSIS STEP
 * Defensibility & sustainable advantage analysis
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Lock, TrendingUp, AlertCircle } from 'lucide-react';
import type { MoatAnalysis } from '@/types/ultra-onboarding';

interface MoatAnalysisStepProps {
  moat: Partial<MoatAnalysis>;
  onChange: (moat: Partial<MoatAnalysis>) => void;
}

export function MoatAnalysisStep({ moat, onChange }: MoatAnalysisStepProps) {
  const updateMoat = <K extends keyof MoatAnalysis>(key: K, value: MoatAnalysis[K]) => {
    onChange({ ...moat, [key]: value });
  };

  const moatTypes = [
    { id: 'network_effects', label: 'Network Effects', description: 'Más users = más valor para todos' },
    { id: 'switching_costs', label: 'Switching Costs', description: 'Difícil/costoso cambiar a competidor' },
    { id: 'data_moat', label: 'Data Moat', description: 'Datos propietarios que mejoran producto' },
    { id: 'brand', label: 'Brand', description: 'Reconocimiento y confianza de marca' },
    { id: 'regulatory', label: 'Regulatory', description: 'Licencias, compliance barriers' },
    { id: 'ip_patents', label: 'IP / Patents', description: 'Propiedad intelectual protegida' },
    { id: 'exclusive_contracts', label: 'Exclusive Contracts', description: 'Contratos exclusivos con suppliers/distributors' },
    { id: 'economies_scale', label: 'Economies of Scale', description: 'Cost advantages al crecer' },
  ];

  const selectedMoats = moat.moat_types || [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🛡️ Moat Analysis</h2>
        <p className="text-gray-600">¿Qué te protege de competidores?</p>
      </div>

      {/* Moat Types */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Tipos de Moat que Tienes/Construirás
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {moatTypes.map((type) => (
            <div key={type.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-blue-50">
              <Checkbox
                id={type.id}
                checked={selectedMoats.includes(type.id as MoatAnalysis['moat_types'][number])}
                onCheckedChange={(checked) => {
                  const updated = checked
                    ? [...selectedMoats, type.id as MoatAnalysis['moat_types'][number]]
                    : selectedMoats.filter(m => m !== type.id);
                  updateMoat('moat_types', updated);
                }}
              />
              <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                <div className="font-semibold">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </Label>
            </div>
          ))}

          {selectedMoats.length === 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <strong>⚠️ Sin moat:</strong> Sin defensibility, cualquiera puede copiar tu producto.
                Necesitas construir moat deliberadamente.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copyability */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-purple-600" />
            ¿Qué tan fácil es copiar tu producto?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={moat.copyability} onValueChange={(value) => updateMoat('copyability', value as MoatAnalysis['copyability'])}>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="very_hard" id="very_hard" className="mt-1" />
              <Label htmlFor="very_hard" className="flex-1 cursor-pointer">
                <div className="font-semibold">Muy difícil de copiar</div>
                <div className="text-sm text-gray-600">Tech propietario, patents, o network effects fuertes</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="hard" id="hard" className="mt-1" />
              <Label htmlFor="hard" className="flex-1 cursor-pointer">
                <div className="font-semibold">Difícil</div>
                <div className="text-sm text-gray-600">Requiere expertise, data, o tiempo significativo</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="moderate" id="moderate" className="mt-1" />
              <Label htmlFor="moderate" className="flex-1 cursor-pointer">
                <div className="font-semibold">Moderado</div>
                <div className="text-sm text-gray-600">Competidor con recursos podría copiar en 6-12 meses</div>
              </Label>
            </div>
            <div className="flex items-start space-x-2 p-3 border-2 rounded-lg">
              <RadioGroupItem value="easy" id="easy" className="mt-1" />
              <Label htmlFor="easy" className="flex-1 cursor-pointer">
                <div className="font-semibold">Fácil de copiar</div>
                <div className="text-sm text-gray-600">Cualquier dev competente podría replicarlo en semanas</div>
              </Label>
            </div>
          </RadioGroup>

          {moat.copyability === 'easy' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <strong>🔴 High risk:</strong> Si es fácil copiar, necesitas construir moat RÁPIDO vía
                brand, network effects, o exclusive partnerships. First-mover advantage se evapora rápido.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Moat Building Strategy */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Estrategia para Construir Moat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={moat.moat_building_strategy || ''}
            onChange={(e) => updateMoat('moat_building_strategy', e.target.value)}
            placeholder="Ej: 'Primeros 12 meses: acumular data propietaria de 1M+ transactions. Esto nos da ML models que nadie más tiene. Luego: lock-in via integrations profundas con enterprise tools.'"
            rows={6}
          />
          <p className="text-xs text-gray-700 mt-2">
            Moat no aparece solo - tienes que construirlo deliberadamente
          </p>
        </CardContent>
      </Card>

      {/* Time to Build Moat */}
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle>⏱️ ¿Cuánto tardarás en tener moat defendible?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={moat.time_to_moat} onValueChange={(value) => updateMoat('time_to_moat', value as MoatAnalysis['time_to_moat'])}>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="immediate" id="immediate" />
              <Label htmlFor="immediate" className="cursor-pointer">Ya tengo moat (patents, exclusive contracts, etc.)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="6_months" id="6_months" />
              <Label htmlFor="6_months" className="cursor-pointer">6 meses (network effects early, brand)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="12_months" id="12_months" />
              <Label htmlFor="12_months" className="cursor-pointer">12 meses (data accumulation, switching costs)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="24_months" id="24_months" />
              <Label htmlFor="24_months" className="cursor-pointer">24+ meses (economies of scale, brand)</Label>
            </div>
            <div className="flex items-center space-x-2 p-2">
              <RadioGroupItem value="unclear" id="unclear" />
              <Label htmlFor="unclear" className="cursor-pointer">No claro / No tengo moat strategy</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Biggest Vulnerability */}
      <Card className="border-2 border-red-200">
        <CardHeader>
          <CardTitle>🎯 Mayor Vulnerabilidad</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={moat.biggest_vulnerability || ''}
            onChange={(e) => updateMoat('biggest_vulnerability', e.target.value)}
            placeholder="Ej: 'Dependemos de API de tercero que podría cortarnos acceso' o 'No tenemos moat real, solo execution speed' o 'Incumbents podrían lanzar feature similar y destruirnos'"
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
