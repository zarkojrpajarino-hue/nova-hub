/**
 * ToolCTAs — CTAs de acción por herramienta del Founder Toolkit
 *
 * 2 CTAs fuertes por herramienta. Cada uno lleva a una acción real:
 *   - Navegación con contexto (CRM, Meetings)
 *   - Creación de tarea directa desde el output generado
 *   - Copia de plantilla al portapapeles
 *
 * Respeta el límite de 5 tareas activas por proyecto.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/contexts/NavigationContext';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Mail, BarChart2, Calendar, CheckSquare,
  AlertTriangle, ArrowRight, Loader2, Copy, ClipboardList,
} from 'lucide-react';
import type { ToolType } from '@/hooks/useToolkitUnlocks';

import { useTranslation } from 'react-i18next';
// ── Tipos ─────────────────────────────────────────────────────────────────────

interface ToolCTAsProps {
  toolType: ToolType;
  output: Record<string, unknown>;
  projectId: string;
}

// ── Helper: crear tarea con respeto al límite de 5 ────────────────────────────

async function insertTask(
  projectId: string,
  userId: string,
  titulo: string,
  descripcion: string,
  functionType: string,
): Promise<boolean> {
  const { data: active } = await supabase
    .from('tasks')
    .select('id')
    .eq('project_id', projectId)
    .neq('status', 'done');

  if ((active?.length ?? 0) >= 5) {
    toast.error(t('toolkit.límiteAlcanzadoMáximo5'));
    return false;
  }

  const { error } = await supabase.from('tasks').insert({
    project_id: projectId,
    titulo,
    descripcion: descripcion || null,
    assignee_id: userId,
    prioridad: 1,
    function_type: functionType,
    status: 'todo',
    ai_generated: true,
  });

  if (error) {
    toast.error(t('toolkit.errorAlCrearLa'));
    return false;
  }

  toast.success(t('toolkit.tareaCreada'));
  return true;
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ToolCTAs({ toolType, output, projectId }: ToolCTAsProps) {
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const handleCreateTask = async (titulo: string, descripcion: string, functionType = 'demand') => {
    if (!profile?.id) return;
    setIsCreatingTask(true);
    const ok = await insertTask(projectId, profile.id, titulo, descripcion, functionType);
    if (ok) {
      queryClient.invalidateQueries({ queryKey: ['project_tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    }
    setIsCreatingTask(false);
  };

  // ── Buyer Persona ──────────────────────────────────────────────────────────
  if (toolType === 'buyer_persona') {
    return (
      <CTABlock>
        <CTAButton icon={Mail} variant="default" onClick={() => navigate('crm')}>{t('toolkit.generarPitchConEste')}</CTAButton>
        <CTAButton
          icon={ClipboardList}
          loading={isCreatingTask}
          onClick={() => handleCreateTask(
            t('toolkit.validarHipótesisDeBuyer'),
            t('toolkit.contactarA3Personas'),
            'demand',
          )}
        >{t('toolkit.crearTareaDeValidación')}</CTAButton>
      </CTABlock>
    );
  }

  // ── Lead Scoring ──────────────────────────────────────────────────────────
  if (toolType === 'lead_scoring') {
    return (
      <CTABlock>
        <CTAButton icon={BarChart2} variant="default" onClick={() => navigate('crm')}>
          Ver leads en CRM
        </CTAButton>
        <CTAButton
          icon={CheckSquare}
          loading={isCreatingTask}
          onClick={() => handleCreateTask(
            'Aplicar criterios de Lead Scoring en CRM',
            t('toolkit.revisarLeadsActualesY'),
            'demand',
          )}
        >{t('toolkit.crearTareaAplicarScoring')}</CTAButton>
      </CTABlock>
    );
  }

  // ── Sales Playbook ────────────────────────────────────────────────────────
  if (toolType === 'sales_playbook') {
    const pasos = output.pasos as Array<{ nombre?: string }> | undefined;
    const primerPaso = pasos?.[0]?.nombre ?? 'primer paso';
    return (
      <CTABlock>
        <CTAButton icon={Calendar} variant="default" onClick={() => navigate('meetings')}>{t('toolkit.verReuniones')}</CTAButton>
        <CTAButton
          icon={CheckSquare}
          loading={isCreatingTask}
          onClick={() => handleCreateTask(
            `Sales Playbook — paso 1: ${primerPaso}`,
            t('toolkit.iniciarElProcesoDe'),
            'demand',
          )}
        >
          Crear tarea: iniciar paso 1
        </CTAButton>
      </CTABlock>
    );
  }

  // ── Brand Kit ─────────────────────────────────────────────────────────────
  if (toolType === 'brand_kit') {
    return (
      <CTABlock>
        <CTAButton icon={Mail} variant="default" onClick={() => navigate('crm')}>{t('toolkit.aplicarAPitches')}</CTAButton>
        <CTAButton
          icon={CheckSquare}
          loading={isCreatingTask}
          onClick={() => handleCreateTask(
            t('toolkit.revisarPitchesActualesCon'),
            t('toolkit.compararLosÚltimosPitches'),
            'demand',
          )}
        >{t('toolkit.crearTareaRevisarCoherencia')}</CTAButton>
      </CTABlock>
    );
  }

  // ── Comms Guide ───────────────────────────────────────────────────────────
  if (toolType === 'comms_guide') {
    const canales = output.canales as Array<{ canal?: string; plantilla_primer_contacto?: string }> | undefined;
    const emailCanal = canales?.find(c => c.canal === 'email');

    const handleCopyEmail = () => {
      if (!emailCanal?.plantilla_primer_contacto) return;
      navigator.clipboard.writeText(emailCanal.plantilla_primer_contacto);
      toast.success(t('toolkit.plantillaDeEmailCopiada'));
    };

    return (
      <CTABlock>
        <CTAButton icon={Mail} variant="default" onClick={() => navigate('crm')}>{t('toolkit.irAlGeneradorDe')}</CTAButton>
        <CTAButton
          icon={Copy}
          disabled={!emailCanal?.plantilla_primer_contacto}
          onClick={handleCopyEmail}
        >{t('toolkit.copiarPlantillaEmail')}</CTAButton>
      </CTABlock>
    );
  }

  // ── Customer Journey ──────────────────────────────────────────────────────
  if (toolType === 'customer_journey') {
    const etapas = output.etapas as Array<{ nombre?: string; friccion_principal?: string }> | undefined;
    const etapaConFriccion = etapas?.find(e => e.friccion_principal);

    return (
      <CTABlock>
        <CTAButton
          icon={AlertTriangle}
          variant="default"
          loading={isCreatingTask}
          onClick={() => handleCreateTask(
            etapaConFriccion
              ? `Reducir fricción en "${etapaConFriccion.nombre}": ${etapaConFriccion.friccion_principal}`
              : t('toolkit.reducirFricciónDetectadaEn'),
            t('toolkit.revisarElCustomerJourney'),
            'delivery',
          )}
        >{t('toolkit.crearTareaAtacarFricción')}</CTAButton>
        <CTAButton icon={ArrowRight} onClick={() => navigate('crm')}>
          Ver pipeline CRM
        </CTAButton>
      </CTABlock>
    );
  }

  return null;
}

// ── Subcomponentes internos ────────────────────────────────────────────────────

function CTABlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('toolkit.próximosPasos')}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

interface CTAButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

function CTAButton({ icon: Icon, onClick, children, variant = 'outline', loading = false, disabled = false }: CTAButtonProps) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onClick}
      disabled={loading || disabled}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {children}
    </Button>
  );
}
