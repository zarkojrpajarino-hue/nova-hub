/**
 * IDEA STATE ONBOARDING STEPS
 *
 * For projects in exploration phase:
 * - No customers yet
 * - No revenue
 * - Validating problem/solution fit
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { SmartOnboardingInput } from '@/components/onboarding/SmartOnboardingInput';
import type { IdeaData } from '../types';

interface StepProps {
  data: IdeaData;
  onChange: (partial: Partial<IdeaData>) => void;
  errors?: Record<string, string>;
}

// Step 1: Problem Discovery
export function StepProblemDiscovery({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🔍 Descubrimiento del Problema</h3>
        <p className="text-sm text-muted-foreground">
          Identifica el problema que quieres resolver
        </p>
      </div>

      {/* AI-Powered Smart Input */}
      <SmartOnboardingInput
        projectPhase="idea"
        currentFormData={data}
        onDataExtracted={(extractedData) => onChange(extractedData)}
      />

      <div className="space-y-4">
        <div>
          <Label htmlFor="problema">¿Qué problema estás intentando resolver? *</Label>
          <Textarea
            id="problema"
            placeholder="Describe el problema de manera específica..."
            value={data.problema}
            onChange={(e) => onChange({ problema: e.target.value })}
            className="min-h-[120px] mt-2"
          />
          {errors?.problema && (
            <p className="text-sm text-destructive mt-1">{errors.problema}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Ej: "Las empresas pequeñas no pueden gestionar fácilmente sus finanzas porque las
            herramientas existentes son demasiado complejas"
          </p>
        </div>

        <div>
          <Label htmlFor="quien_problema">¿Quién tiene este problema? *</Label>
          <Textarea
            id="quien_problema"
            placeholder="Describe quién sufre este problema..."
            value={data.quien_problema}
            onChange={(e) => onChange({ quien_problema: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.quien_problema && (
            <p className="text-sm text-destructive mt-1">{errors.quien_problema}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Ej: "Autónomos y pequeños negocios con menos de 5 empleados en España"
          </p>
        </div>

        <div>
          <Label htmlFor="impacto_problema">¿Qué impacto tiene este problema? *</Label>
          <Textarea
            id="impacto_problema"
            placeholder="Describe cómo afecta este problema..."
            value={data.impacto_problema}
            onChange={(e) => onChange({ impacto_problema: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.impacto_problema && (
            <p className="text-sm text-destructive mt-1">{errors.impacto_problema}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Ej: "Pierden 5-10 horas al mes en gestión manual, cometen errores que les cuestan
            dinero"
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 2: Solution Hypothesis
export function StepSolutionHypothesis({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">💡 Hipótesis de Solución</h3>
        <p className="text-sm text-muted-foreground">
          Tu propuesta de solución (no tiene que estar validada aún)
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="solucion">¿Cómo crees que puedes resolver este problema? *</Label>
          <Textarea
            id="solucion"
            placeholder="Describe tu idea de solución..."
            value={data.solucion}
            onChange={(e) => onChange({ solucion: e.target.value })}
            className="min-h-[120px] mt-2"
          />
          {errors?.solucion && (
            <p className="text-sm text-destructive mt-1">{errors.solucion}</p>
          )}
        </div>

        <div>
          <Label htmlFor="propuesta_valor">¿Por qué tu solución sería mejor que las alternativas? *</Label>
          <Textarea
            id="propuesta_valor"
            placeholder="¿Qué hace tu solución diferente o mejor?"
            value={data.propuesta_valor}
            onChange={(e) => onChange({ propuesta_valor: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.propuesta_valor && (
            <p className="text-sm text-destructive mt-1">{errors.propuesta_valor}</p>
          )}
        </div>

        <div>
          <Label htmlFor="alternativas_actuales">¿Cómo resuelven este problema actualmente?</Label>
          <Textarea
            id="alternativas_actuales"
            placeholder="Excel, procesos manuales, otras herramientas, etc."
            value={data.alternativas_actuales || ''}
            onChange={(e) => onChange({ alternativas_actuales: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Opcional pero recomendado - ayuda a entender la competencia indirecta
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 3: Hypotheses to Validate
export function StepHypothesesToValidate({ data, onChange, errors }: StepProps) {
  const addHypothesis = () => {
    onChange({
      hipotesis_validar: [...(data.hipotesis_validar || []), ''],
    });
  };

  const removeHypothesis = (index: number) => {
    const updated = [...(data.hipotesis_validar || [])];
    updated.splice(index, 1);
    onChange({ hipotesis_validar: updated });
  };

  const updateHypothesis = (index: number, value: string) => {
    const updated = [...(data.hipotesis_validar || [])];
    updated[index] = value;
    onChange({ hipotesis_validar: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🧪 Hipótesis a Validar</h3>
        <p className="text-sm text-muted-foreground">
          ¿Qué supuestos críticos necesitas validar antes de construir?
        </p>
      </div>

      <div className="space-y-3">
        {(data.hipotesis_validar || ['']).map((hipotesis, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Hipótesis ${index + 1}: "Los usuarios pagarían €X/mes por Y funcionalidad"`}
              value={hipotesis}
              onChange={(e) => updateHypothesis(index, e.target.value)}
            />
            {data.hipotesis_validar && data.hipotesis_validar.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeHypothesis(index)}
                type="button"
              >
                <X size={16} />
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addHypothesis} type="button">
          <Plus size={16} className="mr-2" />
          Añadir Hipótesis
        </Button>

        {errors?.hipotesis_validar && (
          <p className="text-sm text-destructive">{errors.hipotesis_validar}</p>
        )}
      </div>

      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
        <p className="font-medium mb-2">💡 Ejemplos de hipótesis críticas:</p>
        <ul className="space-y-1 text-muted-foreground">
          <li>• "El problema X es lo suficientemente doloroso para pagar por resolverlo"</li>
          <li>• "Los usuarios preferirán mi solución vs Excel"</li>
          <li>• "Puedo adquirir clientes por menos de €X"</li>
          <li>• "Los usuarios usarán la app al menos 3 veces por semana"</li>
        </ul>
      </div>
    </div>
  );
}

// Step 4: Validation Plan
export function StepValidationPlan({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">📋 Plan de Validación</h3>
        <p className="text-sm text-muted-foreground">
          ¿Cómo vas a validar tus hipótesis?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="primeros_pasos">Primeros pasos para validar (próximas 2-4 semanas) *</Label>
          <Textarea
            id="primeros_pasos"
            placeholder="Ej: Entrevistar 10 clientes potenciales, crear landing page, etc."
            value={data.primeros_pasos}
            onChange={(e) => onChange({ primeros_pasos: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.primeros_pasos && (
            <p className="text-sm text-destructive mt-1">{errors.primeros_pasos}</p>
          )}
        </div>

        <div>
          <Label htmlFor="metrica_exito">¿Cómo sabrás que has validado el problema/solución? *</Label>
          <Textarea
            id="metrica_exito"
            placeholder="Ej: 20 personas dicen que pagarían, 5 pre-compras, etc."
            value={data.metrica_exito}
            onChange={(e) => onChange({ metrica_exito: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.metrica_exito && (
            <p className="text-sm text-destructive mt-1">{errors.metrica_exito}</p>
          )}
        </div>

        <div>
          <Label htmlFor="recursos">¿Qué recursos tienes disponibles?</Label>
          <Textarea
            id="recursos"
            placeholder="Tiempo disponible, presupuesto, habilidades del equipo, etc."
            value={data.recursos || ''}
            onChange={(e) => onChange({ recursos: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>

        <div>
          <Label htmlFor="bloqueadores">¿Qué obstáculos anticipas?</Label>
          <Textarea
            id="bloqueadores"
            placeholder="Limitaciones de tiempo, presupuesto, acceso a clientes, etc."
            value={data.bloqueadores || ''}
            onChange={(e) => onChange({ bloqueadores: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}
