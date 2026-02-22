/**
 * TOP PERFORMERS WIDGET
 *
 * Muestra los Top 3 en diferentes categorías
 * Con avatares, badges y animaciones
 */

import { Trophy, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Performer {
  id: string;
  nombre: string;
  avatar?: string;
  color: string;
  value: number;
  previousRank?: number;
}

interface TopPerformersProps {
  obvs: Performer[];
  facturacion: Performer[];
  leads: Performer[];
  tareas: Performer[];
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 0:
      return '🥇';
    case 1:
      return '🥈';
    case 2:
      return '🥉';
    default:
      return null;
  }
}

function getRankColor(rank: number) {
  switch (rank) {
    case 0:
      return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    case 1:
      return 'from-gray-400/20 to-gray-500/10 border-gray-400/30';
    case 2:
      return 'from-orange-600/20 to-orange-700/10 border-orange-600/30';
    default:
      return 'from-muted/50 to-muted/20 border-border';
  }
}

function PerformerCard({
  performer,
  rank,
  format,
}: {
  performer: Performer;
  rank: number;
  format?: 'currency' | 'number';
}) {
  const initials = performer.nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedValue =
    format === 'currency'
      ? `€${performer.value.toLocaleString('es-ES')}`
      : performer.value.toLocaleString('es-ES');

  const rankChange =
    performer.previousRank !== undefined ? performer.previousRank - rank : null;

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl border bg-gradient-to-br animate-fade-in hover-lift transition-all',
        getRankColor(rank)
      )}
      style={{ animationDelay: `${rank * 100}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Rank Badge */}
        <div className="flex flex-col items-center">
          <span className="text-2xl mb-1">{getRankIcon(rank)}</span>
          <span className="text-xs font-semibold text-muted-foreground">#{rank + 1}</span>
        </div>

        {/* Avatar */}
        <Avatar
          className="h-12 w-12 border-2"
          style={{ borderColor: performer.color }}
        >
          <AvatarFallback style={{ backgroundColor: `${performer.color}20`, color: performer.color }}>
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold truncate">{performer.nombre}</p>
            {rankChange !== null && rankChange !== 0 && (
              <Badge
                variant="outline"
                className={cn(
                  'h-5 px-1.5 text-[10px]',
                  rankChange > 0 && 'bg-green-500/10 text-green-600 border-green-500/30',
                  rankChange < 0 && 'bg-red-500/10 text-red-600 border-red-500/30'
                )}
              >
                {rankChange > 0 ? '↑' : '↓'} {Math.abs(rankChange)}
              </Badge>
            )}
          </div>
          <p className="text-lg font-bold text-primary">{formattedValue}</p>
        </div>
      </div>
    </div>
  );
}

export function TopPerformers({ obvs, facturacion, leads, tareas }: TopPerformersProps) {
  return (
    <Card className="elevation-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <CardTitle>Top Performers</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Los 3 mejores del equipo
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="obvs" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="obvs" className="text-xs">
              OBVs
            </TabsTrigger>
            <TabsTrigger value="facturacion" className="text-xs">
              Facturación
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs">
              Leads
            </TabsTrigger>
            <TabsTrigger value="tareas" className="text-xs">
              Tareas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="obvs" className="space-y-3 mt-0">
            {obvs.slice(0, 3).map((performer, idx) => (
              <PerformerCard key={performer.id} performer={performer} rank={idx} />
            ))}
          </TabsContent>

          <TabsContent value="facturacion" className="space-y-3 mt-0">
            {facturacion.slice(0, 3).map((performer, idx) => (
              <PerformerCard
                key={performer.id}
                performer={performer}
                rank={idx}
                format="currency"
              />
            ))}
          </TabsContent>

          <TabsContent value="leads" className="space-y-3 mt-0">
            {leads.slice(0, 3).map((performer, idx) => (
              <PerformerCard key={performer.id} performer={performer} rank={idx} />
            ))}
          </TabsContent>

          <TabsContent value="tareas" className="space-y-3 mt-0">
            {tareas.slice(0, 3).map((performer, idx) => (
              <PerformerCard key={performer.id} performer={performer} rank={idx} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
