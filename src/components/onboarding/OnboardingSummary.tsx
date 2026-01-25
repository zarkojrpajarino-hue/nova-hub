import { Check, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type OnboardingData, type ValidacionData, type OperacionData } from './types';

interface OnboardingSummaryProps {
  data: OnboardingData;
  projectColor: string;
  onEdit?: () => void;
}

export function OnboardingSummary({ data, projectColor, onEdit }: OnboardingSummaryProps) {
  const isValidacion = data.tipo === 'validacion';

  const renderValidacionSummary = (d: ValidacionData) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SummaryCard title="Problema" icon="⚠️" content={d.problema} />
      <SummaryCard title="Cliente Objetivo" icon="🎯" content={d.cliente_objetivo} />
      <SummaryCard title="Solución Propuesta" icon="💡" content={d.solucion_propuesta} />
      <SummaryCard 
        title="Hipótesis a Validar" 
        icon="🧪" 
        content={
          <ul className="list-disc list-inside space-y-1">
            {d.hipotesis.filter(h => h.trim()).map((h, i) => (
              <li key={i} className="text-sm">{h}</li>
            ))}
          </ul>
        } 
      />
      <SummaryCard title="Métricas de Éxito" icon="📊" content={d.metricas_exito} />
      <SummaryCard title="Recursos Disponibles" icon="👥" content={d.recursos_disponibles} />
      {d.limitaciones && (
        <SummaryCard title="Limitaciones" icon="⚠️" content={d.limitaciones} className="md:col-span-2" />
      )}
    </div>
  );

  const renderOperacionSummary = (d: OperacionData) => (
    <div className="space-y-6">
      {/* Business Model Canvas */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">📋 Business Model Canvas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SummaryMini title="Propuesta de Valor" content={d.modelo_negocio.propuesta_valor} />
          <SummaryMini title="Segmento de Clientes" content={d.modelo_negocio.segmento_clientes} />
          <SummaryMini title="Canales" content={d.modelo_negocio.canales} />
          <SummaryMini title="Fuentes de Ingresos" content={d.modelo_negocio.fuentes_ingresos} />
          <SummaryMini title="Recursos Clave" content={d.modelo_negocio.recursos_clave} />
          <SummaryMini title="Actividades Clave" content={d.modelo_negocio.actividades_clave} />
        </div>
      </div>

      {/* Financial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard 
          title="Situación Financiera" 
          icon="💰" 
          content={
            <div className="space-y-2">
              <p><strong>Facturación:</strong> €{d.facturacion_actual.toLocaleString()}</p>
              <p><strong>Pipeline:</strong> €{d.pipeline_valor.toLocaleString()}</p>
            </div>
          } 
        />
        <SummaryCard title="Objetivos Q1" icon="🚀" content={d.objetivos_q1} />
      </div>

      {d.clientes_actuales && (
        <SummaryCard title="Clientes Actuales" icon="🏢" content={d.clientes_actuales} />
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${projectColor}20` }}
          >
            <Check className="text-green-500" size={24} />
          </div>
          <div>
            <CardTitle>Onboarding Completado</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isValidacion ? '🧪 Modo Validación' : '🚀 Modo Operación'}
            </p>
          </div>
        </div>
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit size={14} className="mr-2" />
            Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isValidacion 
          ? renderValidacionSummary(data as ValidacionData)
          : renderOperacionSummary(data as OperacionData)
        }
      </CardContent>
    </Card>
  );
}

function SummaryCard({ 
  title, 
  icon, 
  content, 
  className = '' 
}: { 
  title: string; 
  icon: string; 
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 bg-muted/50 rounded-xl ${className}`}>
      <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <span>{icon}</span> {title}
      </p>
      <div className="text-sm whitespace-pre-line">{content || '-'}</div>
    </div>
  );
}

function SummaryMini({ title, content }: { title: string; content?: string }) {
  if (!content) return null;
  return (
    <div className="p-3 bg-muted/30 rounded-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{title}</p>
      <p className="text-sm line-clamp-3">{content}</p>
    </div>
  );
}
