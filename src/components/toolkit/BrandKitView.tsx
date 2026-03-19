/**
 * BrandKitView — F21.7a
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface BrandKitOutput {
  propuesta_valor: string;
  mensajes_clave: string[];
  tono: string;
  palabras_usar: string[];
  palabras_evitar: string[];
  headline_web: string;
  tagline: string;
}

export function BrandKitView({ output }: { output: BrandKitOutput }) {
  return (
    <div className="space-y-4">
      {/* Propuesta de valor */}
      <Card className="border-pink-200 bg-pink-50/50 dark:bg-pink-950/20">
        <CardHeader className="pb-1">
          <CardTitle className="text-xs text-pink-600 uppercase tracking-wide">Propuesta de valor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{output.propuesta_valor}</p>
        </CardContent>
      </Card>

      {/* Headline + tagline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wide">Headline web</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{output.headline_web}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-gray-500 uppercase tracking-wide">Tagline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base font-semibold italic text-pink-700 dark:text-pink-400">{output.tagline}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tono + mensajes clave */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Mensajes clave</CardTitle>
            <Badge variant="outline" className="text-xs capitalize">{output.tono}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {(output.mensajes_clave ?? []).map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="shrink-0 font-bold text-pink-500">{i + 1}.</span>
                {m}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Vocabulario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-green-700 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Usar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {(output.palabras_usar ?? []).map((w, i) => (
                <Badge key={i} className="bg-green-100 text-green-700 border-green-200 text-xs">{w}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-red-700 uppercase tracking-wide flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" /> Evitar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {(output.palabras_evitar ?? []).map((w, i) => (
                <Badge key={i} className="bg-red-100 text-red-700 border-red-200 text-xs">{w}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
