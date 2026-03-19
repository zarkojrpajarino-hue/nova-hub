/**
 * BuyerPersonaView — F21.4
 */

import { Users, Quote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BuyerPersonaOutput {
  persona: {
    nombre: string;
    edad_media: string;
    cargo: string;
    sector: string;
    pain_points: string[];
    motivaciones: string[];
    canal_preferido: string;
    objeciones: string[];
    quote: string;
  };
}

export function BuyerPersonaView({ output }: { output: BuyerPersonaOutput }) {
  const p = output.persona;
  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="border-violet-200 bg-violet-50/50 dark:bg-violet-950/20 dark:border-violet-800">
        <CardContent className="pt-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-200 dark:bg-violet-800 flex items-center justify-center">
              <Users className="h-7 w-7 text-violet-700 dark:text-violet-300" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{p.nombre}</p>
              <p className="text-sm text-violet-700 dark:text-violet-300">{p.cargo} · {p.sector}</p>
              <p className="text-xs text-gray-500">{p.edad_media} · Canal: {p.canal_preferido}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pain points */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 dark:text-red-400">Pain Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.pain_points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="shrink-0 text-red-500 font-bold">{i + 1}.</span>
                  {pt}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Motivaciones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-400">Motivaciones de compra</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {p.motivaciones.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <span className="shrink-0 text-green-500 font-bold">{i + 1}.</span>
                  {m}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Objeciones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-700 dark:text-amber-400">Objeciones típicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {p.objeciones.map((obj, i) => (
              <Badge key={i} variant="outline" className="text-xs border-amber-300 text-amber-700">
                {obj}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quote */}
      <Card className="border-gray-200">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Quote className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-sm italic text-gray-700 dark:text-gray-300">{p.quote}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
