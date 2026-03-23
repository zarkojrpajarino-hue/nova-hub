/**
 * EmptyStateDashboard — O5.V2.2
 *
 * Empty state for Day 1 users with zero data (no integrations, tasks, KPIs).
 * Shows a warm, motivating message with 3 clear CTAs to get started.
 *
 * Why: prevents users from seeing blank cards and thinking the app is broken.
 * Optimus needs real data to deliver useful insights.
 */

import { Plug, ListTodo, BarChart2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface EmptyStateDashboardProps {
  projectId: string;
  onNavigate: (path: string) => void;
}

export function EmptyStateDashboard({ projectId, onNavigate }: EmptyStateDashboardProps) {
  const { t } = useTranslation();

  const actions = [
    {
      id: 'integrations',
      icon: Plug,
      title: t('dashboard.emptyConnectTool'),
      description: t('dashboard.emptyConnectToolDesc'),
      path: `/project/${projectId}/integrations`,
      color: 'from-cyan-500 to-blue-500',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'tasks',
      icon: ListTodo,
      title: t('dashboard.emptyCreateTask'),
      description: t('dashboard.emptyCreateTaskDesc'),
      path: `/project/${projectId}/tareas`,
      color: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      id: 'explore',
      icon: BarChart2,
      title: t('dashboard.emptyExplore'),
      description: t('dashboard.emptyExploreDesc'),
      path: '', // scrolls down
      color: 'from-emerald-500 to-green-500',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const handleAction = (path: string) => {
    if (!path) {
      // Scroll down to dashboard content
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }
    onNavigate(path);
  };

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-background to-muted/30">
      <CardContent className="py-10 px-6">
        {/* Header with Optimus branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">
            {t('dashboard.emptyWelcome')}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {t('dashboard.emptyWhyConnect')}
          </p>
        </div>

        {/* 3 CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleAction(action.path)}
                className="group text-left rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30 hover:scale-[1.02]"
              >
                <div className={`w-10 h-10 rounded-lg ${action.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-semibold mb-1">{action.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {action.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  {t('dashboard.emptyStart')}
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
