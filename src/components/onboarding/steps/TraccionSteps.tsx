/**
 * TRACCIÓN STATE ONBOARDING STEPS
 *
 * For growing businesses with 10-100 customers and €1-10k/month revenue
 * Focus: Growth metrics, unit economics, scaling operations
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SmartOnboardingInput } from '@/components/onboarding/SmartOnboardingInput';
import type { TraccionData } from '../types';

interface StepProps {
  data: TraccionData;
  onChange: (partial: Partial<TraccionData>) => void;
  errors?: Record<string, string>;
}

// Step 1: Key Metrics
export function StepKeyMetrics({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">📈 Métricas Clave</h3>
        <p className="text-sm text-muted-foreground">
          Estado actual del negocio
        </p>
      </div>

      {/* AI-Powered Smart Input */}
      <SmartOnboardingInput
        projectPhase="traccion"
        currentFormData={data}
        onDataExtracted={(extractedData) => onChange(extractedData)}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="num_clientes">Clientes Activos *</Label>
            <Input
              id="num_clientes"
              type="number"
              placeholder="45"
              value={data.num_clientes || ''}
              onChange={(e) => onChange({ num_clientes: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.num_clientes && (
              <p className="text-sm text-destructive mt-1">{errors.num_clientes}</p>
            )}
          </div>

          <div>
            <Label htmlFor="mrr">MRR (€/mes) *</Label>
            <Input
              id="mrr"
              type="number"
              placeholder="5000"
              value={data.mrr || ''}
              onChange={(e) => onChange({ mrr: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.mrr && (
              <p className="text-sm text-destructive mt-1">{errors.mrr}</p>
            )}
          </div>

          <div>
            <Label htmlFor="crecimiento_mom">Crecimiento MoM (%) *</Label>
            <Input
              id="crecimiento_mom"
              type="number"
              placeholder="15"
              value={data.crecimiento_mom || ''}
              onChange={(e) => onChange({ crecimiento_mom: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.crecimiento_mom && (
              <p className="text-sm text-destructive mt-1">{errors.crecimiento_mom}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="cac">CAC - Coste Adquisición (€) *</Label>
            <Input
              id="cac"
              type="number"
              placeholder="200"
              value={data.cac || ''}
              onChange={(e) => onChange({ cac: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.cac && (
              <p className="text-sm text-destructive mt-1">{errors.cac}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ltv">LTV - Lifetime Value (€) *</Label>
            <Input
              id="ltv"
              type="number"
              placeholder="1200"
              value={data.ltv || ''}
              onChange={(e) => onChange({ ltv: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.ltv && (
              <p className="text-sm text-destructive mt-1">{errors.ltv}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ratio LTV:CAC saludable: 3:1 o superior
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="churn_rate">Churn Rate Mensual (%) *</Label>
            <Input
              id="churn_rate"
              type="number"
              step="0.1"
              placeholder="5"
              value={data.churn_rate || ''}
              onChange={(e) => onChange({ churn_rate: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.churn_rate && (
              <p className="text-sm text-destructive mt-1">{errors.churn_rate}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ticket_promedio">Ticket Promedio (€/mes) *</Label>
            <Input
              id="ticket_promedio"
              type="number"
              placeholder="120"
              value={data.ticket_promedio || ''}
              onChange={(e) => onChange({ ticket_promedio: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.ticket_promedio && (
              <p className="text-sm text-destructive mt-1">{errors.ticket_promedio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 2: Growth Engine
export function StepGrowthEngine({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🚀 Motor de Crecimiento</h3>
        <p className="text-sm text-muted-foreground">
          ¿Cómo estás adquiriendo y reteniendo clientes?
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="canales_principales">Top 3 canales de adquisición *</Label>
          <Textarea
            id="canales_principales"
            placeholder="1. SEO/contenido (40% leads)&#10;2. Referencias (30%)&#10;3. LinkedIn ads (20%)..."
            value={data.canales_principales}
            onChange={(e) => onChange({ canales_principales: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.canales_principales && (
            <p className="text-sm text-destructive mt-1">{errors.canales_principales}</p>
          )}
        </div>

        <div>
          <Label htmlFor="conversion_rate">Tasa de conversión (lead → customer) *</Label>
          <Input
            id="conversion_rate"
            placeholder="Ej: 15% de demos cierran"
            value={data.conversion_rate}
            onChange={(e) => onChange({ conversion_rate: e.target.value })}
            className="mt-2"
          />
          {errors?.conversion_rate && (
            <p className="text-sm text-destructive mt-1">{errors.conversion_rate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="estrategia_retencion">¿Cómo retienes clientes? *</Label>
          <Textarea
            id="estrategia_retencion"
            placeholder="Onboarding, soporte, nuevas features, community, etc."
            value={data.estrategia_retencion}
            onChange={(e) => onChange({ estrategia_retencion: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.estrategia_retencion && (
            <p className="text-sm text-destructive mt-1">{errors.estrategia_retencion}</p>
          )}
        </div>

        <div>
          <Label htmlFor="competencia">¿Quiénes son tus principales competidores?</Label>
          <Textarea
            id="competencia"
            placeholder="Competidores directos y por qué ganas/pierdes vs ellos..."
            value={data.competencia || ''}
            onChange={(e) => onChange({ competencia: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Operations & Team
export function StepOperationsTeam({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">⚙️ Operaciones y Equipo</h3>
        <p className="text-sm text-muted-foreground">
          Estructura y procesos
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tamano_equipo">Tamaño del equipo (FTE) *</Label>
          <Input
            id="tamano_equipo"
            type="number"
            placeholder="4"
            value={data.tamano_equipo || ''}
            onChange={(e) => onChange({ tamano_equipo: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          {errors?.tamano_equipo && (
            <p className="text-sm text-destructive mt-1">{errors.tamano_equipo}</p>
          )}
        </div>

        <div>
          <Label htmlFor="roles_equipo">Roles en el equipo *</Label>
          <Textarea
            id="roles_equipo"
            placeholder="Ej: 1 CEO, 2 developers, 1 sales/marketing"
            value={data.roles_equipo}
            onChange={(e) => onChange({ roles_equipo: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.roles_equipo && (
            <p className="text-sm text-destructive mt-1">{errors.roles_equipo}</p>
          )}
        </div>

        <div>
          <Label htmlFor="burn_rate">Burn rate mensual (€) *</Label>
          <Input
            id="burn_rate"
            type="number"
            placeholder="3000"
            value={data.burn_rate || ''}
            onChange={(e) => onChange({ burn_rate: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          {errors?.burn_rate && (
            <p className="text-sm text-destructive mt-1">{errors.burn_rate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="runway">Runway (meses)</Label>
          <Input
            id="runway"
            type="number"
            placeholder="12"
            value={data.runway || ''}
            onChange={(e) => onChange({ runway: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tiempo hasta quedarte sin cash al burn rate actual
          </p>
        </div>

        <div>
          <Label htmlFor="procesos_clave">Procesos o sistemas clave que tienes implementados</Label>
          <Textarea
            id="procesos_clave"
            placeholder="CRM, herramientas analytics, procesos de soporte, etc."
            value={data.procesos_clave || ''}
            onChange={(e) => onChange({ procesos_clave: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 4: Growth Plan
export function StepGrowthPlan({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🎯 Plan de Crecimiento</h3>
        <p className="text-sm text-muted-foreground">
          Objetivos próximos 6-12 meses
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="objetivo_mrr">Objetivo MRR (6 meses) *</Label>
            <Input
              id="objetivo_mrr"
              type="number"
              placeholder="15000"
              value={data.objetivo_mrr || ''}
              onChange={(e) => onChange({ objetivo_mrr: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.objetivo_mrr && (
              <p className="text-sm text-destructive mt-1">{errors.objetivo_mrr}</p>
            )}
          </div>

          <div>
            <Label htmlFor="objetivo_clientes">Objetivo Clientes *</Label>
            <Input
              id="objetivo_clientes"
              type="number"
              placeholder="150"
              value={data.objetivo_clientes || ''}
              onChange={(e) => onChange({ objetivo_clientes: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.objetivo_clientes && (
              <p className="text-sm text-destructive mt-1">{errors.objetivo_clientes}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="prioridades">Top 3 iniciativas estratégicas *</Label>
          <Textarea
            id="prioridades"
            placeholder="1. Lanzar nuevo pricing tier&#10;2. Optimizar onboarding (reducir churn)&#10;3. Escalar canal SEO..."
            value={data.prioridades}
            onChange={(e) => onChange({ prioridades: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.prioridades && (
            <p className="text-sm text-destructive mt-1">{errors.prioridades}</p>
          )}
        </div>

        <div>
          <Label htmlFor="retos_principales">Principales retos para alcanzar objetivos *</Label>
          <Textarea
            id="retos_principales"
            placeholder="Escalabilidad técnica, contrataciones, dependencia de un canal, etc."
            value={data.retos_principales}
            onChange={(e) => onChange({ retos_principales: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.retos_principales && (
            <p className="text-sm text-destructive mt-1">{errors.retos_principales}</p>
          )}
        </div>

        <div>
          <Label htmlFor="fundraising">¿Estás fundraising o planeas hacerlo?</Label>
          <Textarea
            id="fundraising"
            placeholder="No / Sí, buscando €X / Sí, ya en conversaciones..."
            value={data.fundraising || ''}
            onChange={(e) => onChange({ fundraising: e.target.value })}
            className="min-h-[60px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}
