import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TrendingUp, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ─── Types ───────────────────────────────────────────────────────────────────

interface KeyMetricRow {
  id: string;
  date: string;
  mrr: number | null;
  burn_rate: number | null;
  cash_balance: number | null;
  total_customers: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format YYYY-MM-DD to "Mes Año" in Spanish */
function formatMonthLabel(dateStr: string): string {
  return format(new Date(dateStr + 'T12:00:00'), 'MMMM yyyy', { locale: es });
}

/** First day of current month as YYYY-MM-DD */
function currentMonthDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface KeyMetricsEditorProps {
  projectId: string;
}

export function KeyMetricsEditor({ projectId }: KeyMetricsEditorProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: currentMonthDate(),
    mrr: '',
    burn_rate: '',
    cash_balance: '',
    total_customers: '',
  });

  // ── Fetch last 6 entries ordered by date desc ──────────────────────────────
  const { data: metrics = [] } = useQuery({
    queryKey: ['key_metrics', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_metrics')
        .select('id, date, mrr, burn_rate, cash_balance, total_customers')
        .eq('project_id', projectId)
        .order('date', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as KeyMetricRow[];
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['key_metrics', projectId] });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    const mrrVal = formData.mrr.trim();
    if (!mrrVal || isNaN(Number(mrrVal)) || Number(mrrVal) < 0) {
      toast.error('Introduce un MRR válido (≥ 0)');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('key_metrics').insert({
        project_id:      projectId,
        date:            formData.date,
        mrr:             Number(formData.mrr),
        burn_rate:       formData.burn_rate  ? Number(formData.burn_rate)       : null,
        cash_balance:    formData.cash_balance ? Number(formData.cash_balance)  : null,
        total_customers: formData.total_customers ? Number(formData.total_customers) : null,
      });
      if (error) throw error;

      toast.success('Métricas registradas');
      invalidate();
      setShowForm(false);
      setFormData({ date: currentMonthDate(), mrr: '', burn_rate: '', cash_balance: '', total_customers: '' });
    } catch {
      toast.error('Error al registrar métricas');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          Métricas mensuales
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={14} className="mr-1" />
          Registrar mes
        </Button>
      </div>

      {/* Info callout */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-xl text-xs text-muted-foreground mb-4">
        <Info size={13} className="text-primary mt-0.5 shrink-0" />
        <span>El motor usa el <strong>MRR mensual</strong> para calcular la estabilidad de ingresos (O3.1). Sin datos, O3.1 = 0.</span>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-border rounded-xl p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Mes *</Label>
              <Input
                type="month"
                value={formData.date.slice(0, 7)}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value + '-01' })
                }
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">MRR (€) *</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 4500"
                value={formData.mrr}
                onChange={(e) => setFormData({ ...formData, mrr: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Burn rate (€/mes)</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 2000"
                value={formData.burn_rate}
                onChange={(e) => setFormData({ ...formData, burn_rate: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Caja disponible (€)</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 30000"
                value={formData.cash_balance}
                onChange={(e) => setFormData({ ...formData, cash_balance: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Clientes activos</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ej: 12"
                value={formData.total_customers}
                onChange={(e) => setFormData({ ...formData, total_customers: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowForm(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar mes'}
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sin métricas registradas. Añade el primer mes para activar O3.1.
        </p>
      ) : (
        <div className="space-y-2">
          {metrics.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 bg-background rounded-xl text-sm"
            >
              <span className="text-muted-foreground capitalize">
                {formatMonthLabel(m.date)}
              </span>
              <div className="flex items-center gap-4 font-medium">
                {m.mrr !== null && (
                  <span className="text-success">€{m.mrr.toLocaleString()} MRR</span>
                )}
                {m.burn_rate !== null && (
                  <span className="text-muted-foreground text-xs">burn €{m.burn_rate.toLocaleString()}</span>
                )}
                {m.total_customers !== null && (
                  <span className="text-muted-foreground text-xs">{m.total_customers} clientes</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
