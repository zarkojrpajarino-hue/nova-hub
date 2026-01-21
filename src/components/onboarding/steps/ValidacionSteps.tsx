import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, AlertTriangle, Target, Lightbulb, ClipboardList, BarChart3, Users } from 'lucide-react';
import type { ValidacionData } from '../types';

interface StepProps {
  data: ValidacionData;
  onChange: (data: Partial<ValidacionData>) => void;
  errors?: Record<string, string>;
}

export function StepProblema({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-amber-500 mb-4">
        <AlertTriangle size={24} />
        <h3 className="text-xl font-bold">Problema Identificado</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        ¿Cuál es el problema o necesidad que has detectado? ¿Quién lo sufre? ¿Qué evidencias tienes?
      </p>
      <Textarea
        value={data.problema}
        onChange={(e) => onChange({ problema: e.target.value })}
        placeholder="Describe el problema de forma clara y específica..."
        rows={6}
        className={errors?.problema ? 'border-destructive' : ''}
      />
      {errors?.problema && <p className="text-destructive text-sm">{errors.problema}</p>}
      <p className="text-xs text-muted-foreground">
        💡 Tip: Un buen problema es específico, medible y tiene un mercado potencial identificable.
      </p>
    </div>
  );
}

export function StepCliente({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-primary mb-4">
        <Target size={24} />
        <h3 className="text-xl font-bold">Cliente Objetivo</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        ¿Quién es tu cliente ideal? Define tu segmento de mercado.
      </p>
      <Textarea
        value={data.cliente_objetivo}
        onChange={(e) => onChange({ cliente_objetivo: e.target.value })}
        placeholder="Demografía, comportamiento, necesidades, poder adquisitivo, dónde encontrarlos..."
        rows={6}
        className={errors?.cliente_objetivo ? 'border-destructive' : ''}
      />
      {errors?.cliente_objetivo && <p className="text-destructive text-sm">{errors.cliente_objetivo}</p>}
    </div>
  );
}

export function StepSolucion({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-green-500 mb-4">
        <Lightbulb size={24} />
        <h3 className="text-xl font-bold">Solución Propuesta</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        ¿Cuál es tu propuesta de valor? ¿Cómo resuelve el problema?
      </p>
      <Textarea
        value={data.solucion_propuesta}
        onChange={(e) => onChange({ solucion_propuesta: e.target.value })}
        placeholder="Qué ofreces, cómo funciona, qué lo hace diferente de las alternativas..."
        rows={6}
        className={errors?.solucion_propuesta ? 'border-destructive' : ''}
      />
      {errors?.solucion_propuesta && <p className="text-destructive text-sm">{errors.solucion_propuesta}</p>}
    </div>
  );
}

export function StepHipotesis({ data, onChange, errors }: StepProps) {
  const addHipotesis = () => {
    onChange({ hipotesis: [...data.hipotesis, ''] });
  };

  const removeHipotesis = (index: number) => {
    onChange({ hipotesis: data.hipotesis.filter((_, i) => i !== index) });
  };

  const updateHipotesis = (index: number, value: string) => {
    onChange({ hipotesis: data.hipotesis.map((h, i) => i === index ? value : h) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-blue-500 mb-4">
        <ClipboardList size={24} />
        <h3 className="text-xl font-bold">Hipótesis a Validar</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        Lista las hipótesis clave que necesitas validar antes de escalar.
      </p>
      
      <div className="space-y-3">
        {data.hipotesis.map((hip, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={hip}
              onChange={(e) => updateHipotesis(index, e.target.value)}
              placeholder={`Hipótesis ${index + 1}: "Los clientes pagarán X por Y porque Z"`}
              className="flex-1"
            />
            {data.hipotesis.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeHipotesis(index)}
                className="text-destructive hover:text-destructive"
              >
                <X size={18} />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      <Button type="button" variant="outline" size="sm" onClick={addHipotesis}>
        <Plus size={16} className="mr-1" /> Añadir hipótesis
      </Button>
      
      {errors?.hipotesis && <p className="text-destructive text-sm">{errors.hipotesis}</p>}
    </div>
  );
}

export function StepMetricas({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-green-500 mb-4">
        <BarChart3 size={24} />
        <h3 className="text-xl font-bold">Métricas de Éxito</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        ¿Cómo sabrás que has validado el problema y la solución?
      </p>
      <Textarea
        value={data.metricas_exito}
        onChange={(e) => onChange({ metricas_exito: e.target.value })}
        placeholder="Ej: '10 clientes pagando en 30 días', '50% conversión en landing', '20 entrevistas positivas'..."
        rows={5}
        className={errors?.metricas_exito ? 'border-destructive' : ''}
      />
      {errors?.metricas_exito && <p className="text-destructive text-sm">{errors.metricas_exito}</p>}
    </div>
  );
}

export function StepRecursos({ data, onChange, errors }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-primary mb-4">
        <Users size={24} />
        <h3 className="text-xl font-bold">Recursos y Limitaciones</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label>Recursos disponibles</Label>
          <Textarea
            value={data.recursos_disponibles}
            onChange={(e) => onChange({ recursos_disponibles: e.target.value })}
            placeholder="Tiempo, presupuesto, herramientas, contactos, conocimientos..."
            rows={4}
            className={errors?.recursos_disponibles ? 'border-destructive' : ''}
          />
          {errors?.recursos_disponibles && <p className="text-destructive text-sm">{errors.recursos_disponibles}</p>}
        </div>
        
        <div>
          <Label>Limitaciones conocidas (opcional)</Label>
          <Textarea
            value={data.limitaciones || ''}
            onChange={(e) => onChange({ limitaciones: e.target.value })}
            placeholder="Tiempo limitado, falta de experiencia, competencia fuerte, barreras..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
}
