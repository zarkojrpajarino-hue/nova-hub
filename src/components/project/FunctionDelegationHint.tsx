/**
 * FUNCTION DELEGATION HINT — EC13.6
 *
 * Alerta informativa visible cuando un solo founder alcanza Fase 4 sin delegación
 * estructural (< 2 funciones críticas asignadas a operadores distintos al founder).
 *
 * Contexto: En Fase 4, O4.3 (Independencia del founder) tiene un techo de 70 sin
 * automatización estructural, lo que limita el phase4_score máximo a 92.5%.
 * La fase sigue siendo alcanzable (umbral healthy = 80%), pero el founder puede
 * no entender por qué su puntuación no sube más allá de ese techo.
 *
 * NO es un bloqueo — es una señal de techo, no de fallo.
 */

import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FunctionDelegationHintProps {
  onNavigateToTeam?: () => void;
}

export function FunctionDelegationHint({ onNavigateToTeam }: FunctionDelegationHintProps) {
  return (
    <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Users size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Techo de fase detectado
        </p>
      </div>
      <p className="text-sm leading-relaxed">
        Sin delegación estructural, la puntuación máxima en Fase 4 es 92.5%.
        Para superarla, asigna operadores a las 3 funciones críticas o implementa
        sistemas de automatización con cobertura fuerte en ≥2 de ellas.
      </p>
      {onNavigateToTeam && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={onNavigateToTeam}
        >
          Ver equipo
        </Button>
      )}
    </div>
  );
}
