/**
 * FounderToolkitPage — F21.3 + F21.4–F21.8
 *
 * Página principal del Founder Toolkit.
 * Estado selectedTool: null = grid de 6 cards · string = vista de herramienta.
 * Herramientas ordenadas: available → generated → locked.
 */

import { useState } from 'react';
import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useToolkitUnlocks } from '@/hooks/useToolkitUnlocks';
import { useFounderTool } from '@/hooks/useFounderTool';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/shared/SourceBadge';
import { BuyerPersonaView } from '@/components/toolkit/BuyerPersonaView';
import { LeadScoringView } from '@/components/toolkit/LeadScoringView';
import { SalesPlaybookView } from '@/components/toolkit/SalesPlaybookView';
import { BrandKitView } from '@/components/toolkit/BrandKitView';
import { CommsGuideView } from '@/components/toolkit/CommsGuideView';
import { CustomerJourneyView } from '@/components/toolkit/CustomerJourneyView';
import { ToolCTAs } from '@/components/toolkit/ToolCTAs';
import { ToolCrossLinks } from '@/components/toolkit/ToolCrossLinks';
import {
  AlertCircle, Lock, Sparkles, Users, BarChart2, BookOpen,
  Palette, MessageSquare, Map, Loader2, CheckCircle2, ChevronRight,
  ArrowLeft, RefreshCw, Clock, AlertTriangle, TrendingUp,
} from 'lucide-react';
import type { ToolType, ToolkitUnlockState } from '@/hooks/useToolkitUnlocks';
import type { ToolUnlockInfo } from '@/lib/toolkit-unlock-engine';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { getDateFnsLocale } from '@/i18n';

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
// ── Configuración de herramientas ─────────────────────────────────────────────

interface ToolConfig {
  type: ToolType;
  labelKey: string;
  descKey: string;
  icon: React.ElementType;
  color: string;
}

const TOOL_CONFIG_KEYS: ToolConfig[] = [
  { type: 'buyer_persona',    labelKey: 'founderToolkit.buyerPersona',          descKey: 'founderToolkit.perfilDeTuCliente',              icon: Users,          color: 'violet' },
  { type: 'lead_scoring',     labelKey: 'founderToolkit.leadScoring',           descKey: 'founderToolkit.criteriosYPuntajeDe',            icon: BarChart2,      color: 'blue'   },
  { type: 'sales_playbook',   labelKey: 'founderToolkit.salesPlaybook',         descKey: 'founderToolkit.procesoDeVentaDesde',            icon: BookOpen,       color: 'green'  },
  { type: 'brand_kit',        labelKey: 'founderToolkit.brandKit',              descKey: 'founderToolkit.propuestaDeValorMensajes',       icon: Palette,        color: 'pink'   },
  { type: 'comms_guide',      labelKey: 'founderToolkit.guíaDeComunicación',   descKey: 'founderToolkit.plantillasPorCanalListas',       icon: MessageSquare,  color: 'amber'  },
  { type: 'customer_journey', labelKey: 'founderToolkit.customerJourney',       descKey: 'founderToolkit.mapaDeEtapasCon',               icon: Map,            color: 'teal'   },
];

interface ResolvedToolConfig extends ToolConfig {
  label: string;
  description: string;
}

function resolveToolConfig(t: TFunction): ResolvedToolConfig[] {
  return TOOL_CONFIG_KEYS.map(c => ({ ...c, label: t(c.labelKey), description: t(c.descKey) }));
}

