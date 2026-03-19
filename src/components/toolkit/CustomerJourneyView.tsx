/**
 * CustomerJourneyView — F21.8
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/shared/SourceBadge';

interface Etapa {
  orden: number;
  nombre: string;
  punto_contacto: string;
  emocion_cliente: string;
  friccion_principal: string;
  accion_equipo: string;
  datos_origen: 'observed' | 'declared' | 'estimated';
}

interface CustomerJourneyOutput {
  etapas: Etapa[];
  nota_datos?: string | null;
}

const ETAPA_COLORS = [
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-teal-100 border-teal-300 text-teal-800',
  'bg-pink-100 border-pink-300 text-pink-800',
];

export function CustomerJourneyView({ output }: { output: CustomerJourneyOutput }) {
  const etapas = output.etapas ?? [];

  return (
    <div className="space-y-4">
      {/* Nota de datos */}
      {output.nota_datos && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400">{output.nota_datos}</p>
        </div>
      )}

      {/* Timeline horizontal (desktop) / vertical (mobile) */}
      {/* Mobile: cards en columna */}
      <div className="space-y-3">
        {etapas.map((etapa, i) => {
          const colorClass = ETAPA_COLORS[i % ETAPA_COLORS.length];
          return (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}>
                    {etapa.orden}
                  </span>
                  <CardTitle className="text-sm">{etapa.nombre}</CardTitle>
                  <SourceBadge
                    type={etapa.datos_origen}
                    size="sm"
                    className="ml-auto shrink-0"
                  />
                </div>
                <p className="text-xs text-gray-500 pl-9">{etapa.punto_contacto}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Emoción</p>
                    <p className="text-gray-700 dark:text-gray-300">{etapa.emocion_cliente}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-red-500 uppercase tracking-wide text-[10px]">Fricción</p>
                    <p className="text-gray-700 dark:text-gray-300">{etapa.friccion_principal}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-green-600 uppercase tracking-wide text-[10px]">Acción del equipo</p>
                    <p className="text-gray-700 dark:text-gray-300">{etapa.accion_equipo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leyenda de fuentes */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">observed = Stripe</Badge>
        <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">declared = CRM nativo</Badge>
        <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-200">estimated = inferido por IA</Badge>
      </div>
    </div>
  );
}
