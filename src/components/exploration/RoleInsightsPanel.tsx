/**
 * ROLE INSIGHTS PANEL
 *
 * Panel mejorado de insights conectados con exploraciones de roles
 * Muestra insights públicos de todos, filtrados por rol
 */

import { Lightbulb, Trophy, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoleInsight {
  id: string;
  user_id: string;
  titulo: string;
  contenido: string;
  tipo: 'aprendizaje' | 'reflexion' | 'error' | 'exito' | 'idea';
  tags: string[];
  created_at: string;
  role: string;
  fit_score: number | null;
  user_name: string;
}

interface RoleInsightsPanelProps {
  role: string;
  insights: RoleInsight[];
  currentUserId?: string;
}

const TIPO_CONFIG = {
  aprendizaje: { icon: '📚', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300', label: 'Aprendizaje' },
  reflexion: { icon: '💭', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', label: 'Reflexión' },
  error: { icon: '⚠️', color: 'bg-red-500/10 text-red-700 dark:text-red-300', label: 'Error' },
  exito: { icon: '🎉', color: 'bg-green-500/10 text-green-700 dark:text-green-300', label: 'Éxito' },
  idea: { icon: '💡', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300', label: 'Idea' },
};

export function RoleInsightsPanel({ role, insights, currentUserId }: RoleInsightsPanelProps) {
  const myInsights = insights.filter((i) => i.user_id === currentUserId);
  const othersInsights = insights.filter((i) => i.user_id !== currentUserId);

  // Top insights (mayor fit score)
  const topInsights = [...insights]
    .filter((i) => i.fit_score !== null)
    .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0))
    .slice(0, 5);

  // Insights recientes
  const recentInsights = [...insights]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lightbulb className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Insights de {role}</h2>
            <p className="text-muted-foreground">
              {insights.length} insight{insights.length !== 1 ? 's' : ''} compartido{insights.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Users size={16} className="mr-2" />
          {new Set(insights.map((i) => i.user_id)).size} personas
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">
            <TrendingUp size={14} className="mr-2" />
            Recientes
          </TabsTrigger>
          <TabsTrigger value="top">
            <Trophy size={14} className="mr-2" />
            Top Performance
          </TabsTrigger>
          {myInsights.length > 0 && (
            <TabsTrigger value="mine">
              Mis Insights ({myInsights.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Recientes */}
        <TabsContent value="recent" className="space-y-3">
          {recentInsights.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Lightbulb size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay insights compartidos para este rol aún
                </p>
              </CardContent>
            </Card>
          ) : (
            recentInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} isOwn={insight.user_id === currentUserId} />
            ))
          )}
        </TabsContent>

        {/* Top Performance */}
        <TabsContent value="top" className="space-y-3">
          {topInsights.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Trophy size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay insights con fit scores disponibles aún
                </p>
              </CardContent>
            </Card>
          ) : (
            topInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} isOwn={insight.user_id === currentUserId} showFitScore />
            ))
          )}
        </TabsContent>

        {/* Mis Insights */}
        {myInsights.length > 0 && (
          <TabsContent value="mine" className="space-y-3">
            {myInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} isOwn />
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface InsightCardProps {
  insight: RoleInsight;
  isOwn?: boolean;
  showFitScore?: boolean;
}

function InsightCard({ insight, isOwn, showFitScore }: InsightCardProps) {
  const config = TIPO_CONFIG[insight.tipo];

  return (
    <Card className={isOwn ? 'border-primary/50' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">
                {insight.user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{insight.user_name}</p>
                {isOwn && (
                  <Badge variant="secondary" className="text-xs">
                    Tú
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(insight.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </div>

          {showFitScore && insight.fit_score && (
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-primary">{insight.fit_score.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Fit Score</div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Título */}
        <h4 className="font-semibold">{insight.titulo}</h4>

        {/* Contenido */}
        <p className="text-sm text-muted-foreground">{insight.contenido}</p>

        {/* Tags y Tipo */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={config.color}>
            {config.icon} {config.label}
          </Badge>

          {insight.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Aprendizaje destacado */}
        {insight.tipo === 'aprendizaje' && (
          <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
            <strong className="text-blue-700 dark:text-blue-300">💡 Aprendizaje clave:</strong> Este insight puede ayudarte a mejorar en {insight.role}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
