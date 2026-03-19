/**
 * ToolCrossLinks — F21.V2.2
 *
 * Muestra las conexiones entre herramientas del Founder Toolkit.
 * Cada link es una señal inline que empuja al founder hacia la próxima
 * herramienta lógica o avisa que otra herramienta afecta la calidad actual.
 *
 * Tipos:
 *   - opportunity: "Siguiente paso natural" → navega a esa tool
 *   - warning:     "Otra tool tiene datos nuevos que afectan esta" → navega para actualizar
 *
 * Reglas: máx 2 links por tool. Sin redundancia con el chip V2.1.
 */

import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { ToolType, ToolkitUnlockState } from '@/hooks/useToolkitUnlocks';

interface CrossLink {
  type: 'opportunity' | 'warning';
  message: string;
  actionLabel: string;
  targetTool: ToolType;
}

interface ToolCrossLinksProps {
  toolType: ToolType;
  unlocks: ToolkitUnlockState;
  onNavigateTool: (tool: ToolType) => void;
}

const TOOL_LABELS: Record<ToolType, string> = {
  buyer_persona:    'Buyer Persona',
  lead_scoring:     'Lead Scoring',
  sales_playbook:   'Sales Playbook',
  brand_kit:        'Brand Kit',
  comms_guide:      'Guía de Comunicación',
  customer_journey: 'Customer Journey',
};

function computeCrossLinks(toolType: ToolType, unlocks: ToolkitUnlockState): CrossLink[] {
  const links: CrossLink[] = [];
  const st = (t: ToolType) => unlocks[t].status;
  const newData = (t: ToolType) => unlocks[t].has_new_data ?? false;

  switch (toolType) {
    case 'buyer_persona': {
      // Si brand_kit no está generado pero está disponible → paso siguiente natural
      if (st('brand_kit') === 'available') {
        links.push({
          type: 'opportunity',
          message: 'El perfil está listo para alimentar el Brand Kit.',
          actionLabel: 'Generar Brand Kit',
          targetTool: 'brand_kit',
        });
      }
      // Si brand_kit ya generado y comms_guide disponible → siguiente escalón
      if (st('brand_kit') === 'generated' && st('comms_guide') === 'available') {
        links.push({
          type: 'opportunity',
          message: 'Brand Kit generado — el siguiente paso es la Guía de Comunicación.',
          actionLabel: 'Generar Guía de Comunicación',
          targetTool: 'comms_guide',
        });
      }
      break;
    }

    case 'lead_scoring': {
      // Si buyer_persona tiene datos nuevos → el scoring se beneficiaría de la actualización
      if (newData('buyer_persona')) {
        links.push({
          type: 'warning',
          message: 'La Buyer Persona tiene datos nuevos — actualizarla mejoraría los criterios de scoring.',
          actionLabel: 'Ver Buyer Persona',
          targetTool: 'buyer_persona',
        });
      }
      // Si sales_playbook existe → combinar ambas herramientas
      if (st('sales_playbook') === 'generated') {
        links.push({
          type: 'opportunity',
          message: 'Aplica estos scores para decidir en qué deals usar el Sales Playbook primero.',
          actionLabel: 'Ver Sales Playbook',
          targetTool: 'sales_playbook',
        });
      }
      break;
    }

    case 'sales_playbook': {
      // Si lead_scoring existe → usarlo en conjunto para priorizar
      if (st('lead_scoring') === 'generated') {
        links.push({
          type: 'opportunity',
          message: 'Usa el Lead Scoring para decidir en qué leads aplicar este playbook primero.',
          actionLabel: 'Ver Lead Scoring',
          targetTool: 'lead_scoring',
        });
      }
      break;
    }

    case 'brand_kit': {
      // Si buyer_persona tiene datos nuevos → el brand kit puede quedar desalineado
      if (newData('buyer_persona')) {
        links.push({
          type: 'warning',
          message: 'La Buyer Persona tiene datos nuevos — considera regenerar el Brand Kit.',
          actionLabel: 'Ver Buyer Persona',
          targetTool: 'buyer_persona',
        });
      }
      // Si comms_guide no está generado pero está disponible → siguiente paso
      if (st('comms_guide') === 'available') {
        links.push({
          type: 'opportunity',
          message: 'Brand Kit listo — el siguiente paso es generar la Guía de Comunicación por canal.',
          actionLabel: 'Generar Guía de Comunicación',
          targetTool: 'comms_guide',
        });
      }
      break;
    }

    case 'comms_guide': {
      // Si sales_playbook existe → las plantillas y el proceso de venta se complementan
      if (st('sales_playbook') === 'generated') {
        links.push({
          type: 'opportunity',
          message: 'Usa estas plantillas como primer contacto en el paso 1 del Sales Playbook.',
          actionLabel: 'Ver Sales Playbook',
          targetTool: 'sales_playbook',
        });
      }
      break;
    }

    case 'customer_journey': {
      // Si lead_scoring existe → contrastar fricción con criterios de scoring
      if (st('lead_scoring') === 'generated') {
        links.push({
          type: 'opportunity',
          message: 'Contrasta la fricción de cada etapa con los criterios del Lead Scoring.',
          actionLabel: 'Ver Lead Scoring',
          targetTool: 'lead_scoring',
        });
      }
      break;
    }
  }

  return links;
}

export function ToolCrossLinks({ toolType, unlocks, onNavigateTool }: ToolCrossLinksProps) {
  const links = computeCrossLinks(toolType, unlocks);
  if (links.length === 0) return null;

  return (
    <div className="space-y-2">
      {links.map((link, i) => (
        <div
          key={i}
          className={
            link.type === 'warning'
              ? 'flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5'
              : 'flex items-start gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2.5'
          }
        >
          {link.type === 'warning' && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          )}
          {link.type === 'opportunity' && (
            <ArrowRight className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-xs leading-snug ${link.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
              <span className="font-semibold">{TOOL_LABELS[link.targetTool]}</span>{' — '}{link.message}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 px-2 text-[11px] shrink-0 gap-1 ${link.type === 'warning' ? 'text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50' : 'text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/50'}`}
            onClick={() => onNavigateTool(link.targetTool)}
          >
            {link.actionLabel}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
