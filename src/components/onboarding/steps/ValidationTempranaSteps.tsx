/**
 * VALIDACIÓN TEMPRANA STATE ONBOARDING STEPS
 *
 * For projects with first customers (1-10) and early revenue (€0-1k/month)
 * Focus: Product-market fit validation, feedback loops, early metrics
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SmartOnboardingInput } from '@/components/onboarding/SmartOnboardingInput';
import type { ValidacionTempranaData } from '../types';

interface StepProps {
  data: ValidacionTempranaData;
  onChange: (partial: Partial<ValidacionTempranaData>) => void;
  errors?: Record<string, string>;
}

// Step 1: Current Status
export function StepCurrentStatus({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">📊 Estado Actual</h3>
        <p className="text-sm text-muted-foreground">
          Cuéntanos sobre tu tracción inicial
        </p>
      </div>

      {/* AI-Powered Smart Input */}
      <SmartOnboardingInput
        projectPhase="problema_validado"
        currentFormData={data}
        onDataExtracted={(extractedData) => onChange(extractedData)}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="num_clientes">Número de clientes activos *</Label>
            <Input
              id="num_clientes"
              type="number"
              placeholder="5"
              value={data.num_clientes || ''}
              onChange={(e) => onChange({ num_clientes: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.num_clientes && (
              <p className="text-sm text-destructive mt-1">{errors.num_clientes}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mrr_actual">MRR Actual (€/mes) *</Label>
            <Input
              id="mrr_actual"
              type="number"
              placeholder="500"
              value={data.mrr_actual || ''}
              onChange={(e) => onChange({ mrr_actual: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.mrr_actual && (
              <p className="text-sm text-destructive mt-1">{errors.mrr_actual}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="problema_resuelto">¿Qué problema estás resolviendo para tus clientes? *</Label>
          <Textarea
            id="problema_resuelto"
            placeholder="Describe el problema..."
            value={data.problema_resuelto}
            onChange={(e) => onChange({ problema_resuelto: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.problema_resuelto && (
            <p className="text-sm text-destructive mt-1">{errors.problema_resuelto}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cliente_tipico">Describe tu cliente típico *</Label>
          <Textarea
            id="cliente_tipico"
            placeholder="Perfil del cliente que más se beneficia de tu solución..."
            value={data.cliente_tipico}
            onChange={(e) => onChange({ cliente_tipico: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.cliente_tipico && (
            <p className="text-sm text-destructive mt-1">{errors.cliente_tipico}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 2: Feedback & Learning
export function StepFeedbackLearning({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">💬 Aprendizajes y Feedback</h3>
        <p className="text-sm text-muted-foreground">
          ¿Qué has aprendido de tus primeros clientes?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="feedback_positivo">¿Qué valoran más tus clientes? *</Label>
          <Textarea
            id="feedback_positivo"
            placeholder="Features o aspectos que más aprecian..."
            value={data.feedback_positivo}
            onChange={(e) => onChange({ feedback_positivo: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.feedback_positivo && (
            <p className="text-sm text-destructive mt-1">{errors.feedback_positivo}</p>
          )}
        </div>

        <div>
          <Label htmlFor="feedback_negativo">¿Qué les falta o qué mejorarían? *</Label>
          <Textarea
            id="feedback_negativo"
            placeholder="Quejas, solicitudes de features, frustraciones..."
            value={data.feedback_negativo}
            onChange={(e) => onChange({ feedback_negativo: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.feedback_negativo && (
            <p className="text-sm text-destructive mt-1">{errors.feedback_negativo}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tasa_retencion">¿Cuántos clientes han cancelado vs los que siguen?</Label>
          <Input
            id="tasa_retencion"
            placeholder="Ej: 1 de 8 canceló (87% retención)"
            value={data.tasa_retencion || ''}
            onChange={(e) => onChange({ tasa_retencion: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Product-Market Fit Validation
export function StepPMFValidation({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🎯 Validación de Product-Market Fit</h3>
        <p className="text-sm text-muted-foreground">
          Indicadores de que estás encontrando PMF
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="como_llegaron">¿Cómo llegaron tus primeros clientes? *</Label>
          <Textarea
            id="como_llegaron"
            placeholder="Referidos, ads, contenido, networking, etc."
            value={data.como_llegaron}
            onChange={(e) => onChange({ como_llegaron: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.como_llegaron && (
            <p className="text-sm text-destructive mt-1">{errors?.como_llegaron}</p>
          )}
        </div>

        <div>
          <Label htmlFor="tiempo_venta">¿Cuánto tarda cerrar una venta? *</Label>
          <Input
            id="tiempo_venta"
            placeholder="Ej: 1 semana, 2 días, etc."
            value={data.tiempo_venta}
            onChange={(e) => onChange({ tiempo_venta: e.target.value })}
            className="mt-2"
          />
          {errors?.tiempo_venta && (
            <p className="text-sm text-destructive mt-1">{errors.tiempo_venta}</p>
          )}
        </div>

        <div>
          <Label htmlFor="metricas_seguimiento">¿Qué métricas estás siguiendo? *</Label>
          <Textarea
            id="metricas_seguimiento"
            placeholder="MRR, churn rate, engagement, NPS, etc."
            value={data.metricas_seguimiento}
            onChange={(e) => onChange({ metricas_seguimiento: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.metricas_seguimiento && (
            <p className="text-sm text-destructive mt-1">{errors.metricas_seguimiento}</p>
          )}
        </div>

        <div>
          <Label htmlFor="bloqueadores_crecimiento">¿Qué te impide crecer más rápido?</Label>
          <Textarea
            id="bloqueadores_crecimiento"
            placeholder="Falta de features, capacidad, presupuesto marketing, etc."
            value={data.bloqueadores_crecimiento || ''}
            onChange={(e) => onChange({ bloqueadores_crecimiento: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 4: Next Steps
export function StepNextSteps({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🚀 Próximos Pasos</h3>
        <p className="text-sm text-muted-foreground">
          Prioridades para los próximos 1-3 meses
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="objetivo_clientes">Objetivo de clientes (próximos 3 meses) *</Label>
          <Input
            id="objetivo_clientes"
            type="number"
            placeholder="20"
            value={data.objetivo_clientes || ''}
            onChange={(e) => onChange({ objetivo_clientes: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          {errors?.objetivo_clientes && (
            <p className="text-sm text-destructive mt-1">{errors.objetivo_clientes}</p>
          )}
        </div>

        <div>
          <Label htmlFor="objetivo_mrr">Objetivo de MRR (€/mes) *</Label>
          <Input
            id="objetivo_mrr"
            type="number"
            placeholder="2000"
            value={data.objetivo_mrr || ''}
            onChange={(e) => onChange({ objetivo_mrr: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          {errors?.objetivo_mrr && (
            <p className="text-sm text-destructive mt-1">{errors.objetivo_mrr}</p>
          )}
        </div>

        <div>
          <Label htmlFor="prioridades">Top 3 prioridades *</Label>
          <Textarea
            id="prioridades"
            placeholder="1. Mejorar onboarding&#10;2. Añadir feature X&#10;3. Aumentar tasa conversión..."
            value={data.prioridades}
            onChange={(e) => onChange({ prioridades: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.prioridades && (
            <p className="text-sm text-destructive mt-1">{errors.prioridades}</p>
          )}
        </div>

        <div>
          <Label htmlFor="necesidades_equipo">¿Qué necesita tu equipo para alcanzar estos objetivos?</Label>
          <Textarea
            id="necesidades_equipo"
            placeholder="Más tiempo desarrollo, presupuesto marketing, formación, etc."
            value={data.necesidades_equipo || ''}
            onChange={(e) => onChange({ necesidades_equipo: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}
