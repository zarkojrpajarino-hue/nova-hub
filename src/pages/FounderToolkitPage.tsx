/**
 * FounderToolkitPage — F21.3
 *
 * Página principal del Founder Toolkit.
 * Muestra las 6 herramientas IA ordenadas: available → generated → locked.
 * Cada ToolCard refleja el estado actual del unlock engine.
 * Las herramientas bloqueadas muestran exactamente qué falta — nunca una caja negra.
 */

import { useCurrentProject } from '@/contexts/CurrentProjectContext';
import { useToolkitUnlocks } from '@/hooks/useToolkitUnlocks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  Lock,
  Sparkles,
  Users,
  BarChart2,
  BookOpen,
  Palette,
  MessageSquare,
  Map,
  Loader2,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { ToolType, ToolkitUnlockState } from '@/hooks/useToolkitUnlocks';
import { cn } from '@/lib/utils';

// ── Configuración de cada herramienta ────────────────────────────────────────

interface ToolConfig {
  type: ToolType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;         // Tailwind accent para available/generated
  route: string;         // ruta futura (stubs por ahora)
}

const TOOL_CONFIG: ToolConfig[] = [
  {
    type: 'buyer_persona',
    label: 'Buyer Persona',
    description: 'Perfil detallado de tu cliente ideal basado en tus leads reales del CRM.',
    icon: Users,
    color: 'violet',
    route: 'toolkit/buyer-persona',
  },
  {
    type: 'lead_scoring',
    label: 'Lead Scoring',
    description: 'Criterios y pesos de scoring generados desde el historial de deals reales.',
    icon: BarChart2,
    color: 'blue',
    route: 'toolkit/lead-scoring',
  },
  {
    type: 'sales_playbook',
    label: 'Sales Playbook',
    description: 'Proceso de venta, objeciones y señales de cierre desde tus deals ganados.',
    icon: BookOpen,
    color: 'green',
    route: 'toolkit/sales-playbook',
  },
  {
    type: 'brand_kit',
    label: 'Brand Kit',
    description: 'Propuesta de valor, mensajes clave y tono de comunicación de tu marca.',
    icon: Palette,
    color: 'pink',
    route: 'toolkit/brand-kit',
  },
  {
    type: 'comms_guide',
    label: 'Guía de Comunicación',
    description: 'Adaptación del tono por canal y plantillas de primer contacto copiables.',
    icon: MessageSquare,
    color: 'amber',
    route: 'toolkit/comms-guide',
  },
  {
    type: 'customer_journey',
    label: 'Customer Journey',
    description: 'Mapa de las etapas del cliente con datos reales de Stripe y tu CRM.',
    icon: Map,
    color: 'teal',
    route: 'toolkit/customer-journey',
  },
];

// ── ToolCard ──────────────────────────────────────────────────────────────────

interface ToolCardProps {
  config: ToolConfig;
  unlocks: ToolkitUnlockState;
}

