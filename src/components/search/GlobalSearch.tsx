import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useProjects, useProfiles } from '@/hooks/useNovaDataOptimized';
import { PHASE_LABELS } from '@/lib/engine';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResultType = 'project' | 'member' | 'view';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

function getViews(t: (k: string) => string) {
  return [
  { id: 'dashboard', label: t('search.dashboard'), icon: '' },
  { id: 'mi-espacio', label: t('search.miEspacio'), icon: '' },
  { id: 'proyectos', label: t('search.proyectos'), icon: '' },
  { id: 'obvs', label: t('search.centroObvs'), icon: '' },
  { id: 'crm', label: t('search.crmGlobal'), icon: '' },
  { id: 'financiero', label: t('search.financiero'), icon: '' },
  { id: 'kpis', label: t('search.otrosKpis'), icon: '' },
  { id: 'analytics', label: t('search.analytics'), icon: '' },
  { id: 'settings', label: t('search.configuración'), icon: '' },
];
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: projects = [] } = useProjects();
  const { data: profiles = [] } = useProfiles();
  const { navigate } = useNavigation();

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Build search results
  const results: SearchResult[] = [];

  if (query.length > 0) {
    const q = query.toLowerCase();

    // Search getViews(t)
    getViews(t).forEach(view => {
      if (view.label.toLowerCase().includes(q)) {
        results.push({
          id: `view-${view.id}`,
          type: 'view',
          title: view.label,
          icon: <span className="text-lg">{view.icon}</span>,
          action: () => {
            navigate(view.id);
            onOpenChange(false);
          },
        });
      }
    });

    // Search projects
    projects.forEach(project => {
      if (project.nombre.toLowerCase().includes(q)) {
        results.push({
          id: `project-${project.id}`,
          type: 'project',
          title: project.nombre,
          subtitle: `Fase ${project.phase_state?.current_phase ?? 1} — ${PHASE_LABELS[project.phase_state?.current_phase ?? 1]}`,
          icon: <span className="text-lg">{project.icon}</span>,
          action: () => {
            navigate('proyectos');
            onOpenChange(false);
          },
        });
      }
    });

    // Search members
    profiles.forEach(profile => {
      if (profile.nombre.toLowerCase().includes(q) || profile.email.toLowerCase().includes(q)) {
        results.push({
          id: `member-${profile.id}`,
          type: 'member',
          title: profile.nombre,
          subtitle: profile.email,
          icon: (
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-semibold"
              style={{ background: profile.color || '#6366F1' }}
            >
              {profile.nombre.charAt(0)}
            </div>
          ),
          action: () => {
            onOpenChange(false);
          },
        });
      }
    });
  } else {
    // Show recent/suggested
    getViews(t).slice(0, 5).forEach(view => {
      results.push({
        id: `view-${view.id}`,
        type: 'view',
        title: view.label,
        icon: <span className="text-lg">{view.icon}</span>,
        action: () => {
          navigate(view.id);
          onOpenChange(false);
        },
      });
    });
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === t('search.arrowdown')) {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === t('search.arrowup')) {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === t('search.enter') && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].action();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search size={18} className="text-muted-foreground" />
          <Input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('search.buscarProyectosVistasMiembros')}
            className="border-0 focus-visible:ring-0 h-12 text-base"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">{t('search.noSeEncontraronResultados')}</div>
          ) : (
            <div className="space-y-1">
              {results.map((result, i) => (
                <button
                  key={result.id}
                  onClick={result.action}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    i === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {result.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {result.type === 'view' && t('search.vista')}
                    {result.type === 'project' && t('search.proyecto')}
                    {result.type === 'member' && t('search.miembro')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
          <span><kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd> navegar</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">↵</kbd> seleccionar</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded">esc</kbd> cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
