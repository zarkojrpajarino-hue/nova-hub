/**
 * CONSOLIDADO STATE ONBOARDING STEPS
 *
 * For established businesses with 100+ customers and €10k+/month revenue
 * Focus: Scaling, optimization, expansion, team management
 */

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SmartOnboardingInput } from '@/components/onboarding/SmartOnboardingInput';
import type { ConsolidadoData } from '../types';

interface StepProps {
  data: ConsolidadoData;
  onChange: (partial: Partial<ConsolidadoData>) => void;
  errors?: Record<string, string>;
}

// Step 1: Business Metrics
export function StepBusinessMetrics({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">💼 Métricas del Negocio</h3>
        <p className="text-sm text-muted-foreground">
          Estado actual de la empresa
        </p>
      </div>

      {/* AI-Powered Smart Input */}
      <SmartOnboardingInput
        projectPhase="crecimiento"
        currentFormData={data}
        onDataExtracted={(extractedData) => onChange(extractedData)}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="num_clientes">Clientes Activos *</Label>
            <Input
              id="num_clientes"
              type="number"
              placeholder="250"
              value={data.num_clientes || ''}
              onChange={(e) => onChange({ num_clientes: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.num_clientes && (
              <p className="text-sm text-destructive mt-1">{errors.num_clientes}</p>
            )}
          </div>

          <div>
            <Label htmlFor="arr">ARR - Annual Recurring Revenue (€) *</Label>
            <Input
              id="arr"
              type="number"
              placeholder="250000"
              value={data.arr || ''}
              onChange={(e) => onChange({ arr: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.arr && (
              <p className="text-sm text-destructive mt-1">{errors.arr}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="yoy_growth">Crecimiento YoY (%) *</Label>
            <Input
              id="yoy_growth"
              type="number"
              placeholder="120"
              value={data.yoy_growth || ''}
              onChange={(e) => onChange({ yoy_growth: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.yoy_growth && (
              <p className="text-sm text-destructive mt-1">{errors.yoy_growth}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gross_margin">Gross Margin (%) *</Label>
            <Input
              id="gross_margin"
              type="number"
              placeholder="75"
              value={data.gross_margin || ''}
              onChange={(e) => onChange({ gross_margin: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.gross_margin && (
              <p className="text-sm text-destructive mt-1">{errors.gross_margin}</p>
            )}
          </div>

          <div>
            <Label htmlFor="net_revenue_retention">Net Revenue Retention (%) *</Label>
            <Input
              id="net_revenue_retention"
              type="number"
              placeholder="110"
              value={data.net_revenue_retention || ''}
              onChange={(e) => onChange({ net_revenue_retention: parseFloat(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.net_revenue_retention && (
              <p className="text-sm text-destructive mt-1">{errors.net_revenue_retention}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              NRR &gt; 100% = expansión neta de revenue
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="profitability">Estado de rentabilidad *</Label>
          <Input
            id="profitability"
            placeholder="Ej: Break-even, +€5k/mes profit, -€10k/mes burn..."
            value={data.profitability}
            onChange={(e) => onChange({ profitability: e.target.value })}
            className="mt-2"
          />
          {errors?.profitability && (
            <p className="text-sm text-destructive mt-1">{errors.profitability}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 2: Team & Organization
export function StepTeamOrganization({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">👥 Equipo y Organización</h3>
        <p className="text-sm text-muted-foreground">
          Estructura del equipo
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tamano_equipo">Tamaño total del equipo (FTE) *</Label>
          <Input
            id="tamano_equipo"
            type="number"
            placeholder="15"
            value={data.tamano_equipo || ''}
            onChange={(e) => onChange({ tamano_equipo: parseInt(e.target.value) || 0 })}
            className="mt-2"
          />
          {errors?.tamano_equipo && (
            <p className="text-sm text-destructive mt-1">{errors.tamano_equipo}</p>
          )}
        </div>

        <div>
          <Label htmlFor="estructura_equipos">Estructura de equipos *</Label>
          <Textarea
            id="estructura_equipos"
            placeholder="Ej: Product (5), Engineering (6), Sales & Marketing (3), Operations (1)"
            value={data.estructura_equipos}
            onChange={(e) => onChange({ estructura_equipos: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.estructura_equipos && (
            <p className="text-sm text-destructive mt-1">{errors.estructura_equipos}</p>
          )}
        </div>

        <div>
          <Label htmlFor="cultura_valores">Cultura y valores del equipo *</Label>
          <Textarea
            id="cultura_valores"
            placeholder="Principios que guían al equipo, estilo de trabajo, valores..."
            value={data.cultura_valores}
            onChange={(e) => onChange({ cultura_valores: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.cultura_valores && (
            <p className="text-sm text-destructive mt-1">{errors.cultura_valores}</p>
          )}
        </div>

        <div>
          <Label htmlFor="retos_equipo">Principales retos de equipo/contratación</Label>
          <Textarea
            id="retos_equipo"
            placeholder="Dificultad para encontrar senior talent, coordinación remota, etc."
            value={data.retos_equipo || ''}
            onChange={(e) => onChange({ retos_equipo: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 3: Go-to-Market & Product
export function StepGTMProduct({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🎯 GTM y Producto</h3>
        <p className="text-sm text-muted-foreground">
          Estrategia de mercado y producto
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="segmentos_principales">Segmentos de clientes principales *</Label>
          <Textarea
            id="segmentos_principales"
            placeholder="Ej: SMBs España (60%), Enterprise LATAM (30%), Startups (10%)"
            value={data.segmentos_principales}
            onChange={(e) => onChange({ segmentos_principales: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.segmentos_principales && (
            <p className="text-sm text-destructive mt-1">{errors.segmentos_principales}</p>
          )}
        </div>

        <div>
          <Label htmlFor="canales_adquisicion">Mix de canales de adquisición *</Label>
          <Textarea
            id="canales_adquisicion"
            placeholder="Distribución de clientes por canal (SEO, Paid, Sales, Partners, etc.)"
            value={data.canales_adquisicion}
            onChange={(e) => onChange({ canales_adquisicion: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.canales_adquisicion && (
            <p className="text-sm text-destructive mt-1">{errors.canales_adquisicion}</p>
          )}
        </div>

        <div>
          <Label htmlFor="roadmap_producto">Principales ítems en roadmap de producto *</Label>
          <Textarea
            id="roadmap_producto"
            placeholder="Features o mejoras planificadas próximos 6 meses..."
            value={data.roadmap_producto}
            onChange={(e) => onChange({ roadmap_producto: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.roadmap_producto && (
            <p className="text-sm text-destructive mt-1">{errors.roadmap_producto}</p>
          )}
        </div>

        <div>
          <Label htmlFor="diferenciacion">¿Qué te diferencia de la competencia?</Label>
          <Textarea
            id="diferenciacion"
            placeholder="Moat, ventajas competitivas, posicionamiento..."
            value={data.diferenciacion || ''}
            onChange={(e) => onChange({ diferenciacion: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}

// Step 4: Strategic Objectives
export function StepStrategicObjectives({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">🚀 Objetivos Estratégicos</h3>
        <p className="text-sm text-muted-foreground">
          Visión y plan para los próximos 12-24 meses
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="objetivo_arr">Objetivo ARR (12 meses) *</Label>
            <Input
              id="objetivo_arr"
              type="number"
              placeholder="750000"
              value={data.objetivo_arr || ''}
              onChange={(e) => onChange({ objetivo_arr: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.objetivo_arr && (
              <p className="text-sm text-destructive mt-1">{errors.objetivo_arr}</p>
            )}
          </div>

          <div>
            <Label htmlFor="objetivo_equipo">Objetivo tamaño equipo *</Label>
            <Input
              id="objetivo_equipo"
              type="number"
              placeholder="25"
              value={data.objetivo_equipo || ''}
              onChange={(e) => onChange({ objetivo_equipo: parseInt(e.target.value) || 0 })}
              className="mt-2"
            />
            {errors?.objetivo_equipo && (
              <p className="text-sm text-destructive mt-1">{errors.objetivo_equipo}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="iniciativas_estrategicas">Top 3 iniciativas estratégicas *</Label>
          <Textarea
            id="iniciativas_estrategicas"
            placeholder="1. Expandir a nuevo mercado/vertical&#10;2. Lanzar nuevo producto/tier&#10;3. Optimizar unit economics..."
            value={data.iniciativas_estrategicas}
            onChange={(e) => onChange({ iniciativas_estrategicas: e.target.value })}
            className="min-h-[100px] mt-2"
          />
          {errors?.iniciativas_estrategicas && (
            <p className="text-sm text-destructive mt-1">{errors.iniciativas_estrategicas}</p>
          )}
        </div>

        <div>
          <Label htmlFor="riesgos">Principales riesgos o amenazas *</Label>
          <Textarea
            id="riesgos"
            placeholder="Competencia, dependencias, cambios regulatorios, concentración de clientes..."
            value={data.riesgos}
            onChange={(e) => onChange({ riesgos: e.target.value })}
            className="min-h-[80px] mt-2"
          />
          {errors?.riesgos && (
            <p className="text-sm text-destructive mt-1">{errors.riesgos}</p>
          )}
        </div>

        <div>
          <Label htmlFor="fundraising_status">Estado de fundraising *</Label>
          <Textarea
            id="fundraising_status"
            placeholder="Bootstrapped, última ronda (serie/monto/fecha), próxima ronda planificada..."
            value={data.fundraising_status}
            onChange={(e) => onChange({ fundraising_status: e.target.value })}
            className="min-h-[60px] mt-2"
          />
          {errors?.fundraising_status && (
            <p className="text-sm text-destructive mt-1">{errors.fundraising_status}</p>
          )}
        </div>

        <div>
          <Label htmlFor="vision_largo_plazo">Visión a largo plazo (3-5 años)</Label>
          <Textarea
            id="vision_largo_plazo"
            placeholder="¿Dónde ves la empresa en 3-5 años?"
            value={data.vision_largo_plazo || ''}
            onChange={(e) => onChange({ vision_largo_plazo: e.target.value })}
            className="min-h-[80px] mt-2"
          />
        </div>
      </div>
    </div>
  );
}
