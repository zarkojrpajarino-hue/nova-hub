import { useState } from 'react';
import { Lightbulb, BookOpen, AlertTriangle, Trophy, Sparkles, Plus, Trash2, Edit2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInsights, useDeleteInsight, type UserInsight } from '@/hooks/useDevelopment';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';
import { InsightForm } from './InsightForm';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_INSIGHTS } from '@/data/demoData';

import { useTranslation } from 'react-i18next';
const TIPO_CONFIG: Record<UserInsight['tipo'], { icon: React.ElementType; color: string; labelKey: string }> = {
  aprendizaje: { icon: BookOpen, color: '#3B82F6', labelKey: 'development.aprendizaje' },
  reflexion: { icon: Lightbulb, color: '#F59E0B', labelKey: 'development.reflexión' },
  error: { icon: AlertTriangle, color: '#EF4444', labelKey: 'development.error' },
  exito: { icon: Trophy, color: '#22C55E', labelKey: 'development.éxito' },
  idea: { icon: Sparkles, color: '#8B5CF6', labelKey: 'development.idea' },
};

interface InsightsListProps {
  projectId?: string;
  roleContext?: string;
}

export function InsightsList({ projectId, roleContext }: InsightsListProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { isDemoMode } = useDemoMode();
  const { data: realInsights = [], isLoading } = useInsights(profile?.id);
  const deleteInsight = useDeleteInsight();
  const [showForm, setShowForm] = useState(false);
  const [editingInsight, setEditingInsight] = useState<UserInsight | null>(null);
  const [filterTipo, setFilterTipo] = useState<UserInsight['tipo'] | 'all'>('all');

  // Use demo data if in demo mode
  const insights: UserInsight[] = isDemoMode 
    ? DEMO_INSIGHTS.map(di => ({
        ...di,
        project_id: di.project_id || null,
        role_context: di.role_context || null,
      })) as UserInsight[]
    : realInsights;

  const filteredInsights = insights.filter(insight => {
    if (filterTipo !== 'all' && insight.tipo !== filterTipo) return false;
    if (projectId && insight.project_id !== projectId) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (isDemoMode) return; // No delete in demo mode
    if (confirm(t('development.eliminarEsteInsight'))) {
      await deleteInsight.mutateAsync(id);
    }
  };

  if (isLoading && !isDemoMode) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-pulse text-muted-foreground">{t('development.cargandoInsights')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-amber-500" size={20} />
          <h3 className="font-semibold">{t('development.misInsights')}</h3>
          <Badge variant="secondary">{filteredInsights.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" />{t('development.nuevoInsight')}</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterTipo === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterTipo('all')}
        >{t('development.todos')}</Button>
        {Object.entries(TIPO_CONFIG).map(([tipo, config]) => (
          <Button
            key={tipo}
            variant={filterTipo === tipo ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterTipo(tipo as UserInsight['tipo'])}
            className="gap-1"
          >
            <config.icon size={14} style={{ color: filterTipo === tipo ? undefined : config.color }} />
            {t(config.labelKey)}
          </Button>
        ))}
      </div>

      {/* Insights List */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-10 bg-muted/30 rounded-xl">
          <Lightbulb size={40} className="mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{t('development.noHayInsightsRegistrados')}</p>
          <p className="text-sm text-muted-foreground/70">{t('development.registraTusAprendizajesReflexiones')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInsights.map(insight => {
            const config = TIPO_CONFIG[insight.tipo];
            const Icon = config.icon;
            
            return (
              <div
                key={insight.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${config.color}20` }}
                  >
                    <Icon size={18} style={{ color: config.color }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{insight.titulo}</h4>
                      {insight.is_private ? (
                        <Lock size={12} className="text-muted-foreground" />
                      ) : (
                        <Unlock size={12} className="text-muted-foreground" />
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {insight.contenido}
                    </p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        style={{ borderColor: config.color, color: config.color }}
                      >
                        {t(config.labelKey)}
                      </Badge>
                      
                      {insight.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(insight.created_at), { 
                          addSuffix: true, 
                          locale: getDateFnsLocale() 
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingInsight(insight)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(insight.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Forms */}
      <InsightForm
        open={showForm}
        onOpenChange={setShowForm}
        defaultProjectId={projectId}
        defaultRoleContext={roleContext}
      />
      
      {editingInsight && (
        <InsightForm
          open={!!editingInsight}
          onOpenChange={(open) => !open && setEditingInsight(null)}
          insight={editingInsight}
        />
      )}
    </div>
  );
}
