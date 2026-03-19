/**
 * SalesPlaybookView — F21.6
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Paso {
  numero: number;
  nombre: string;
  descripcion: string;
  duracion_dias: number;
  accion_clave: string;
}

interface Objecion {
  objecion: string;
  respuesta: string;
}

interface SalesPlaybookOutput {
  pasos: Paso[];
  objeciones: Objecion[];
  momento_cierre: string;
  senales_compra: string[];
}

export function SalesPlaybookView({ output }: { output: SalesPlaybookOutput }) {
  const [expandedPaso, setExpandedPaso] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = output.pasos
      .map(p => `${p.numero}. ${p.nombre} (~${p.duracion_dias}d)\n   ${p.descripcion}\n   → ${p.accion_clave}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Proceso de venta */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Proceso de venta</CardTitle>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {(output.pasos ?? []).map((paso, i) => (
            <div key={i} className="rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setExpandedPaso(expandedPaso === i ? null : i)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
              >
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {paso.numero}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{paso.nombre}</span>
                <span className="text-xs text-gray-400">{paso.duracion_dias}d</span>
                {expandedPaso === i
                  ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                }
              </button>
              {expandedPaso === i && (
                <div className={cn('px-3 pb-3 space-y-2 border-t border-gray-100 pt-2')}>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{paso.descripcion}</p>
                  <div className="rounded-md bg-green-50 dark:bg-green-950/30 px-2.5 py-1.5">
                    <p className="text-xs text-green-700 dark:text-green-400">
                      <span className="font-medium">Acción clave: </span>{paso.accion_clave}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Objeciones */}
      {output.objeciones?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Objeciones y respuestas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {output.objeciones.map((obj, i) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">"{obj.objecion}"</p>
                <p className="text-xs text-gray-700 dark:text-gray-300">→ {obj.respuesta}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cierre */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-700 dark:text-blue-400">Momento de cierre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">{output.momento_cierre}</p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(output.senales_compra ?? []).map((s, i) => (
              <span key={i} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded px-2 py-0.5">
                {s}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