const COLOR_MAP: Record<string, { accent: string; bg: string; border: string; iconColor: string }> = {
  violet: { accent: 'text-violet-700', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', iconColor: 'text-violet-500' },
  blue:   { accent: 'text-blue-700',   bg: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800',     iconColor: 'text-blue-500'   },
  green:  { accent: 'text-green-700',  bg: 'bg-green-50 dark:bg-green-950/30',   border: 'border-green-200 dark:border-green-800',   iconColor: 'text-green-500'  },
  pink:   { accent: 'text-pink-700',   bg: 'bg-pink-50 dark:bg-pink-950/30',     border: 'border-pink-200 dark:border-pink-800',     iconColor: 'text-pink-500'   },
  amber:  { accent: 'text-amber-700',  bg: 'bg-amber-50 dark:bg-amber-950/30',   border: 'border-amber-200 dark:border-amber-800',   iconColor: 'text-amber-500'  },
  teal:   { accent: 'text-teal-700',   bg: 'bg-teal-50 dark:bg-teal-950/30',     border: 'border-teal-200 dark:border-teal-800',     iconColor: 'text-teal-500'   },
};

function ToolCard({ config, unlocks }: ToolCardProps) {
  const info = unlocks[config.type];
  const colors = COLOR_MAP[config.color];
  const Icon = config.icon;

  const isLocked = info.status === 'locked';
  const isGenerated = info.status === 'generated';
  const isAvailable = info.status === 'available';

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isLocked && 'opacity-60 bg-gray-50 dark:bg-gray-900/40',
        isAvailable && `${colors.bg} ${colors.border}`,
        isGenerated && `${colors.bg} ${colors.border}`,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isLocked ? 'bg-gray-200 dark:bg-gray-700' : colors.bg,
              )}
            >
              {isLocked
                ? <Lock className="h-4 w-4 text-gray-400" />
                : <Icon className={cn('h-4 w-4', colors.iconColor)} />
              }
            </div>
            <CardTitle className={cn('text-sm font-semibold', isLocked ? 'text-gray-500' : '')}>
              {config.label}
            </CardTitle>
          </div>

          {/* Estado badge */}
          {isGenerated && (
            <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 shrink-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Generado
            </Badge>
          )}
          {isAvailable && (
            <Badge className={cn('text-[10px] shrink-0', `bg-${config.color}-100 text-${config.color}-700 border-${config.color}-200`)}>
              <Sparkles className="h-3 w-3 mr-1" />
              Disponible
            </Badge>
          )}
          {isLocked && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              <Lock className="h-3 w-3 mr-1" />
              Bloqueado
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {config.description}
        </p>

        {/* Unlock reason (available o generated) */}
        {info.unlock_reason && (
          <p className={cn('text-xs font-medium', colors.accent)}>
            {isGenerated ? '✓ ' : '→ '}{info.unlock_reason}
          </p>
        )}

        {/* Missing requirements (locked) */}
        {isLocked && info.missing_for_unlock && (
          <ul className="space-y-1">
            {info.missing_for_unlock.map((req, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center text-[9px]">
                  {i + 1}
                </span>
                {req}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        {(isAvailable || isGenerated) && (
          <Button
            size="sm"
            variant={isGenerated ? 'outline' : 'default'}
            className="w-full gap-1.5 mt-1 text-xs h-8"
            disabled // TODO: habilitar en F21.4–F21.8
          >
            {isGenerated ? 'Ver herramienta' : `Generar ${config.label}`}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function FounderToolkitPage() {
  const { currentProject } = useCurrentProject();
  const { unlocks, isLoading } = useToolkitUnlocks(currentProject?.id);

  if (!currentProject) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Selecciona un proyecto desde el selector en el header
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Ordenar: available → generated → locked
  const ordered = TOOL_CONFIG.slice().sort((a, b) => {
    if (!unlocks) return 0;
    const order: Record<string, number> = { available: 0, generated: 1, locked: 2 };
    return order[unlocks[a.type].status] - order[unlocks[b.type].status];
  });

  const availableCount = unlocks
    ? TOOL_CONFIG.filter(t => unlocks[t.type].status === 'available').length
    : 0;
  const generatedCount = unlocks
    ? TOOL_CONFIG.filter(t => unlocks[t.type].status === 'generated').length
    : 0;

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Founder Toolkit</h1>
        <p className="text-sm text-gray-500 mt-1">
          6 herramientas IA que se desbloquean según la actividad real de tu negocio
        </p>
        {!isLoading && unlocks && (availableCount > 0 || generatedCount > 0) && (
          <div className="flex items-center gap-3 mt-3">
            {availableCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Sparkles className="h-3 w-3 mr-1" />
                {availableCount} disponible{availableCount !== 1 ? 's' : ''} para generar
              </Badge>
            )}
            {generatedCount > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {generatedCount} generada{generatedCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : unlocks ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ordered.map(config => (
            <ToolCard key={config.type} config={config} unlocks={unlocks} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
