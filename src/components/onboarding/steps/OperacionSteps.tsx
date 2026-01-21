import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieChart, DollarSign, Building, TrendingUp } from 'lucide-react';
import type { OperacionData } from '../types';

interface StepProps {
  data: OperacionData;
  onChange: (data: Partial<OperacionData>) => void;
  errors?: Record<string, string>;
}

export function StepCanvas1({ data, onChange, errors }: StepProps) {
  const updateCanvas = (field: string, value: string) => {
    onChange({
      modelo_negocio: { ...data.modelo_negocio, [field]: value }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-green-500 mb-4">
        <PieChart size={24} />
        <h3 className="text-xl font-bold">Business Model Canvas - Parte 1</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Define los elementos clave de tu modelo de negocio.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Propuesta de Valor *</Label>
          <Textarea
            value={data.modelo_negocio.propuesta_valor}
            onChange={(e) => updateCanvas('propuesta_valor', e.target.value)}
            placeholder="¿Qué valor entregas al cliente?"
            rows={3}
            className={errors?.['modelo_negocio.propuesta_valor'] ? 'border-destructive' : ''}
          />
        </div>
        
        <div>
          <Label>Segmento de Clientes *</Label>
          <Textarea
            value={data.modelo_negocio.segmento_clientes}
            onChange={(e) => updateCanvas('segmento_clientes', e.target.value)}
            placeholder="¿Quiénes son tus clientes?"
            rows={3}
          />
        </div>

        <div>
          <Label>Canales *</Label>
          <Textarea
            value={data.modelo_negocio.canales}
            onChange={(e) => updateCanvas('canales', e.target.value)}
            placeholder="¿Cómo llegas al cliente?"
            rows={3}
          />
        </div>

        <div>
          <Label>Relación con Clientes</Label>
          <Textarea
            value={data.modelo_negocio.relacion_clientes || ''}
            onChange={(e) => updateCanvas('relacion_clientes', e.target.value)}
            placeholder="¿Cómo te relacionas con ellos?"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

export function StepCanvas2({ data, onChange }: StepProps) {
  const updateCanvas = (field: string, value: string) => {
    onChange({
      modelo_negocio: { ...data.modelo_negocio, [field]: value }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-green-500 mb-4">
        <PieChart size={24} />
        <h3 className="text-xl font-bold">Business Model Canvas - Parte 2</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Fuentes de Ingresos *</Label>
          <Textarea
            value={data.modelo_negocio.fuentes_ingresos}
            onChange={(e) => updateCanvas('fuentes_ingresos', e.target.value)}
            placeholder="¿Cómo generas ingresos?"
            rows={3}
          />
        </div>

        <div>
          <Label>Recursos Clave</Label>
          <Textarea
            value={data.modelo_negocio.recursos_clave || ''}
            onChange={(e) => updateCanvas('recursos_clave', e.target.value)}
            placeholder="¿Qué necesitas para operar?"
            rows={3}
          />
        </div>

        <div>
          <Label>Actividades Clave</Label>
          <Textarea
            value={data.modelo_negocio.actividades_clave || ''}
            onChange={(e) => updateCanvas('actividades_clave', e.target.value)}
            placeholder="¿Qué haces para entregar valor?"
            rows={3}
          />
        </div>

        <div>
          <Label>Socios Clave</Label>
          <Textarea
            value={data.modelo_negocio.socios_clave || ''}
            onChange={(e) => updateCanvas('socios_clave', e.target.value)}
            placeholder="¿Con quién colaboras?"
            rows={3}
          />
        </div>
        
        <div className="md:col-span-2">
          <Label>Estructura de Costes</Label>
          <Textarea
            value={data.modelo_negocio.estructura_costes || ''}
            onChange={(e) => updateCanvas('estructura_costes', e.target.value)}
            placeholder="¿Cuáles son tus principales costes?"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

export function StepFinanzas({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-amber-500 mb-4">
        <DollarSign size={24} />
        <h3 className="text-xl font-bold">Situación Financiera</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        ¿Cuál es la situación financiera actual del proyecto?
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Facturación Actual (€)</Label>
          <Input
            type="number"
            value={data.facturacion_actual || ''}
            onChange={(e) => onChange({ facturacion_actual: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">Total facturado hasta la fecha</p>
        </div>

        <div>
          <Label>Pipeline de Valor (€)</Label>
          <Input
            type="number"
            value={data.pipeline_valor || ''}
            onChange={(e) => onChange({ pipeline_valor: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground mt-1">Valor potencial de leads activos</p>
        </div>
      </div>
    </div>
  );
}

export function StepClientes({ data, onChange }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-primary mb-4">
        <Building size={24} />
        <h3 className="text-xl font-bold">Clientes Actuales</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Lista tus clientes actuales y su estado.
      </p>
      <Textarea
        value={data.clientes_actuales || ''}
        onChange={(e) => onChange({ clientes_actuales: e.target.value })}
        placeholder="Cliente 1: Descripción, valor, estado...
Cliente 2: Descripción, valor, estado..."
        rows={6}
      />
      
      <div className="mt-4">
        <Label>Equipo y Roles (opcional)</Label>
        <Textarea
          value={data.equipo_roles || ''}
          onChange={(e) => onChange({ equipo_roles: e.target.value })}
          placeholder="Responsabilidades específicas de cada miembro..."
          rows={4}
        />
      </div>
    </div>
  );
}

export function StepObjetivos({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-green-500 mb-4">
        <TrendingUp size={24} />
        <h3 className="text-xl font-bold">Objetivos del Trimestre</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        ¿Cuáles son los objetivos del proyecto para este trimestre?
      </p>
      <Textarea
        value={data.objetivos_q1}
        onChange={(e) => onChange({ objetivos_q1: e.target.value })}
        placeholder="Objetivo 1: Descripción + métrica de éxito
Objetivo 2: Descripción + métrica de éxito
Objetivo 3: Descripción + métrica de éxito"
        rows={6}
        className={errors?.objetivos_q1 ? 'border-destructive' : ''}
      />
      {errors?.objetivos_q1 && <p className="text-destructive text-sm">{errors.objetivos_q1}</p>}
    </div>
  );
}