const COLOR_MAP: Record<string, { accent: string; bg: string; border: string; iconBg: string; iconColor: string }> = {
  violet: { accent: 'text-violet-700', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', iconBg: 'bg-violet-100 dark:bg-violet-900/50', iconColor: 'text-violet-600' },
  blue:   { accent: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800',     iconBg: 'bg-blue-100 dark:bg-blue-900/50',     iconColor: 'text-blue-600'   },
  green:  { accent: 'text-green-700',  bg: 'bg-green-50 dark:bg-green-950/30',   border: 'border-green-200 dark:border-green-800',   iconBg: 'bg-green-100 dark:bg-green-900/50',   iconColor: 'text-green-600'  },
  pink:   { accent: 'text-pink-700',   bg: 'bg-pink-50 dark:bg-pink-950/30',     border: 'border-pink-200 dark:border-pink-800',     iconBg: 'bg-pink-100 dark:bg-pink-900/50',     iconColor: 'text-pink-600'   },
  amber:  { accent: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-200 dark:border-amber-800',   iconBg: 'bg-amber-100 dark:bg-amber-900/50',   iconColor: 'text-amber-600'  },
  teal:   { accent: 'text-teal-700',   bg: 'bg-teal-50 dark:bg-teal-950/30',     border: 'border-teal-200 dark:border-teal-800',     iconBg: 'bg-teal-100 dark:bg-teal-900/50',     iconColor: 'text-teal-600'   },
};

// ── ToolCard (grid) ───────────────────────────────────────────────────────────

function ToolCard({ config, unlocks, onSelect }: { config: ResolvedToolConfig; unlocks: ToolkitUnlockState; onSelect: () => void }) {
  const { t } = useTranslation();
  const info = unlocks[config.type];
  const colors = COLOR_MAP[config.color];
  const Icon = config.icon;
  const isLocked = info.status === 'locked';
  const isGenerated = info.status === 'generated';
  const isAvailable = info.status === 'available';

  return (
    <Card className={cn('transition-all duration-200', isLocked ? 'opacity-60 bg-gray-50 dark:bg-gray-900/40' : `${colors.bg} ${colors.border}`)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isLocked ? 'bg-gray-200 dark:bg-gray-700' : colors.iconBg)}>
              {isLocked ? <Lock className="h-4 w-4 text-gray-400" /> : <Icon className={cn('h-4 w-4', colors.iconColor)} />}
            </div>
            <CardTitle className={cn('text-sm font-semibold', isLocked ? 'text-gray-500' : '')}>{config.label}</CardTitle>
          </div>
          {isGenerated && <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" />{t('founderToolkit.generado')}</Badge>}
          {isAvailable && <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 shrink-0"><Sparkles className="h-3 w-3 mr-1" />{t('founderToolkit.disponible')}</Badge>}
          {isLocked && <Badge variant="secondary" className="text-[10px] shrink-0"><Lock className="h-3 w-3 mr-1" />{t('founderToolkit.bloqueado')}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{config.description}</p>
        {/* Chip "nuevos datos disponibles" — solo para tools generadas */}
        {isGenerated && info.has_new_data && (
          <div className="flex items-center gap-1.5 rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-2 py-1.5">
            <TrendingUp className="h-3 w-3 text-orange-600 shrink-0" />
            <span className="text-[11px] font-medium text-orange-700 dark:text-orange-400 leading-snug">
              {info.new_data_reason} — regenerar para actualizar
            </span>
          </div>
        )}
        {info.unlock_reason && (
          <p className={cn('text-xs font-medium', colors.accent)}>
            {isGenerated ? '✓ ' : '→ '}{info.unlock_reason}
          </p>
        )}
        {isLocked && info.missing_for_unlock && (
          <ul className="space-y-1">
            {info.missing_for_unlock.map((req, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[9px]">{i + 1}</span>
                {req}
              </li>
            ))}
          </ul>
        )}
        {(isAvailable || isGenerated) && (
          <Button size="sm" variant={isGenerated ? 'outline' : 'default'} className="w-full gap-1.5 mt-1 text-xs h-8" onClick={onSelect}>
            {isGenerated ? t('founderToolkit.verHerramienta') : `${t('founderToolkit.generar')} ${config.label}`}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── ToolDetailView (vista de herramienta individual) ──────────────────────────

function ToolDetailView({ config, projectId, onBack, unlockInfo, unlocks, onNavigateTool }: {
  config: ResolvedToolConfig;
  projectId: string;
  onBack: () => void;
  unlockInfo?: ToolUnlockInfo;
  unlocks?: ToolkitUnlockState | null;
  onNavigateTool?: (tool: ToolType) => void;
}) {
  const { t } = useTranslation();
  const toolState = useFounderTool(projectId, config.type);
  const colors = COLOR_MAP[config.color];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header con back */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={onBack} className="gap-1.5 -ml-1">
          <ArrowLeft className="h-4 w-4" />{t('founderToolkit.toolkit')}</Button>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.iconBg)}>
            <Icon className={cn('h-4 w-4', colors.iconColor)} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{config.label}</h2>
          {toolState.isStale && (
            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">
              <AlertTriangle className="h-3 w-3 mr-1" />{t('founderToolkit.ttlExpirado')}</Badge>
          )}
          {unlockInfo?.has_new_data && (
            <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
              <TrendingUp className="h-3 w-3 mr-1" />{unlockInfo.new_data_reason}
            </Badge>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {toolState.generatedAt && (
            <p className="text-xs text-gray-500 hidden sm:block">
              Generado {formatDistanceToNow(new Date(toolState.generatedAt), { addSuffix: true, locale: getDateFnsLocale() })}
            </p>
          )}
          <Button
            size="sm"
            variant={toolState.isStale ? 'default' : 'outline'}
            disabled={toolState.isGenerating || !toolState.canRegenerate}
            onClick={toolState.generate}
            className="gap-1.5"
          >
            {toolState.isGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{t('founderToolkit.generando')}</>
              : toolState.output
                ? <><RefreshCw className="h-3.5 w-3.5" />{t('founderToolkit.regenerar')}</>
                : <>{t('founderToolkit.generar')}</>
            }
          </Button>
        </div>
      </div>

      {/* Rate limit */}
      {!toolState.canRegenerate && toolState.nextRegenerationAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500 -mt-4">
          <Clock className="h-3.5 w-3.5" />
          Próxima regeneración a las {toolState.nextRegenerationAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {/* Loading */}
      {(toolState.isLoading || toolState.isGenerating) && !toolState.output && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          {toolState.isGenerating && <p className="text-sm text-gray-500">{t('founderToolkit.generandoAnálisis')}</p>}
        </div>
      )}

      {/* Sin output */}
      {!toolState.isLoading && !toolState.isGenerating && !toolState.output && (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 rounded-xl border-2 border-dashed border-gray-200">
          <Icon className={cn('h-10 w-10', colors.iconColor, 'opacity-40')} />
          <p className="text-gray-600 dark:text-gray-400">{t('founderToolkit.noHayAnálisisGenerado')}</p>
          <Button onClick={toolState.generate} disabled={toolState.isGenerating || !toolState.canRegenerate}>
            {t('founderToolkit.generar')} {config.label}
          </Button>
        </div>
      )}

      {/* Vista de contenido */}
      {toolState.output && !toolState.isGenerating && (
        <>
          {config.type === 'buyer_persona'    && <BuyerPersonaView   output={toolState.output as Parameters<typeof BuyerPersonaView>[0]['output']}   />}
          {config.type === 'lead_scoring'     && <LeadScoringView    output={toolState.output as Parameters<typeof LeadScoringView>[0]['output']}    />}
          {config.type === 'sales_playbook'   && <SalesPlaybookView  output={toolState.output as Parameters<typeof SalesPlaybookView>[0]['output']}  />}
          {config.type === 'brand_kit'        && <BrandKitView       output={toolState.output as Parameters<typeof BrandKitView>[0]['output']}       />}
          {config.type === 'comms_guide'      && <CommsGuideView     output={toolState.output as Parameters<typeof CommsGuideView>[0]['output']}     />}
          {config.type === 'customer_journey' && <CustomerJourneyView output={toolState.output as Parameters<typeof CustomerJourneyView>[0]['output']} />}

          {/* Cross-links entre herramientas */}
          {unlocks && onNavigateTool && (
            <ToolCrossLinks
              toolType={config.type}
              unlocks={unlocks}
              onNavigateTool={onNavigateTool}
            />
          )}

          {/* CTAs de acción */}
          <ToolCTAs
            toolType={config.type}
            output={toolState.output as Record<string, unknown>}
            projectId={projectId}
          />

          {/* Data sources */}
          {toolState.dataSources.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 dark:bg-gray-900 p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{t('founderToolkit.fuentesUsadas')}</p>
              <div className="flex flex-wrap gap-2">
                {toolState.dataSources.map((src, i) => (
                  <SourceBadge key={i} type={src.type as 'observed' | 'declared' | 'estimated' | 'inferred'} source={src.name} timestamp={src.updated_at ?? undefined} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FounderToolkitPage() {
  const { t } = useTranslation();
  const TOOL_CONFIG = resolveToolConfig(t);
  const { currentProject } = useCurrentProject();
  const { unlocks, isLoading } = useToolkitUnlocks(currentProject?.id);
  const [selectedTool, setSelectedTool] = useState<ToolType | null>(null);

  if (!currentProject) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('founderToolkit.seleccionaUnProyectoDesde')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Vista de herramienta seleccionada
  if (selectedTool) {
    const config = TOOL_CONFIG.find(c => c.type === selectedTool)!;
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <ToolDetailView
          config={config}
          projectId={currentProject.id}
          onBack={() => setSelectedTool(null)}
          unlockInfo={unlocks?.[selectedTool] ?? undefined}
          unlocks={unlocks}
          onNavigateTool={setSelectedTool}
        />
      </div>
    );
  }

  // Grid
  const ordered = TOOL_CONFIG.slice().sort((a, b) => {
    if (!unlocks) return 0;
    const order: Record<string, number> = { available: 0, generated: 1, locked: 2 };
    return order[unlocks[a.type].status] - order[unlocks[b.type].status];
  });

  const availableCount = unlocks ? TOOL_CONFIG.filter(t => unlocks[t.type].status === 'available').length : 0;
  const generatedCount = unlocks ? TOOL_CONFIG.filter(t => unlocks[t.type].status === 'generated').length : 0;

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('founderToolkit.founderToolkit')}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('founderToolkit.toolkitSubtitle')}
        </p>
        {!isLoading && unlocks && (availableCount > 0 || generatedCount > 0) && (
          <div className="flex items-center gap-3 mt-3">
            {availableCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />{t('founderToolkit.availableCount', { count: availableCount })}
              </Badge>
            )}
            {generatedCount > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />{t('founderToolkit.generatedCount', { count: generatedCount })}
              </Badge>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : unlocks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ordered.map(config => (
            <ToolCard
              key={config.type}
              config={config}
              unlocks={unlocks}
              onSelect={() => setSelectedTool(config.type)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
