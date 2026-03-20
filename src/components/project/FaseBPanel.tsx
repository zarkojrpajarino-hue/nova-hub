/**
 * FASE B PANEL
 *
 * O5.10 — Híbrido funcional: perfil estratégico + primeras acciones.
 *
 * 5 ítems en 3 bloques:
 *   Bloque 1 — Completa tu contexto:
 *     1. sector             → onboarding_data.selected_industry
 *     2. competitors        → onboarding_data.fase_b_answers.competitors (1–3)
 *   Bloque 2 — Define tu mercado:
 *     3. acquisition_channel → project_acquisition_channel count ≥ 1
 *                              (CTA → scroll suave al AcquisitionChannelEditor)
 *   Bloque 3 — Da tus primeros pasos:
 *     4. first_obv          → prop totalOBVs ≥ 1
 *     5. riskiest_assumption → onboarding_data.riskiest_assumption
 *
 * Estado en onboarding_data (sin tabla nueva):
 *   fase_b_started_at      — ISO string, cuándo se abrió el panel
 *   fase_b_dismissed       — boolean, dismiss manual permanente
 *   fase_b_answers.competitors — string[] (única entrada de datos nueva real)
 *
 * Aparece si: fast_start_completed === true && fase_b_dismissed !== true
 * Auto-dismiss (2.5s delay) cuando los 5 ítems completan.
 * Canal: comparte queryKey ['acquisition_channels', projectId] con AcquisitionChannelEditor
 *   para reactividad automática cuando el usuario añade canales en el mismo dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Building2,
  Users,
  TrendingUp,
  Target,
  Lightbulb,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface FaseBPanelProps {
  projectId: string;
  totalOBVs: number;
  onNavigateToTab?: (tab: string) => void;
}

interface PanelData {
  selectedIndustry: string | null;
  riskiestAssumption: string | null;
  hypothesisMaturity: string | null;
  competitors: string[];
}

// AUD.B.8 — registrar timestamp de completitud por ítem en fase_b_progress
async function recordItemCompleted(projectId: string, itemId: string, value?: unknown): Promise<void> {
  const { data: row } = await supabase
    .from('projects')
    .select('onboarding_data')
    .eq('id', projectId)
    .single();
  const od = (row?.onboarding_data ?? {}) as Record<string, unknown>;
  const progress = (od.fase_b_progress ?? {}) as Record<string, unknown>;
  const items = (progress.items ?? {}) as Record<string, unknown>;
  items[itemId] = { completed: true, completed_at: new Date().toISOString(), value: value ?? null };
  await supabase
    .from('projects')
    .update({ onboarding_data: { ...od, fase_b_progress: { ...progress, items } } as unknown as Json })
    .eq('id', projectId);
}

// ── Merge helper (read-then-merge, mismo patrón que FirstStepsPanel) ──────────
async function mergeOD(projectId: string, patch: Record<string, unknown>): Promise<void> {
  const { data: row } = await supabase
    .from('projects')
    .select('onboarding_data')
    .eq('id', projectId)
    .single();
  const od = (row?.onboarding_data ?? {}) as Record<string, unknown>;
  await supabase
    .from('projects')
    .update({ onboarding_data: { ...od, ...patch } as unknown as Json })
    .eq('id', projectId);
}

// ── Merge helper para fase_b_answers.competitors (nested) ─────────────────────
async function mergeCompetitors(projectId: string, newList: string[]): Promise<void> {
  const { data: row } = await supabase
    .from('projects')
    .select('onboarding_data')
    .eq('id', projectId)
    .single();
  const od = (row?.onboarding_data ?? {}) as Record<string, unknown>;
  const faseB = (od.fase_b_answers ?? {}) as Record<string, unknown>;
  await supabase
    .from('projects')
    .update({
      onboarding_data: { ...od, fase_b_answers: { ...faseB, competitors: newList } } as unknown as Json,
    })
    .eq('id', projectId);
}

// ── Main component ────────────────────────────────────────────────────────────

export function FaseBPanel({ projectId, totalOBVs, onNavigateToTab }: FaseBPanelProps) {
  const [visible, setVisible] = useState<boolean | null>(null);
  const [data, setData] = useState<PanelData | null>(null);
  const [allDone, setAllDone] = useState(false);

  const [sectorInput, setSectorInput] = useState('');
  const [competitorInput, setCompetitorInput] = useState('');
  const [riskiestInput, setRiskiestInput] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // ── Mount: leer onboarding_data ────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('projects')
      .select('onboarding_data')
      .eq('id', projectId)
      .single()
      .then(({ data: row }) => {
        const od = (row?.onboarding_data ?? {}) as Record<string, unknown>;

        if (od.fast_start_completed !== true || od.fase_b_dismissed === true) {
          setVisible(false);
          return;
        }

        const faseB = (od.fase_b_answers ?? {}) as Record<string, unknown>;
        setData({
          selectedIndustry: (od.selected_industry as string) ?? null,
          riskiestAssumption: (od.riskiest_assumption as string) ?? null,
          hypothesisMaturity: (od.hypothesis_maturity as string) ?? null,
          competitors: (faseB.competitors as string[]) ?? [],
        });
        setVisible(true);

        // Registrar cuándo se abrió el panel por primera vez
        if (!od.fase_b_started_at) {
          mergeOD(projectId, { fase_b_started_at: new Date().toISOString() });
        }
      });
  }, [projectId]);

  // ── Canal de adquisición: React Query comparte cache con AcquisitionChannelEditor
  // Cuando el editor añade/borra canales e invalida ['acquisition_channels', projectId],
  // este panel recibe el count actualizado automáticamente.
  const { data: channelCount = 0 } = useQuery({
    queryKey: ['acquisition_channels', projectId],
    queryFn: async () => {
      const { count } = await supabase
        .from('project_acquisition_channel')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      return count ?? 0;
    },
    enabled: !!projectId && visible === true,
  });

  // ── Completion states ──────────────────────────────────────────────────────
  const sectorOk     = !!data?.selectedIndustry;
  const competitorOk = (data?.competitors.length ?? 0) > 0;
  const channelOk    = channelCount > 0;
  const obvOk        = totalOBVs >= 1;
  const riskiestOk   = !!data?.riskiestAssumption;
  const completedCount = [sectorOk, competitorOk, channelOk, obvOk, riskiestOk].filter(Boolean).length;

  // ── Dismiss ───────────────────────────────────────────────────────────────
  const dismiss = useCallback(async () => {
    setVisible(false);
    try {
      await mergeOD(projectId, { fase_b_dismissed: true });
    } catch { /* silent — dismiss ya aplicado en UI */ }
  }, [projectId]);

  // ── Auto-dismiss al completar todos los ítems ─────────────────────────────
  useEffect(() => {
    if (completedCount === 5 && visible === true && !allDone) {
      setAllDone(true);
      const t = setTimeout(dismiss, 2500);
      return () => clearTimeout(t);
    }
  }, [completedCount, visible, allDone, dismiss]);

  // ── Save: sector ──────────────────────────────────────────────────────────
  const saveSector = async () => {
    const val = sectorInput.trim();
    if (!val) return;
    setSaving('sector');
    try {
      await mergeOD(projectId, { selected_industry: val });
      await recordItemCompleted(projectId, 'sector', val);
      setData(prev => prev ? { ...prev, selectedIndustry: val } : prev);
      setSectorInput('');
    } finally { setSaving(null); }
  };

  // ── Save: añadir competidor ────────────────────────────────────────────────
  const addCompetitor = async () => {
    const val = competitorInput.trim();
    if (!val || (data?.competitors.length ?? 0) >= 3) return;
    const newList = [...(data?.competitors ?? []), val];
    setSaving('competitors');
    try {
      await mergeCompetitors(projectId, newList);
      // AUD.B.8 — marcar completado la primera vez que se añade un competidor
      if ((data?.competitors.length ?? 0) === 0) {
        await recordItemCompleted(projectId, 'competitors', newList);
      }
      setData(prev => prev ? { ...prev, competitors: newList } : prev);
      setCompetitorInput('');
    } finally { setSaving(null); }
  };

  // ── Save: eliminar competidor ─────────────────────────────────────────────
  const removeCompetitor = async (index: number) => {
    const newList = (data?.competitors ?? []).filter((_, i) => i !== index);
    setSaving('competitors');
    try {
      await mergeCompetitors(projectId, newList);
      setData(prev => prev ? { ...prev, competitors: newList } : prev);
    } finally { setSaving(null); }
  };

  // ── Save: riskiest_assumption ─────────────────────────────────────────────
  const saveRiskiest = async () => {
    const val = riskiestInput.trim();
    if (val.length < 15) return;
    setSaving('riskiest');
    try {
      const patch: Record<string, unknown> = { riskiest_assumption: val };
      // Si hypothesis_maturity era null (paths sin DT), establecer 'partial'
      if (!data?.hypothesisMaturity) patch.hypothesis_maturity = 'partial';
      await mergeOD(projectId, patch);
      await recordItemCompleted(projectId, 'riskiest_assumption', val);
      setData(prev => prev ? { ...prev, riskiestAssumption: val } : prev);
      setRiskiestInput('');
    } finally { setSaving(null); }
  };

  // ── Scroll suave al AcquisitionChannelEditor ──────────────────────────────
  const scrollToAcqChannel = () => {
    const el = document.getElementById('acquisition-channel-editor');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'box-shadow 0.3s ease';
    el.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.35)';
    setTimeout(() => { el.style.boxShadow = ''; }, 2000);
  };

  if (!visible || !data) return null;

  return (
    <div className={cn(
      'bg-card border border-border rounded-2xl p-5 animate-fade-in',
      allDone && 'border-success/40',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base">Completa tu proyecto</h3>
          {allDone && (
            <span className="text-xs font-medium text-success flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Perfecto
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{completedCount}/5</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={dismiss}
            aria-label="Descartar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full mb-5">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            completedCount === 5 ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${(completedCount / 5) * 100}%` }}
        />
      </div>

      {/* 3 bloques */}
      <div className="grid grid-cols-3 gap-4">

        {/* Bloque 1 — Completa tu contexto */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Completa tu contexto
          </p>

          {/* Ítem 1: Sector */}
          <ItemCard complete={sectorOk} icon={Building2} iconBg="bg-violet-50" iconColor="text-violet-600">
            <p className="text-sm font-medium mb-1.5">Sector / industria</p>
            {sectorOk ? (
              <p className="text-xs text-muted-foreground">{data.selectedIndustry}</p>
            ) : (
              <div className="space-y-1.5">
                <Input
                  placeholder="ej. SaaS B2B, ecommerce, consultoría..."
                  value={sectorInput}
                  onChange={e => setSectorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveSector()}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={saveSector}
                  disabled={!sectorInput.trim() || saving === 'sector'}
                >
                  Guardar
                </Button>
              </div>
            )}
          </ItemCard>

          {/* Ítem 2: Competidores */}
          <ItemCard complete={competitorOk} icon={Users} iconBg="bg-orange-50" iconColor="text-orange-600">
            <p className="text-sm font-medium mb-1.5">Competidores principales</p>
            <div className="space-y-1">
              {data.competitors.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1"
                >
                  <span className="truncate">{c}</span>
                  <button
                    onClick={() => removeCompetitor(i)}
                    disabled={saving === 'competitors'}
                    className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                    aria-label={`Eliminar ${c}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {data.competitors.length < 3 && (
                <div className="flex gap-1 mt-0.5">
                  <Input
                    placeholder={`Competidor ${data.competitors.length + 1}`}
                    value={competitorInput}
                    onChange={e => setCompetitorInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCompetitor()}
                    className="h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 shrink-0"
                    onClick={addCompetitor}
                    disabled={!competitorInput.trim() || saving === 'competitors'}
                    aria-label="Añadir competidor"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </ItemCard>
        </div>

        {/* Bloque 2 — Define tu mercado */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Define tu mercado
          </p>

          {/* Ítem 3: Canal de adquisición */}
          <ItemCard complete={channelOk} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600">
            <p className="text-sm font-medium mb-1.5">Canal de adquisición</p>
            {channelOk ? (
              <p className="text-xs text-muted-foreground">
                {channelCount} {channelCount === 1 ? 'canal definido' : 'canales definidos'}
              </p>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary gap-1 pl-0 mt-0.5"
                onClick={scrollToAcqChannel}
              >
                Ir al canal de adquisición <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </ItemCard>
        </div>

        {/* Bloque 3 — Da tus primeros pasos */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Da tus primeros pasos
          </p>

          {/* Ítem 4: Primer OBV */}
          <ItemCard complete={obvOk} icon={Target} iconBg="bg-amber-50" iconColor="text-amber-600">
            <p className="text-sm font-medium mb-1.5">Primer OBV registrado</p>
            {obvOk ? (
              <p className="text-xs text-muted-foreground">
                {totalOBVs} {totalOBVs === 1 ? 'OBV creado' : 'OBVs creados'}
              </p>
            ) : onNavigateToTab ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary gap-1 pl-0 mt-0.5"
                onClick={() => onNavigateToTab('obvs')}
              >
                Crear primer OBV <ChevronRight className="h-3 w-3" />
              </Button>
            ) : null}
          </ItemCard>

          {/* Ítem 5: Asunción más arriesgada */}
          <ItemCard complete={riskiestOk} icon={Lightbulb} iconBg="bg-emerald-50" iconColor="text-emerald-600">
            <p className="text-sm font-medium mb-1.5">Asunción más arriesgada</p>
            {riskiestOk ? (
              <p className="text-xs text-muted-foreground line-clamp-2">{data.riskiestAssumption}</p>
            ) : (
              <div className="space-y-1.5">
                <textarea
                  placeholder="¿Qué asunción, si es falsa, haría fracasar tu proyecto?"
                  value={riskiestInput}
                  onChange={e => setRiskiestInput(e.target.value)}
                  className="w-full text-xs p-2 border border-input rounded-lg bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={2}
                />
                <Button
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={saveRiskiest}
                  disabled={riskiestInput.trim().length < 15 || saving === 'riskiest'}
                >
                  Guardar
                </Button>
              </div>
            )}
          </ItemCard>
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente reutilizable ───────────────────────────────────────────────

interface ItemCardProps {
  complete: boolean;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
}

function ItemCard({ complete, icon: Icon, iconBg, iconColor, children }: ItemCardProps) {
  return (
    <div className={cn(
      'p-3 rounded-xl border transition-colors',
      complete ? 'bg-success/5 border-success/20' : 'bg-background border-border',
    )}>
      <div className="flex items-start gap-2.5">
        <div className={cn(
          'w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5',
          complete ? 'bg-success/10' : iconBg,
        )}>
          {complete
            ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            : <Icon className={cn('h-3.5 w-3.5', iconColor)} />
          }
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
